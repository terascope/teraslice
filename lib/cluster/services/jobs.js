'use strict';

const Promise = require('bluebird');
const _ = require('lodash');


module.exports = function module(context) {
    const executionService = context.services.execution;
    const logger = context.foundation.makeLogger({ module: 'jobs_service' });
    const jobValidator = require('../../config/validators/job')(context);
    const parseError = require('../../utils/error_utils').parseError;

    let jobStore;

    function submitJob(jobSpec, shouldRun) {
        return _ensureAssets(jobSpec)
            .then(parsedAssetJob => _validateJob(parsedAssetJob))
            .then((validJob) => {
                const oldAssetNames = jobSpec.assets;
                const parsedAssets = validJob.assets;

                // we want to keep old names on job so that assets can be changed dynamically
                // this works since we passed __ensureAssets that make sure we have valid assets 
                validJob.assets = oldAssetNames;

                return jobStore.create(validJob)
                    .then((job) => {
                        if (!shouldRun) {
                            return { job_id: job.job_id };
                        }

                        // revert back to true asset identifiers for actual invocation
                        job.assets = parsedAssets;
                        return executionService.createExecutionContext(job);
                    });
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not submit job', errMsg);
                return Promise.reject(errMsg);
            });
    }

    function updateJob(jobId, updatedJob) {
        return _validateJob(updatedJob)
            .then(validJob => jobStore.update(jobId, validJob))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not updateJob', errMsg);
                return Promise.reject(errMsg);
            });
    }

    function startJob(jobId) {
        return getLatestExecutionId(jobId)
            .then((exId) => {
                // searching for an active execution, if there is then we reject
                if (exId) {
                    return Promise.reject(`job_id: ${jobId} is currently running, cannot have the same job concurrently running`);
                }
                return getJob(jobId)
                    .then((jobConfig) => {
                        if (!jobConfig) {
                            return Promise.reject(`no job for job_id: ${jobId} could be found`);
                        }
                        return _ensureAssets(jobConfig);
                    })
                    .then(assetIdJob => executionService.createExecutionContext(assetIdJob));
            })
            .catch((err) => {
                const errMsg = `could not startJob, error: ${parseError(err)}`;
                logger.error(errMsg);
                return Promise.reject(errMsg);
            });
    }

    function _canRecover(ex) {
        if (ex._status === 'completed') {
            throw new Error('This job has completed and can not be restarted.');
        }
        if (ex._status === 'scheduling' || ex._status === 'pending') {
            throw new Error('This job is currently being scheduled and can not be restarted.');
        }
        if (ex._status === 'running') {
            throw new Error('This job is currently successfully running and can not be restarted.');
        }
    }

    function recoverJob(jobId) {
        let previousExecutionId;
        return getLatestExecutionId(jobId)
            .then((exId) => {
                previousExecutionId = exId;
                return executionService.getExecutionContext(exId);
            })
            .then(execution => _canRecover(execution))
            .then(() => getJob(jobId))
            .then(jobSpec => _ensureAssets(jobSpec))
            .then(assetIdJob => _validateJob(assetIdJob))
            .then((validJob) => {
                // setting previous execution id so new execution can query it properly
                validJob._recover_execution = previousExecutionId;
                return validJob;
            })
            .then(recoveryJob => executionService.createExecutionContext(recoveryJob))
            .catch(err => Promise.reject(parseError(err)));
    }

    function stopJob(jobId) {
        return getLatestExecutionId(jobId)
            .then(exId => executionService.stopExecution(exId))
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

    function _getLatestExecution(jobId, _query) {
        let query = `job_id: ${jobId}`;
        if (_query) query = _query;
        return executionService.searchExecutionContexts(query, null, 1, '_created:desc')
            .then((ex) => {
                if (ex.length === 0) {
                    return Promise.reject(`no execution context was found for job_id: ${jobId}`);
                }
                return ex[0];
            });
    }

    function _getActiveExecution(jobId) {
        const str = executionService.terminalStatusList().map(state => ` _status:${state} `).join('OR');
        const query = `job_id: ${jobId} AND _context:ex NOT (${str.trim()})`;
        return _getLatestExecution(jobId, query);
    }

    function _getActiveExecutionId(jobId) {
        return _getActiveExecution(jobId)
            .then(ex => ex.ex_id);
    }

    function getLatestExecutionId(jobId) {
        return _getLatestExecution(jobId)
            .then(ex => ex.ex_id);
    }

    function _validateJob(jobSpec) {
        return new Promise(((resolve, reject) => {
            // This will throw errors if the job does not pass validation.
            let validJob;
            try {
                validJob = jobValidator.validate(jobSpec);
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

    // need execution configuration to add workers
    function addWorkers(jobId, workerCount) {
        return _getActiveExecution(jobId)
            .then(execution => executionService.addWorkers(execution, workerCount))
            .catch(err => `could not add workers, error: ${parseError(err)}`);
    }

    // only need the ex_id to stop a job
    function removeWorkers(jobId, workerCount) {
        return _getActiveExecutionId(jobId)
            .then(exId => executionService.removeWorkers(exId, workerCount))
            .catch(err => `could not remove workers, error: ${parseError(err)}`);
    }

    // don't know if it will add or remove, so we pass in execution as it contains the ex_id
    function setWorkers(jobId, workerCount) {
        return _getActiveExecution(jobId)
            .then(execution => executionService.setWorkers(execution, workerCount))
            .catch(err => `could not change the amount of workers to ${workerCount}, error: ${parseError(err)}`);
    }

    function _ensureAssets(jobConfig) {
        const jobAssets = jobConfig.assets;
        return new Promise((resolve, reject) => {
            if (!jobAssets) {
                resolve(jobConfig);
            } else {
                // convert asset references to their id's
                executionService.verifyAssets(jobAssets)
                    .then((assetMsg) => {
                        const assetIds = assetMsg.meta.map(metaObj => metaObj.id);

                        if (assetMsg.error) {
                            reject(assetMsg.error);
                        }
                        if (assetIds === 0) {
                            reject(`no asset id's were found for assets: ${JSON.stringify(jobAssets)}`);
                        }

                        if (jobAssets.length !== assetIds.length) {
                            reject(`job specified ${jobAssets.length} assets: ${jobAssets.assets} but only ${assetIds.length} where found, assets: ${assetIds}`);
                        }

                        // need to normalize asset identifiers to their id form
                        // but not mutate original job_spec
                        const parsedAssetJob = _.cloneDeep(jobConfig);
                        parsedAssetJob.assets = assetIds;
                        resolve(parsedAssetJob);
                    })
                    .catch(err => reject(`could not parse assets for their id's, error: ${parseError(err)}`));
            }
        });
    }

    const api = {
        submitJob,
        updateJob,
        startJob,
        stopJob,
        pauseJob,
        resumeJob,
        recoverJob,
        getJob,
        getJobs,
        addWorkers,
        removeWorkers,
        setWorkers,
        getLatestExecutionId,
        shutdown
    };

    function _initialize() {
        logger.info('Initializing');
        return Promise.resolve(api);
    }

    return require('../storage/jobs')(context)
        .then((job) => {
            logger.info('Initializing');
            jobStore = job;
            return _initialize(); // Load the initial pendingJobs state.
        });
};
