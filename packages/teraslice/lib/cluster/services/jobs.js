'use strict';

const {
    TSError,
    uniq,
    get,
    logError,
    cloneDeep,
    isEmpty,
    getTypeOf,
    isString,
} = require('@terascope/utils');
const { JobValidator } = require('@terascope/job-components');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const spawnAssetsLoader = require('../../workers/assets/spawn');
const { terasliceOpPath } = require('../../config');
const makeJobStore = require('../storage/jobs');

module.exports = async function jobsService(context) {
    const executionService = context.services.execution;
    const logger = makeLogger(context, 'jobs_service');

    const jobValidator = new JobValidator(context, {
        terasliceOpPath,
        assetPath: get(context, 'sysconfig.teraslice.assets_directory'),
    });

    let jobStore;

    async function submitJob(jobSpec, shouldRun) {
        if (jobSpec.job_id) {
            throw new TSError('Job cannot include a job_id on submit', {
                statusCode: 422,
            });
        }

        const parsedAssetJob = await _ensureAssets(jobSpec);
        const validJob = await _validateJob(parsedAssetJob);
        const job = await jobStore.create(jobSpec);
        if (!shouldRun) {
            return { job_id: job.job_id };
        }
        const exConfig = Object.assign(jobSpec, validJob, {
            job_id: job.job_id
        });
        return executionService.createExecutionContext(exConfig);
    }

    async function updateJob(jobId, updatedJob) {
        const parsedUpdatedJob = await _ensureAssets(updatedJob);
        await _validateJob(parsedUpdatedJob);
        const originalJob = await getJob(jobId);
        updatedJob._created = originalJob._created;
        return jobStore.update(jobId, updatedJob);
    }

    async function startJob(jobId) {
        const execution = await _getActiveExecution(jobId, true);
        // searching for an active execution, if there is then we reject
        if (execution != null) {
            throw new TSError(`Job ${jobId} is currently running, cannot have the same job concurrently running`, {
                statusCode: 409
            });
        }
        const jobConfig = await getJob(jobId);
        if (!jobConfig) {
            throw new TSError(`Job ${jobId} not found`, {
                statusCode: 404,
            });
        }
        const parsedAssetJob = await _ensureAssets(jobConfig);
        const validJob = await _validateJob(parsedAssetJob);
        return executionService.createExecutionContext(validJob);
    }

    async function recoverJob(jobId, cleanupType) {
        // we need to do validations since the job config could change between recovery
        const jobSpec = await getJob(jobId);
        const assetIdJob = await _ensureAssets(jobSpec);
        await _validateJob(assetIdJob);
        const execution = await getLatestExecution(jobId);
        // apply the latest job config changes
        Object.assign(execution, jobSpec);
        return executionService.recoverExecution(execution, cleanupType);
    }

    async function pauseJob(jobId) {
        return getLatestExecutionId(jobId).then((exId) => executionService.pauseExecution(exId));
    }

    async function resumeJob(jobId) {
        return getLatestExecutionId(jobId).then((exId) => executionService.resumeExecution(exId));
    }

    async function getJob(jobId) {
        return jobStore.get(jobId);
    }

    async function getJobs(from, size, sort) {
        return jobStore.search('job_id:*', from, size, sort);
    }

    async function getLatestExecution(jobId, _query, allowZero) {
        if (!jobId || !isString(jobId)) {
            throw new TSError(`Invalid job id, got ${getTypeOf(jobId)}`);
        }
        const allowZeroResults = allowZero || false;
        let query = `job_id: "${jobId}"`;
        if (_query) query = _query;

        const ex = await executionService.searchExecutionContexts(query, null, 1, '_created:desc');
        if (!allowZeroResults && ex.length === 0) {
            throw new TSError(`No execution was found for job ${jobId}`, {
                statusCode: 404
            });
        }
        return ex[0];
    }

    async function _getActiveExecution(jobId, allowZeroResults) {
        const str = executionService
            .terminalStatusList()
            .map((state) => ` _status:"${state}"`)
            .join(' OR ');
        const query = `job_id:"${jobId}" AND _context:ex NOT (${str.trim()})`;
        return getLatestExecution(jobId, query, allowZeroResults);
    }

    async function _getActiveExecutionId(jobId) {
        return _getActiveExecution(jobId).then((ex) => ex.ex_id);
    }

    async function getLatestExecutionId(jobId) {
        return getLatestExecution(jobId).then((ex) => ex.ex_id);
    }

    async function _validateJob(jobSpec) {
        return jobValidator.validateConfig(jobSpec);
    }

    async function shutdown() {
        return jobStore.shutdown().catch((err) => {
            logError(logger, err, 'Error while shutting down job stores');
            // no matter what we need to shutdown
            return true;
        });
    }

    async function addWorkers(jobId, workerCount) {
        const exId = await _getActiveExecutionId(jobId);
        return executionService.addWorkers(exId, workerCount);
    }

    async function removeWorkers(jobId, workerCount) {
        const exId = await _getActiveExecutionId(jobId);
        return executionService.removeWorkers(exId, workerCount);
    }

    async function setWorkers(jobId, workerCount) {
        const exId = await _getActiveExecutionId(jobId);
        return executionService.setWorkers(exId, workerCount);
    }

    function _ensureAssets(jobConfig) {
        const jobAssets = uniq(jobConfig.assets || []);
        return new Promise((resolve, reject) => {
            if (isEmpty(jobAssets)) {
                resolve(cloneDeep(jobConfig));
            } else {
                // convert asset references to their id's
                spawnAssetsLoader(jobAssets)
                    .then((assetIds) => {
                        if (assetIds.length === 0) {
                            reject(new Error(`no asset id's were found for assets: ${JSON.stringify(jobAssets)}`));
                            return;
                        }

                        if (jobAssets.length !== assetIds.length) {
                            reject(new Error(`job specified ${jobAssets.length} assets: ${jobAssets.assets} but only ${assetIds.length} where found, assets: ${assetIds}`));
                            return;
                        }

                        // need to normalize asset identifiers to their id form
                        // but not mutate original job_spec
                        const parsedAssetJob = cloneDeep(jobConfig);
                        parsedAssetJob.assets = assetIds;
                        resolve(parsedAssetJob);
                    })
                    .catch((err) => reject(err));
            }
        });
    }

    jobStore = await makeJobStore(context);
    logger.info('job service is initializing...');
    return {
        submitJob,
        updateJob,
        startJob,
        pauseJob,
        resumeJob,
        recoverJob,
        getJob,
        getJobs,
        addWorkers,
        removeWorkers,
        setWorkers,
        getLatestExecutionId,
        getLatestExecution,
        shutdown,
    }; // Load the initial pendingJobs state.
};
