'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const Queue = require('queue');

// Queue of jobs pending processing
const pendingExecutionQueue = new Queue();

/*
 Job Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */

// TODO: work with asset store to get asset id's
// Maps job notification to execution states
const STATE_MAPPING = {
    stop: 'stopped',
    pause: 'paused',
    resume: 'running',
    moderator_paused: 'moderator_paused'
};

// Maps job control messages into cluster control messages.
const MESSAGE_MAPPING = {
    pause: 'cluster:job:pause',
    resume: 'cluster:job:resume',
    restart: 'cluster:job:restart',
    stop: 'cluster:job:stop',
    terminated: 'cluster:job:stop',
    moderator_paused: 'cluster:job:pause'
};

module.exports = function module(context) {
    const events = context.foundation.getEventEmitter();
    const clusterService = context.services.cluster;
    const logger = context.foundation.makeLogger({ module: 'jobs_service' });
    const jobValidator = require('../../config/validators/job')(context);
    const parseError = require('../../utils/error_utils').parseError;
    const shortid = require('shortid');

    let jobStore;
    let exStore;

    function _exSearch(query) {
        return exStore.search(query, null, 10000)
            .then(jobs => jobs)
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not findJob', errMsg);
                return Promise.reject(errMsg);
            });
    }

    function _saveJob(job, jobType) {
        if (jobType === 'job') {
            return jobStore.create(job);
        }

        return exStore.create(job);
    }

    function _createExecutionContext(job) {
        return _saveJob(job, 'ex')
            .then(ex => setExecutionStatus(ex.ex_id, 'pending')
                .then(() => {
                    logger.debug('enqueueing job to be processed, job', ex);
                    pendingExecutionQueue.enqueue(ex);
                    return { job_id: ex.job_id };
                })
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error('could not set to pending', errMsg);
                    return Promise.reject(errMsg);
                }))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not create execution context', errMsg);
                return Promise.reject(errMsg);
            });
    }
    // FIXME: this should not emit, should talk to cluster service directly
    // TODO: move asset parsing of ids to assets store, call in there from here
    function _ensureAssets(jobSpec) {
        return new Promise(((resolve, reject) => {
            if (!jobSpec.assets) {
                resolve(jobSpec);
            } else {
                const id = shortid.generate();
                events.once(id, (msg) => {
                    if (msg.error) {
                        reject(msg.error);
                    }
                    if (!msg.assets) {
                        reject(`no asset was found for ${jobSpec.assets}`);
                        return;
                    }

                    if (msg.assets.length !== jobSpec.assets.length) {
                        reject(`job specified ${jobSpec.assets.length} assets: ${jobSpec.assets} but only ${msg.assets.length}
                        where found, assets: ${msg.assets}`);
                        return;
                    }

                    // need to normalize asset identifiers to their id form
                    // but not mutate original job_spec
                    const parsedAssetJob = _.cloneDeep(jobSpec);
                    parsedAssetJob.assets = msg.assets;
                    resolve(parsedAssetJob);
                });

                events.emit('jobs_service:verify_assets', { assets: jobSpec.assets, _msgID: id });
            }
        }));
    }

    function submitJob(jobSpec, shouldRun) {
        return _ensureAssets(jobSpec)
            .then(parsedAssetJob => _validateJob(parsedAssetJob))
            .then((validJob) => {
                const oldAssetNames = jobSpec.assets;
                const parsedAssets = validJob.assets;

                // we want to keep old names on job so that assets can be changed dynamically
                // this works since we passed _ensureAssets that make sure we have valid assets 
                validJob.assets = oldAssetNames;

                return _saveJob(validJob, 'job')
                    .then((job) => {
                        if (!shouldRun) {
                            return { job_id: job.job_id };
                        }

                        // revert back to true asset identifiers for actual invocation
                        job.assets = parsedAssets;
                        return _createExecutionContext(job);
                    });
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not submit job', errMsg);
                return Promise.reject(errMsg);
            });
    }

    // Updates the job but does not automatically start it.
    function updateJob(jobId, jobUpdates) {
        return getJob(jobId)
            .then((jobConfig) => {
                const updatedJob = _.assign({}, jobConfig, jobUpdates);
                return _validateJob(updatedJob);
            })
            .then(validJob => jobStore.update(jobId, validJob))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not updateJob', errMsg);
                return Promise.reject(errMsg);
            });
    }


    function updateExecution(exId, updateConfig) {
        return exStore.update(exId, updateConfig)
            .catch(err => logger.error(`failed to update ex ${exId} with new data: ${JSON.stringify(updateConfig)}, error: ${parseError(err)}`));
    }
    // TODO: review this function
    // Valid notifications: stop, pause, resume
    function notify(exId, state) {
        const status = STATE_MAPPING[state];

        return _signalJobStateChange(exId, state, status)
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not notify', errMsg);
                return Promise.reject(errMsg);
            });
    }

    function startJob(jobId) {
        return getJob(jobId)
            .then((jobConfig) => {
                if (!jobConfig) {
                    return Promise.reject(`no job for job_id: ${jobId} could be found`);
                }
                return _ensureAssets(jobConfig);
            })
            .then(assetIdJob => _createExecutionContext(assetIdJob))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not startJob', errMsg);
                return Promise.reject(errMsg);
            });
    }
    // TODO: verify that a new ex_id is made in whatever is using this
    function restartExecution(jobId) {
        return isExecutionActive(jobId)
            .then((isAlreadyRunning) => {
                if (isAlreadyRunning) {
                    return Promise.reject(`job_id: ${jobId} is currently running, cannot have the same job concurrently running`);
                }
                return getJob(jobId)
                    .then(jobSpec => _ensureAssets(jobSpec))
                    .then(assetIdJob => _createExecutionContext(assetIdJob));
            })
            .catch((err) => {
                const errMsg = `could not startJob, error: ${parseError(err)}`;
                logger.error(errMsg);
                return Promise.reject(errMsg);
            });
    }

    function canRecover(ex) {
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
        return getLatestExecutionId(jobId)
            .then(exId => getExecutionContext(exId))
            .then(execution => canRecover(execution))
            .then(() => getJob(jobId))
            .then(jobSpec => _ensureAssets(jobSpec))
            .then(assetIdJob => _validateJob(assetIdJob))
            .then((validJob) => {
                // setting recovery key so new execution will have it saved properly
                validJob._recover_execution = true;
                return validJob;
            })
            .then(recoveryJob => _createExecutionContext(recoveryJob))
            .catch(err => Promise.reject(parseError(err)));
    }

    function getJob(jobId) {
        return jobStore.get(jobId)
            .then(jobSpec => jobSpec)
            .catch((err) => {
                logger.error(`could not get job for job_id: ${jobId}`, err);
            });
    }

    function getJobs(from, size, sort) {
        return jobStore.getJobs(from, size, sort);
    }

    function searchExecutionContexts(status, from, _size, sort) {
        let size = 10000;
        if (_size) size = _size;
        return exStore.searchExecutionContexts(status, from, size, sort);
    }

    function getExecutionContext(exId) {
        return exStore.get(exId)
            .then(ex => ex)
            .catch(err => logger.error(`error getting execution context for ex: ${exId}`, err));
    }

    function getJobStateRecords(query, from, size, sort) {
        return jobStore.getJobStateRecords(query, from, size, sort);
    }

    function isExecutionActive(jobId) {
        const str = exStore.getTerminalStatuses().map(state => ` _status:${state} `).join('OR');
        const query = `job_id: ${jobId} AND _context:ex NOT (${str.trim()})`;
        return exStore.search(query, null, 1, '_created:desc')
            .then((ex) => {
                if (ex.length === 0) {
                    return false;
                }
                return true;
            });
    }

    function getLatestExecutionId(jobId) {
        const query = `job_id: ${jobId} AND _context:ex`;
        return exStore.search(query, null, 1, '_created:desc')
            .then((ex) => {
                if (ex.length === 0) {
                    return Promise.reject(`no execution context was found for job_id: ${jobId}`);
                }
                return ex[0].ex_id;
            });
    }

    function errorMetaData(data) {
        const metaData = { _has_errors: 'true', _slicer_stats: data.slicer_stats };
        logger.error(`job ${data.ex_id} has failed to complete`);

        if (data.error) {
            metaData._failureReason = data.error;
        }
        return metaData;
    }

    function setExecutionStatus(exId, status, metaData) {
        return exStore.setStatus(exId, status, metaData);
    }

    // Checks the queue of pending jobs and will allocate any workers required.
    function _jobAllocator() {
        let allocatingJob = false;

        return function allocator() {
            const pendingQueueSize = pendingExecutionQueue.size();
            if (!allocatingJob && pendingQueueSize > 0 && clusterService.readyForAllocation()) {
                allocatingJob = true;
                const execution = pendingExecutionQueue.dequeue();
                const recoverExecution = execution._recover_execution;

                logger.info(`Scheduling job: ${execution.ex_id}`);

                setExecutionStatus(execution.ex_id, 'scheduling')
                    .then(() => {
                        clusterService.allocateSlicer(execution, recoverExecution)
                            .then(() => setExecutionStatus(execution.ex_id, 'initializing', {
                                slicer_port: execution.slicer_port,
                                slicer_hostname: execution.slicer_hostname
                            }))
                            .then(() => clusterService.allocateWorkers(execution, execution.workers)
                                .then(() => {
                                    allocatingJob = false;
                                    allocator();
                                })
                                .catch((err) => {
                                    // this is to catch errors of allocateWorkers
                                    // if allocation fails, they are enqueued
                                    logger.error(`Workers failed to be allocated, they will be enqueued, error: ${parseError(err)}`);
                                    allocatingJob = false;
                                    allocator();
                                }))
                            .catch((err) => {
                                logger.error(`Failure during worker allocation - ${parseError(err)}`);
                                allocatingJob = false;
                                setExecutionStatus(execution.ex_id, 'failed');
                                allocator();
                            });
                    });
            }
        };
    }

    function stopJob(jobId) {
        return getLatestExecutionId(jobId)
            .then(exId => clusterService.stopExecution(exId)
                .then(() => {
                    logger.info(`execution ${exId} has changed status to stopped`);
                    return setExecutionStatus(exId, STATE_MAPPING.stop);
                })
                .then(() => STATE_MAPPING.stop))
            .catch(err => Promise.reject(parseError(err)));
    }

    function pauseJob(jobId) {
        return getLatestExecutionId(jobId)
            .then(exId => clusterService.pauseExecution(exId)
                .then(() => {
                    logger.info(`execution ${exId} has changed status to paused`);
                    return setExecutionStatus(exId, STATE_MAPPING.pause);
                })
                .then(() => STATE_MAPPING.pause))
            .catch(err => Promise.reject(parseError(err)));
    }

    function resumeJob(jobId) {
        return getLatestExecutionId(jobId)
            .then(exId => clusterService.resumeExecution(exId)
                .then(() => {
                    logger.info(`execution ${exId} has changed status to resumed`);
                    return setExecutionStatus(exId, STATE_MAPPING.resume);
                })
                .then(() => STATE_MAPPING.resume))
            .catch(err => Promise.reject(parseError(err)));
    }

    function _signalJobStateChange(exId, notice, state, excludeNode) {
        return _notifyCluster(exId, notice, excludeNode)
            .then(() => exStore.get(exId)
                .then((jobSpec) => {
                    logger.info(`job ${exId} has changed to state`, state);
                    return setExecutionStatus(jobSpec.ex_id, state);
                })
                .then(() => state))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not signal job state change', errMsg);
                return Promise.reject(errMsg);
            });
    }

    function _notifyCluster(exId, notice, excludeNode) {
        let slicerOnly = false;
        if (notice === 'pause' || notice === 'resume' || notice === 'moderator_paused') slicerOnly = true;
        if (!MESSAGE_MAPPING[notice]) {
            throw new Error('JobsService: invalid notification message');
        }
        const message = MESSAGE_MAPPING[notice];
        return clusterService.notifyNodesForEx(exId, message, slicerOnly, excludeNode);
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
    // FIXME: clusterService.getClusterType, the env lives in node master, make it live in sysconfig
    function _isNative() {
        const clusterType = process.env.CLUSTER_MANAGER_TYPE;
        if (clusterType === 'undefined' || clusterType === 'native') {
            return true;
        }
        return false;
    }

    function shutdown() {
        logger.info('shutting down');
        const query = exStore.getRunningStatuses().map(str => `_status:${str}`).join(' OR ');
        return _exSearch(query)
            .map((job) => {
                if (_isNative()) {
                    logger.warn(`marking job ${job.job_id}, ex_id: ${job.ex_id} as terminated`);
                    // need to exclude sending a stop to cluster master host, the shutdown event
                    // has already been propagated this can cause a condition of it waiting for
                    // stop to return but it already has which pauses this service shutdown
                    return _signalJobStateChange(job.ex_id, 'stop', 'terminated', context.sysconfig.teraslice.hostname);
                }
                return true;
            })
            .then(() => Promise.all([jobStore.shutdown(), exStore.shutdown()]))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error while shutting down job/ex stores, error: ${errMsg}`);
                // no matter what we need to shutdown
                return true;
            });
    }

    function addWorkers(jobId, workerCount) {
        return Promise.all([getLatestExecutionId(jobId), isExecutionActive(jobId)])
            .spread((exId, isActive) => {
                if (isActive) {
                    return getExecutionContext(exId)
                        .then(execution => clusterService.addWorkers(execution, workerCount));
                }
                return Promise.reject(`execution ${exId} is not active`);
            })
            .catch(err => `could not add workers, error: ${parseError(err)}`);
    }

    function removeWorkers(jobId, workerCount) {
        return Promise.all([getLatestExecutionId(jobId), isExecutionActive(jobId)])
            .spread((exId, isActive) => {
                if (isActive) {
                    return clusterService.removeWorkers(exId, workerCount);
                }
                return Promise.reject(`execution ${exId} is not active`);
            })
            .catch(err => `could not remove workers, error: ${parseError(err)}`);
    }
    // TODO: review this
    function setWorkers(jobId, workerCount) {
        return Promise.all([getLatestExecutionId(jobId), isExecutionActive(jobId)])
            .spread((exId, isActive) => {
                if (isActive) {
                    const totalWorker = clusterService.findWorkersByExecutionID(exId).length;
                    if (totalWorker > workerCount) {
                        const removedWorkersCount = totalWorker - workerCount;
                        return clusterService.removeWorkers(exId, removedWorkersCount);
                    }
                    if (totalWorker < workerCount) {
                        const addWorkersCount = workerCount - totalWorker;
                        return getExecutionContext(exId)
                            .then(execution => clusterService.addWorkers(
                                execution,
                                addWorkersCount
                            ));
                    }
                }
                return Promise.reject(`execution ${exId} is not active`);
            })
            .catch(err => `could not change the amount of workers to ${workerCount}, error: ${parseError(err)}`);
    }

    // TODO: clean this up
    const api = {
        submitJob,
        updateJob,
        updateExecution,
        setExecutionStatus,
        errorMetaData,
        addWorkers,
        removeWorkers,
        setWorkers,
        notify,
        getJob,
        getJobs,
        getExecutionContext,
        searchExecutionContexts,
        getJobStateRecords,
        getLatestExecutionId,
        isExecutionActive,
        startJob,
        stopJob,
        pauseJob,
        resumeJob,
        recoverJob,
        shutdown
    };

    function _initialize() {
        // Reschedule any persistent jobs that were running.
        // There may be some additional subtlety required here.
        return searchExecutionContexts('running').each((job) => {
            // TODO: For this restarting to work correctly we need to check the job on the running
            // cluster to make sure it's not still running after a cluster_master restart.
            if (job.lifecycle === 'persistent') {
                // pendingExecutionQueue.enqueue(job);
            } else {
                // setExecutionStatus(job.ex_id, 'aborted');
            }
        })
            .then(() =>
                // Loads the initial pending jobs queue from storage.
                // the limit for retrieving pending jobs is 10000
                searchExecutionContexts('pending', null, 10000, '_created:asc')
                    .each((jobSpec) => {
                        logger.debug('enqueuing pending job:', jobSpec);
                        pendingExecutionQueue.enqueue(jobSpec);
                    })
                    .then(() => {
                        const queueSize = pendingExecutionQueue.size();

                        if (queueSize > 0) {
                            logger.info(`Jobs queue initialization complete, ${pendingExecutionQueue.size()} pending jobs have been enqueued`);
                        } else {
                            logger.info('Jobs queue initialization complete');
                        }

                        const allocateJobs = _jobAllocator();
                        setInterval(() => {
                            allocateJobs();
                        }, 1000);

                        return api;
                    })
            )
            .error((err) => {
                if (_.get(err, 'body.error.reason') !== 'no such index') {
                    logger.error(`initialization failed loading state from Elasticsearch: ${err}`);
                }
                const errMsg = parseError(err);
                logger.error('Error initializing, ', errMsg);
                return Promise.reject(errMsg);
            });
    }


    return Promise.all([require('../storage/jobs')(context, 'job'), require('../storage/jobs')(context, 'ex')])
        .spread((job, ex) => {
            logger.info('Initializing');
            jobStore = job;
            exStore = ex;

            return _initialize(); // Load the initial pendingJobs state.
        });
};
