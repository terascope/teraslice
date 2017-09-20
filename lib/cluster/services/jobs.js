'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const Queue = require('queue');

// Queue of jobs pending processing
const pendingExecutionQueue = new Queue();
const moderatorPausedQueue = new Queue();

/*
 Job Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */


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

module.exports = function module(context, clusterService) {
    const events = context.foundation.getEventEmitter();
    const logger = context.foundation.makeLogger({ module: 'jobs_service' });
    const esConnectionState = context.sysconfig.teraslice.state.connection;
    const jobValidator = require('../../config/validators/job')(context);
    const parseError = require('../../utils/error_utils').parseError;
    const shortid = require('shortid');

    let jobStore;
    let exStore;

    // need in the case the slicer is unable to mark the ex
    events.on('cluster:job_failure', (data) => {
        const metaData = { _has_errors: 'true', _slicer_stats: data.slicer_stats };
        logger.error(`job ${data.ex_id} has failed to complete`);

        if (data.error) {
            metaData._failureReason = data.error;
        }

        exStore.setStatus(data.ex_id, 'failed', metaData);
    });

    events.on('cluster_service:cleanup_job', (data) => {
        const options = { running: true, failing: true, paused: true };
        getExecutionContext(data.ex_id)
            .then((ex) => {
                if (options[ex._status]) {
                    logger.warn(`node ${data.node_id} has disconnected with active workers for job: ${data.ex_id} , enqueuing the workers`);
                    let numOfWorkers = data.workers;
                    const jobStr = JSON.stringify(ex);

                    const requestedWorkersData = {
                        job: jobStr,
                        id: ex.ex_id,
                        ex_id: ex.ex_id,
                        job_id: ex.job_id,
                        node_id: data.node_id,
                        workers: 1,
                        assignment: 'worker'
                    };

                    while (numOfWorkers > 0) {
                        logger.trace(`adding worker to pending queue for ex: ${ex.ex_id}`);
                        // this will add the workers to the pendingWorkerRequests queue
                        clusterService.addToQueue(requestedWorkersData);
                        numOfWorkers -= 1;
                    }
                }
            })
            .catch(err => logger.error(`could not cleanup job for ex: ${data.ex_id}`, err));
    });

    events.on('moderate_jobs:pause', (connectionList) => {
        const jobList = [];
        const str = connectionList.map(db => `moderator.${db.type}:${db.connection}`);
        const query = `(_status:running OR _status:failing) AND (${(str.join(' OR '))})`;
        logger.trace(`moderator is attempting to pause jobs, query ${query}`);

        _findJobs(query)
            .then(results => Promise.map(results, (job) => {
                jobList.push(job.ex_id);
                return notify(job.ex_id, 'moderator_paused');
            }))
            .then(() => logger.warn(`The following jobs have been paused by the moderator: ${jobList.join(' , ')}`))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`could not pause job for moderator, query: ${query}`, errMsg);
            });
    });

    events.on('moderate_jobs:resume', (connectionList) => {
        const jobList = [];
        const str = connectionList.map(db => `moderator.${db.type}:${db.connection}`);
        const query = `_status:moderator_paused AND (${(str.join(' OR '))})`;
        logger.trace(`moderator is attempting to resume jobs, query ${query}`);

        // add any side-lined jobs back to the main job queue
        if (moderatorPausedQueue.size()) {
            moderatorPausedQueue.each((job) => {
                _checkModerator(job)
                    .then((canRun) => {
                        if (canRun) {
                            moderatorPausedQueue.remove(job.ex_id, 'ex_id');
                            pendingExecutionQueue.unshift(job);
                        }
                    })
                    .catch((err) => {
                        const errMsg = parseError(err);
                        logger.error('error checking moderator while attempting to remove job from moderatorPausedQueue', errMsg);
                    });
            });
        }

        _findJobs(query)
            .then(results => Promise.map(results, (job) => {
                jobList.push(job.ex_id);
                return notify(job.ex_id, 'resume');
            }))
            .then(() => {
                const jobsResumed = jobList.join(' , ');
                if (jobsResumed.length > 0) {
                    logger.warn(`The following jobs have been resumed by the moderator: ${jobsResumed}`);
                }
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`could not resume job for moderator, query ${query}`, errMsg);
            });
    });

    function _exSearch(query) {
        return exStore.search(query, null, 10000)
            .then(jobs => jobs)
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not findJob', errMsg);
                return Promise.reject(errMsg);
            });
    }

    function _findJobs(query) {
        if (exStore) {
            return _exSearch(query);
        }
        return new Promise(((resolve, reject) => {
            const cycle = setInterval(() => {
                if (exStore) {
                    clearInterval(cycle);
                    _exSearch(query)
                        .then(results => resolve(results))
                        .catch(err => reject(parseError(err)));
                }
            }, 300);
        }));
    }

    function _saveJob(job, jobType) {
        if (jobType === 'job') {
            return jobStore.create(job);
        }

        return exStore.create(job);
    }

    function _enqueueJob(ex) {
        pendingExecutionQueue.enqueue(ex);
    }

    // check to see if state connection is listed, if not add it for moderator checks
    function _connectionDefaults(array) {
        let wasFound = false;
        _.each(array, (conn) => {
            if (conn[0] === 'elasticsearch') {
                wasFound = true;
                const stateConn = _.find(conn[1], esConn => esConn === esConnectionState);

                if (!stateConn) {
                    conn[1].push(esConnectionState);
                }
            }
        });

        if (!wasFound) {
            array.push(['elasticsearch', [esConnectionState]]);
        }

        return array;
    }

    function _checkModerator(job) {
        // if nothing to track, return true
        if (!job.moderator) {
            return Promise.resolve(true);
        }
        const connectionList = _connectionDefaults(_.toPairs(job.moderator));

        return clusterService.checkModerator(connectionList)
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not check moderator', errMsg);
                return Promise.reject(errMsg);
            });
    }

    function _createExecutionContext(job) {
        return _saveJob(job, 'ex')
            .then(ex => Promise.all([exStore.setStatus(ex.ex_id, 'pending'), _checkModerator(job)])
                .spread((exId, moderatorResponse) => {
                    const canRun = _.every(moderatorResponse, db => db.canRun === true);

                    if (canRun) {
                        logger.debug('enqueueing job to be processed, job', ex);
                        pendingExecutionQueue.enqueue(ex);
                    } else {
                        logger.warn('job cannot be run due to throttled database connections');
                        moderatorPausedQueue.enqueue(ex);
                    }

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


    function updateEX(exId, updateConfig) {
        return exStore.update(exId, updateConfig)
            .catch(err => logger.error(`failed to update ex ${exId} with new data: ${JSON.stringify(updateConfig)}, error: ${parseError(err)}`));
    }

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

    function restartExecution(exId) {
        // This will require the job to be scheduled as new.
        return getExecutionContext(exId)
            .then((ex) => {
                if (ex._status === 'completed') {
                    throw new Error('This job has completed and can not be restarted.');
                }
                if (ex._status === 'scheduling') {
                    throw new Error('This job is currently being scheduled and can not be restarted.');
                }
                // port cleanup and hostname happens at _jobAllocator
                ex._recover_execution = true;
                return _enqueueJob(ex);
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not restart execution context', errMsg);
            });
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
    // TODO: review these three, they are very similar
    function getExecutionContexts(status, from, size, sort) {
        return exStore.getExecutionContexts(status, from, size, sort);
    }

    function getExecutionContext(exId) {
        return exStore.get(exId)
            .then(ex => ex)
            .catch(err => logger.error(`error getting execution context for ex: ${exId}`, err));
    }

    function getExecutions(jobId) {
        const query = `job_id: ${jobId} AND _context:ex`;

        // TODO only get 10000, need room to allow more
        return exStore.search(query, null, 10000)
            .then(exs => exs.map(ex => ex.ex_id));
    }

    function getJobStateRecords(query, from, size, sort) {
        return jobStore.getJobStateRecords(query, from, size, sort);
    }

    function getLatestExecution(jobId, checkIfActive) {
        let query = `job_id: ${jobId} AND _context:ex`;

        if (checkIfActive) {
            const str = exStore.getTerminalStatuses().map(state => ` _status:${state} `).join('OR');
            query = `job_id: ${jobId} AND _context:ex NOT (${str.trim()})`;
        }

        return exStore.search(query, null, 1, '_created:desc')
            .then((ex) => {
                if (ex.length === 0) {
                    if (checkIfActive) {
                        return false;
                    }
                    return Promise.reject(`no execution context was found for job_id: ${jobId}`);
                }
                return ex[0].ex_id;
            });
    }

    // Checks the queue of pending jobs and will allocate any workers required.
    function _jobAllocator() {
        let isJobBeingAllocated = false;

        return function allocator() {
            if (!isJobBeingAllocated && pendingExecutionQueue.size() > 0 && clusterService.availableWorkers() >= 2) {
                isJobBeingAllocated = true;
                const executionContext = pendingExecutionQueue.dequeue();
                const recoverExecution = executionContext._recover_execution;

                logger.info(`Scheduling job: ${executionContext.ex_id}`);

                exStore.setStatus(executionContext.ex_id, 'scheduling')
                    .then(() => {
                        clusterService.allocateSlicer(executionContext, recoverExecution)
                            .then(() => exStore.setStatus(executionContext.ex_id, 'initializing', {
                                slicer_port: executionContext.slicer_port,
                                slicer_hostname: executionContext.slicer_hostname
                            }))
                            .then(() => clusterService.allocateWorkers(executionContext, executionContext.workers)
                                .then(() => {
                                    isJobBeingAllocated = false;
                                    allocator();
                                })
                                .catch((err) => {
                                    // this is to catch errors of allocateWorkers
                                    // if allocation fails, they are enqueued
                                    logger.error(`Workers failed to be allocated, they will be enqueued, error: ${parseError(err)}`);
                                    isJobBeingAllocated = false;
                                    allocator();
                                }))
                            .catch((err) => {
                                logger.error(`Failure during worker allocation - ${parseError(err)}`);
                                isJobBeingAllocated = false;
                                exStore.setStatus(executionContext.ex_id, 'failed');
                                allocator();
                            });
                    });
            }
        };
    }

    function _signalJobStateChange(exId, notice, state, excludeNode) {
        return _notifyCluster(exId, notice, excludeNode)
            .then(() => exStore.get(exId)
                .then((jobSpec) => {
                    logger.info(`job ${exId} has changed to state`, state);
                    return exStore.setStatus(jobSpec.ex_id, state);
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

        return new Promise(((resolve, reject) => {
            const requests = [];
            let nodes = clusterService.findNodesForJob(exId, slicerOnly);
            if (excludeNode) {
                nodes = nodes.filter(node => node.hostname !== excludeNode);
            }
            nodes.forEach((node) => {
                const messageNode = clusterService.notifyNode(node.node_id, message, {
                    ex_id: exId
                });

                requests.push(messageNode);
            });

            return Promise.all(requests)
                .then(() => {
                    resolve(true);
                })
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error('could not notify cluster', errMsg);
                    reject(errMsg);
                });
        }));
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
        logger.info('shutting down');
        const query = exStore.getRunningStatuses().map(str => `_status:${str}`).join(' OR ');
        return _exSearch(query)
            .map((job) => {
                logger.warn(`marking job ${job.job_id}, ex_id: ${job.ex_id} as terminated`);
                // need to exclude sending a stop to cluster master host, the shutdown event
                // has already been propagated this can cause a condition of it waiting for
                // stop to return but it already has which pauses this service shutdown
                return _signalJobStateChange(job.ex_id, 'stop', 'terminated', context.sysconfig.teraslice.hostname);
            })
            .then(() => Promise.all([jobStore.shutdown(), exStore.shutdown()]))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error while shutting down job/ex stores, error: ${errMsg}`);
                // no matter what we need to shutdown
                return true;
            });
    }

    const api = {
        submitJob,
        updateJob,
        updateEX,
        notify,
        getJob,
        getJobs,
        getExecutionContext,
        getExecutionContexts,
        getExecutions,
        getJobStateRecords,
        getLatestExecution,
        startJob,
        restartExecution,
        shutdown
    };

    function _initialize() {
        // Reschedule any persistent jobs that were running.
        // There may be some additional subtlety required here.
        return getExecutionContexts('running').each((job) => {
            // TODO: For this restarting to work correctly we need to check the job on the running
            // cluster to make sure it's not still running after a cluster_master restart.
            if (job.lifecycle === 'persistent') {
                // pendingExecutionQueue.enqueue(job);
            } else {
                // exStore.setStatus(job.ex_id, 'aborted');
            }
        })
            .then(() =>
                // Loads the initial pending jobs queue from storage.
                // the limit for retrieving pending jobs is 10000
                getExecutionContexts('pending', null, 10000, '_created:asc')
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
                if (err.body && err.body.error && err.body.error.reason !== 'no such index') {
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
