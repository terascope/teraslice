'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const util = require('util');
const path = require('path');
const parseError = require('@terascope/error-parser');
const { JobValidator } = require('@terascope/job-components');

module.exports = function module(context) {
    const executionService = context.services.execution;
    const logger = context.apis.foundation.makeLogger({ module: 'jobs_service' });

    const jobValidator = new JobValidator(context, {
        terasliceOpPath: path.join(__dirname, '..', '..'),
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

    function _getLatestExecution(jobId, _query, allowZero) {
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
        return _getLatestExecution(jobId, query, allowZeroResults);
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
        shutdown
    };

    function _initialize() {
        logger.info('Initializing');
        return Promise.resolve(api);
    }

    return require('../storage/jobs')(context)
        .then((job) => {
            jobStore = job;
            return _initialize(); // Load the initial pendingJobs state.
        });
};
