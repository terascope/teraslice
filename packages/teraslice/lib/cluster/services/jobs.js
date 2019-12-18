'use strict';

const defaultsDeep = require('lodash/defaultsDeep');
const {
    TSError,
    uniq,
    get,
    cloneDeep,
    isEmpty,
    getTypeOf,
    isString,
} = require('@terascope/utils');
const { JobValidator } = require('@terascope/job-components');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const spawnAssetsLoader = require('../../workers/assets/spawn');
const { terasliceOpPath } = require('../../config');

/**
 * New execution result
 * @typedef NewExecutionResult
 * @property {string} job_id
 * @property {string} ex_id
 */

module.exports = function jobsService(context) {
    let executionService;
    let exStore;
    let stateStore;
    let jobStore;

    const logger = makeLogger(context, 'jobs_service');

    const jobValidator = new JobValidator(context, {
        terasliceOpPath,
        assetPath: get(context, 'sysconfig.teraslice.assets_directory'),
    });

    /**
     * Validate the job spec
     *
     * @returns {Promise<import('@terascope/job-components').ValidatedJobConfig>}
    */
    async function _validateJobSpec(jobSpec) {
        const parsedAssetJob = await _ensureAssets(cloneDeep(jobSpec));
        const validJob = await jobValidator.validateConfig(parsedAssetJob);
        return validJob;
    }

    async function submitJob(jobSpec, shouldRun) {
        if (jobSpec.job_id) {
            throw new TSError('Job cannot include a job_id on submit', {
                statusCode: 422,
            });
        }

        const validJob = await _validateJobSpec(jobSpec);
        const job = await jobStore.create(jobSpec);
        if (!shouldRun) {
            return { job_id: job.job_id };
        }

        const exConfig = Object.assign({}, jobSpec, validJob, {
            job_id: job.job_id
        });
        return executionService.createExecutionContext(exConfig);
    }

    async function updateJob(jobId, jobSpec) {
        await _validateJobSpec(jobSpec);
        const originalJob = await getJob(jobId);
        return jobStore.update(jobId, Object.assign({}, jobSpec, {
            _created: originalJob._created
        }));
    }

    /**
     * Start a Job
     *
     * @param {string} jobId
     * @returns {Promise<NewExecutionResult>}
    */
    async function startJob(jobId) {
        const activeExecution = await _getActiveExecution(jobId, true);

        // searching for an active execution, if there is then we reject
        if (activeExecution) {
            throw new TSError(`Job ${jobId} is currently running, cannot have the same job concurrently running`, {
                statusCode: 409
            });
        }

        const jobSpec = await getJob(jobId);
        const validJob = await _validateJobSpec(jobSpec);

        if (validJob.autorecover) {
            return _recoverValidJob(validJob);
        }

        return executionService.createExecutionContext(validJob);
    }

    /**
     * Recover a job using the valid configuration
     *
     * @private
     * @param {import('@terascope/job-components').ValidatedJobConfig} validJob
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @returns {Promise<NewExecutionResult>}
    */
    async function _recoverValidJob(validJob, cleanupType) {
        const recoverFrom = await getLatestExecution(validJob.job_id, undefined, true);

        // if there isn't an execution and autorecover is true
        // create a new execution else throw
        if (!recoverFrom) {
            if (validJob.autorecover) {
                return executionService.createExecutionContext(validJob);
            }

            throw new TSError(`Job ${validJob.job_id} is missing an execution to recover from`, {
                statusCode: 404
            });
        }

        const count = await stateStore.countRecoverySlices(recoverFrom.ex_id, -1, cleanupType);
        if (!count) {
            if (validJob.autorecover) {
                return executionService.createExecutionContext(validJob);
            }

            throw new Error('No slices found to recover');
        }

        return executionService.recoverExecution(
            // apply the latest job config changes
            defaultsDeep({}, validJob, recoverFrom),
            cleanupType
        );
    }

    /**
     * Recover a job, applied the last changes to the prev execution
     *
     * @param {string} jobId
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @returns {Promise<NewExecutionResult>}
    */
    async function recoverJob(jobId, cleanupType) {
        // we need to do validations since the job config could change between recovery
        const jobSpec = await getJob(jobId);
        const validJob = await _validateJobSpec(jobSpec);
        return _recoverValidJob(validJob, cleanupType);
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

    /**
     * Get the latest execution
     *
     * @param {string} jobId
     * @param {string} [query]
     * @param {boolean=false} [allowZeroResults]
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    async function getLatestExecution(jobId, query, allowZeroResults = false) {
        if (!jobId || !isString(jobId)) {
            throw new TSError(`Invalid job id, got ${getTypeOf(jobId)}`);
        }

        const ex = await exStore.search(
            query || `job_id: "${jobId}"`, null, 1, '_created:desc'
        );

        if (!allowZeroResults && !ex.length) {
            throw new TSError(`No execution was found for job ${jobId}`, {
                statusCode: 404
            });
        }
        return ex[0];
    }

    /**
     * Get the active execution
     *
     * @param {string} jobId
     * @param {boolean} [allowZeroResults]
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    async function _getActiveExecution(jobId, allowZeroResults) {
        const str = exStore
            .getTerminalStatuses()
            .map((state) => ` _status:"${state}"`)
            .join(' OR ');
        const query = `job_id:"${jobId}" AND _context:ex NOT (${str.trim()})`;
        return getLatestExecution(jobId, query, allowZeroResults);
    }

    /**
     * Get the active execution
     *
     * @param {string} jobId
     * @param {boolean} [allowZeroResults]
     * @returns {Promise<import('@terascope/job-components').ExecutionConfig>}
    */
    async function _getActiveExecutionId(jobId) {
        return _getActiveExecution(jobId).then((ex) => ex.ex_id);
    }

    async function getLatestExecutionId(jobId) {
        return getLatestExecution(jobId).then((ex) => ex.ex_id);
    }

    async function shutdown() {

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

    async function _ensureAssets(jobConfig) {
        const jobAssets = uniq(jobConfig.assets || []);
        if (isEmpty(jobAssets)) {
            return cloneDeep(jobConfig);
        }
        // convert asset references to their id's
        const assetIds = await spawnAssetsLoader(jobAssets);
        if (!assetIds.length) {
            throw new Error(`no asset id's were found for assets: ${JSON.stringify(jobAssets)}`);
        }

        if (jobAssets.length !== assetIds.length) {
            throw new Error(`job specified ${jobAssets.length} assets: ${jobAssets.assets} but only ${assetIds.length} where found, assets: ${assetIds}`);
        }

        // need to normalize asset identifiers to their id form
        // but not mutate original job_spec
        const parsedAssetJob = cloneDeep(jobConfig);
        parsedAssetJob.assets = assetIds;
        return parsedAssetJob;
    }

    async function initialize() {
        logger.info('job service is initializing...');

        exStore = context.stores.execution;
        jobStore = context.stores.jobs;
        stateStore = context.stores.state;

        if (jobStore == null || exStore == null || stateStore == null) {
            throw new Error('Missing required stores');
        }

        executionService = context.services.execution;
        if (executionService == null) {
            throw new Error('Missing required services');
        }
    }

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
        initialize,
        shutdown,
    }; // Load the initial pendingJobs state.
};
