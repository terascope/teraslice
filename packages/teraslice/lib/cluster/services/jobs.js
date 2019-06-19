'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const util = require('util');
const { TSError } = require('@terascope/utils');
const { JobValidator } = require('@terascope/job-components');
const { terasliceOpPath } = require('../../config');
const spawnAssetsLoader = require('../../workers/assets/spawn');
const makeJobStore = require('../storage/jobs');

module.exports = function module(context) {
    const executionService = context.services.execution;
    const logger = context.apis.foundation.makeLogger({ module: 'jobs_service' });

    const jobValidator = new JobValidator(context, {
        terasliceOpPath,
        assetPath: _.get(context, 'sysconfig.teraslice.assets_directory'),
    });

    let jobStore;

    function submitJob(jobSpec, shouldRun) {
        if (jobSpec.job_id) {
            return Promise.reject(
                new TSError('Job cannot include a job_id on submit', {
                    statusCode: 422,
                })
            );
        }

        return _ensureAssets(jobSpec)
            .then(parsedAssetJob => _validateJob(parsedAssetJob))
            .then(validJob => jobStore.create(jobSpec).then((job) => {
                if (!shouldRun) {
                    return { job_id: job.job_id };
                }

                const exConfig = Object.assign({}, jobSpec, validJob, {
                    job_id: job.job_id,
                });
                return executionService.createExecutionContext(exConfig);
            }));
    }

    function updateJob(jobId, updatedJob) {
        return _ensureAssets(updatedJob)
            .then(parsedUpdatedJob => _validateJob(parsedUpdatedJob))
            .then(() => getJob(jobId))
            .then((originalJob) => {
                updatedJob._created = originalJob._created;
                return jobStore.update(jobId, updatedJob);
            });
    }

    function startJob(jobId) {
        return _getActiveExecution(jobId, true).then((execution) => {
            // searching for an active execution, if there is then we reject
            if (execution != null) {
                const error = new TSError(
                    `Job ${jobId} is currently running, cannot have the same job concurrently running`
                );
                error.code = 409;
                return Promise.reject(error);
            }

            return getJob(jobId)
                .then((jobConfig) => {
                    if (!jobConfig) {
                        return Promise.reject(
                            new TSError(`Job ${jobId} not found`, {
                                statusCode: 404,
                            })
                        );
                    }
                    return _ensureAssets(jobConfig);
                })
                .then(parsedAssetJob => _validateJob(parsedAssetJob))
                .then(validJob => executionService.createExecutionContext(validJob));
        });
    }

    function recoverJob(jobId, cleanup) {
        // we need to do validations since the job config could change between recovery
        return getJob(jobId)
            .then(jobSpec => _ensureAssets(jobSpec))
            .then(assetIdJob => _validateJob(assetIdJob))
            .then(() => getLatestExecutionId(jobId))
            .then(exId => executionService.recoverExecution(exId, cleanup));
    }

    function pauseJob(jobId) {
        return getLatestExecutionId(jobId).then(exId => executionService.pauseExecution(exId));
    }

    function resumeJob(jobId) {
        return getLatestExecutionId(jobId).then(exId => executionService.resumeExecution(exId));
    }

    function getJob(jobId) {
        return jobStore.get(jobId);
    }

    function getJobs(from, size, sort) {
        return jobStore.search('job_id:*', from, size, sort);
    }

    function getLatestExecution(jobId, _query, allowZero) {
        const allowZeroResults = allowZero || false;
        let query = `job_id: ${jobId}`;
        if (_query) query = _query;
        return executionService
            .searchExecutionContexts(query, null, 1, '_created:desc')
            .then((ex) => {
                if (!allowZeroResults && ex.length === 0) {
                    const error = new Error(`No execution was found for job ${jobId}`);
                    error.code = 404;
                    return Promise.reject(error);
                }
                return ex[0];
            });
    }

    function _getActiveExecution(jobId, allowZeroResults) {
        const str = executionService
            .terminalStatusList()
            .map(state => ` _status:${state} `)
            .join('OR');
        const query = `job_id: ${jobId} AND _context:ex NOT (${str.trim()})`;
        return getLatestExecution(jobId, query, allowZeroResults);
    }

    function _getActiveExecutionId(jobId) {
        return _getActiveExecution(jobId).then(ex => ex.ex_id);
    }

    function getLatestExecutionId(jobId) {
        return getLatestExecution(jobId).then(ex => ex.ex_id);
    }

    async function _validateJob(jobSpec) {
        return jobValidator.validateConfig(jobSpec);
    }

    function shutdown() {
        return jobStore.shutdown().catch((err) => {
            logger.error(err, 'Error while shutting down job stores');
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
        const jobAssets = jobConfig.assets;
        return new Promise((resolve, reject) => {
            if (_.isEmpty(jobAssets)) {
                resolve(jobConfig);
            } else {
                // convert asset references to their id's
                spawnAssetsLoader(jobAssets)
                    .then((assetIds) => {
                        if (assetIds.length === 0) {
                            reject(
                                new Error(
                                    `no asset id's were found for assets: ${JSON.stringify(
                                        jobAssets
                                    )}`
                                )
                            );
                            return;
                        }

                        if (jobAssets.length !== assetIds.length) {
                            reject(
                                new Error(
                                    `job specified ${jobAssets.length} assets: ${jobAssets.assets} but only ${assetIds.length} where found, assets: ${assetIds}`
                                )
                            );
                            return;
                        }

                        // need to normalize asset identifiers to their id form
                        // but not mutate original job_spec
                        const parsedAssetJob = _.cloneDeep(jobConfig);
                        parsedAssetJob.assets = assetIds;
                        resolve(parsedAssetJob);
                    })
                    .catch(err => reject(err));
            }
        });
    }

    const depMsg = 'endpoint /jobs/:job_id/_recover is being depricated, please use the /ex/:ex_id/_recover endpoint';

    const api = {
        submitJob,
        updateJob,
        startJob,
        pauseJob,
        resumeJob,
        recoverJob: util.deprecate(recoverJob, depMsg),
        getJob,
        getJobs,
        addWorkers,
        removeWorkers,
        setWorkers,
        getLatestExecutionId,
        getLatestExecution,
        shutdown,
    };

    function _initialize() {
        logger.info('job service is initializing...');
        return Promise.resolve(api);
    }

    return makeJobStore(context).then((job) => {
        jobStore = job;
        return _initialize(); // Load the initial pendingJobs state.
    });
};
