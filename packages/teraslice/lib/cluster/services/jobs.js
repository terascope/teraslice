'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const util = require('util');
const parseError = require('@terascope/error-parser');
const { JobValidator } = require('@terascope/job-components');
const { terasliceOpPath } = require('../../config');
const spawnAssetsLoader = require('../../workers/assets/spawn');

module.exports = function module(context) {
    const executionService = context.services.execution;
    const logger = context.apis.foundation.makeLogger({ module: 'jobs_service' });

    const jobValidator = new JobValidator(context, {
        terasliceOpPath,
        assetPath: _.get(context, 'sysconfig.teraslice.assets_directory'),
    });

    let jobStore;

    function submitJob(jobSpec, shouldRun) {
        return _ensureAssets(jobSpec)
            .then(parsedAssetJob => _validateJob(parsedAssetJob))
            .then(validJob => jobStore.create(jobSpec)
                .then((job) => {
                    if (!shouldRun) {
                        return { job_id: job.job_id };
                    }
                    const executableJobConfig = Object.assign({}, jobSpec, validJob);
                    return executionService.createExecutionContext(executableJobConfig);
                }))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Could not submit job, ${errMsg}`);
                return Promise.reject(errMsg);
            });
    }

    function updateJob(jobId, updatedJob) {
        return _ensureAssets(updatedJob)
            .then(parsedUpdatedJob => _validateJob(parsedUpdatedJob))
            .then(() => getJob(jobId))
            .then((originalJob) => {
                updatedJob._created = originalJob._created;
                return jobStore.update(jobId, updatedJob);
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not updateJob', errMsg);
                return Promise.reject(errMsg);
            });
    }

    function startJob(jobId) {
        return _getActiveExecution(jobId, true)
            .then((execution) => {
                // searching for an active execution, if there is then we reject
                if (execution !== undefined) {
                    return Promise.reject(`job_id: ${jobId} is currently running, cannot have the same job concurrently running`);
                }
                return getJob(jobId)
                    .then((jobConfig) => {
                        if (!jobConfig) {
                            return Promise.reject(`no job for job_id: ${jobId} could be found`);
                        }
                        return _ensureAssets(jobConfig);
                    })
                    .then(parsedAssetJob => _validateJob(parsedAssetJob))
                    .then(validJob => executionService.createExecutionContext(validJob));
            })
            .catch((err) => {
                const errMsg = `could not start job, error: ${parseError(err)}`;
                logger.error(errMsg);
                return Promise.reject(errMsg);
            });
    }

    function recoverJob(jobId, cleanup) {
        // we need to do validations since the job config could change between recovery
        return getJob(jobId)
            .then(jobSpec => _ensureAssets(jobSpec))
            .then(assetIdJob => _validateJob(assetIdJob))
            .then(() => getLatestExecutionId(jobId))
            .then(exId => executionService.recoverExecution(exId, cleanup))
            .catch(err => Promise.reject(parseError(err)));
    }

    function pauseJob(jobId) {
        return getLatestExecutionId(jobId)
            .then(exId => executionService.pauseExecution(exId))
            .catch(err => Promise.reject(parseError(err)));
    }

    function resumeJob(jobId) {
        return getLatestExecutionId(jobId)
            .then(exId => executionService.resumeExecution(exId))
            .catch(err => Promise.reject(parseError(err)));
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
        return executionService.searchExecutionContexts(query, null, 1, '_created:desc')
            .then((ex) => {
                if (!allowZeroResults && ex.length === 0) {
                    return Promise.reject(`no execution context was found for job_id: ${jobId}`);
                }
                return ex[0];
            });
    }

    function _getActiveExecution(jobId, allowZeroResults) {
        const str = executionService.terminalStatusList().map(state => ` _status:${state} `).join('OR');
        const query = `job_id: ${jobId} AND _context:ex NOT (${str.trim()})`;
        return getLatestExecution(jobId, query, allowZeroResults);
    }

    function _getActiveExecutionId(jobId) {
        return _getActiveExecution(jobId)
            .then(ex => ex.ex_id);
    }

    function getLatestExecutionId(jobId) {
        return getLatestExecution(jobId)
            .then(ex => ex.ex_id);
    }

    function _validateJob(jobSpec) {
        return new Promise(((resolve, reject) => {
            // This will throw errors if the job does not pass validation.
            let validJob;
            try {
                validJob = jobValidator.validateConfig(jobSpec);
            } catch (ev) {
                reject(`Error validating job: ${ev}`);
            }

            resolve(validJob);
        }));
    }

    function shutdown() {
        return jobStore.shutdown()
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error while shutting down job stores, error: ${errMsg}`);
                // no matter what we need to shutdown
                return true;
            });
    }

    function addWorkers(jobId, workerCount) {
        return _getActiveExecutionId(jobId)
            .then(exId => executionService.addWorkers(exId, workerCount));
    }

    function removeWorkers(jobId, workerCount) {
        return _getActiveExecutionId(jobId)
            .then(exId => executionService.removeWorkers(exId, workerCount));
    }

    function setWorkers(jobId, workerCount) {
        return _getActiveExecutionId(jobId)
            .then(exId => executionService.setWorkers(exId, workerCount));
    }

    function _ensureAssets(jobConfig) {
        const jobAssets = jobConfig.assets;
        return new Promise((resolve, reject) => {
            if (!jobAssets) {
                resolve(jobConfig);
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
        shutdown
    };

    function _initialize() {
        logger.info('job service is initializing...');
        return Promise.resolve(api);
    }

    return require('../storage/jobs')(context)
        .then((job) => {
            jobStore = job;
            return _initialize(); // Load the initial pendingJobs state.
        });
};
