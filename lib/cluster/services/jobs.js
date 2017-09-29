'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

var Queue = require('queue');

// Queue of jobs pending processing
var pendingExecutionQueue = new Queue;
var moderatorPausedQueue = new Queue;

/*
 Job Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */


// Maps job notification to execution states
var STATE_MAPPING = {
    'stop': 'stopped',
    'pause': 'paused',
    'resume': 'running',
    'moderator_paused': 'moderator_paused'
};

// Maps job control messages into cluster control messages.
var MESSAGE_MAPPING = {
    'pause': 'cluster:job:pause',
    'resume': 'cluster:job:resume',
    'restart': 'cluster:job:restart',
    'stop': 'cluster:job:stop',
    'terminated': 'cluster:job:stop',
    'moderator_paused': 'cluster:job:pause'
};

module.exports = function(context, cluster_service) {
    var events = context.foundation.getEventEmitter();
    var logger = context.foundation.makeLogger({module: 'jobs_service'});
    var esConnectionState = context.sysconfig.teraslice.state.connection;
    var job_store;
    var ex_store;
    var job_validator = require('../../config/validators/job')(context);
    var parseError = require('../../utils/error_utils').parseError;
    var shortid = require('shortid');
    var pendingJobsScheduler;

    //need in the case the slicer is unable to mark the ex
    events.on('cluster:job_failure', function(data) {
        var metaData = {_has_errors: 'true', _slicer_stats: data.slicer_stats};
        logger.error(`job ${data.ex_id} has failed to complete`);

        if (data.error) {
            metaData._failureReason = data.error;
        }

        ex_store.setStatus(data.ex_id, 'failed', metaData)
    });

    events.on('cluster_service:cleanup_job', function(data) {
        var options = {running: true, failing: true, paused: true};
        getExecutionContext(data.ex_id)
            .then(function(ex) {
                if (options[ex._status]) {
                    logger.warn(`node ${data.node_id} has disconnected with active workers for job: ${data.ex_id} , enqueuing the workers`);
                    var numOfWorkers = data.workers;
                    var jobStr = JSON.stringify(ex);

                    var requestedWorkersData = {
                        job: jobStr,
                        id: ex.ex_id,
                        ex_id: ex.ex_id,
                        job_id: ex.job_id,
                        node_id: node_id,
                        workers: 1,
                        assignment: 'worker'
                    };

                    while (numOfWorkers > 0) {
                        logger.trace(`adding worker to pending queue for ex: ${ex.ex_id}`);
                        //this will add the workers to the pendingWorkerRequests queue
                        cluster_service.addToQueue(requestedWorkersData);
                        numOfWorkers -= 1;
                    }
                }
            })
            .catch(function(err) {
                logger.error(`could not cleanup job for ex: ${data.ex_id}`, err)
            });
    });

    events.on('moderate_jobs:pause', function(connectionList) {
        let jobList = [];
        let str = connectionList.map(function(db) {
            return `moderator.${db.type}:${db.connection}`
        });
        let query = `(_status:running OR _status:failing) AND (${(str.join(' OR '))})`;
        logger.trace(`moderator is attempting to pause jobs, query ${query}`);

        findJobs(query)
            .then(function(results) {
                return Promise.map(results, function(job) {
                    jobList.push(job.ex_id);
                    return notify(job.ex_id, 'moderator_paused')
                });
            })
            .then(function(results) {
                logger.warn(`The following jobs have been paused by the moderator: ${jobList.join(' , ')}`)
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not pause job for moderator, query: ${query}`, errMsg);
            })
    });

    events.on('moderate_jobs:resume', function(connectionList) {
        let jobList = [];
        let str = connectionList.map(function(db) {
            return `moderator.${db.type}:${db.connection}`
        });
        let query = `_status:moderator_paused AND (${(str.join(' OR '))})`;
        logger.trace(`moderator is attempting to resume jobs, query ${query}`);

        //add any side-lined jobs back to the main job queue
        if (moderatorPausedQueue.size()) {
            moderatorPausedQueue.each(function(job) {
                checkModerator(job)
                    .then(function(canRun) {
                        if (canRun) {
                            moderatorPausedQueue.remove(job.ex_id, 'ex_id');
                            pendingExecutionQueue.unshift(job);
                        }
                    })
                    .catch(function(err) {
                        var errMsg = parseError(err);
                        logger.error(`error checking moderator while attempting to remove job from moderatorPausedQueue`, errMsg);
                    })
            });
        }

        findJobs(query)
            .then(function(results) {
                return Promise.map(results, function(job) {
                    jobList.push(job.ex_id);
                    return notify(job.ex_id, 'resume')
                });
            })
            .then(function(results) {
                var jobsResumed = jobList.join(' , ');
                if (jobsResumed.length > 0) {
                    logger.warn(`The following jobs have been resumed by the moderator: ${jobsResumed}`);
                }
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not resume job for moderator, query ${query}`, errMsg);
            })
    });

    function ex_search(query) {
        return ex_store.search(query, null, 10000)
            .then(function(jobs) {
                return jobs
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not findJob`, errMsg);
                return Promise.reject(errMsg);
            })
    }

    function findJobs(query) {
        if (ex_store) {
            return ex_search(query)
        }
        else {
            return new Promise(function(resolve, reject) {
                var cycle = setInterval(function() {
                    if (ex_store) {
                        clearInterval(cycle);
                        ex_search(query)
                            .then(results => resolve(results))
                    }
                }, 300)

            })
        }
    }

    function saveJob(job, jobType) {
        if (jobType === 'job') {
            return job_store.create(job)
        }
        else {
            return ex_store.create(job)
        }
    }

    function enqueueJob(ex) {
        pendingExecutionQueue.enqueue(ex);
    }

    //check to see if state connection is listed, if not add it for moderator checks
    function connectionDefaults(array) {
        let wasFound = false;
        _.each(array, function(conn) {
            if (conn[0] === 'elasticsearch') {
                wasFound = true;
                let stateConn = _.find(conn[1], function(conn) {
                    return conn === esConnectionState;
                });

                if (!stateConn) {
                    conn[1].push(esConnectionState)
                }
            }
        });

        if (!wasFound) {
            array.push(['elasticsearch', [esConnectionState]])
        }

        return array
    }

    function checkModerator(job) {
        //if nothing to track, return true
        if (!job.moderator) {
            return Promise.resolve(true)
        }
        var connectionList = connectionDefaults(_.toPairs(job.moderator));

        return cluster_service.checkModerator(connectionList)
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not check moderator`, errMsg);
                return Promise.reject(errMsg)
            })
    }

    function createExecutionContext(job) {
        return saveJob(job, 'ex')
            .then(function(ex) {
                return Promise.all([ex_store.setStatus(ex.ex_id, 'pending'), checkModerator(job)])
                    .spread(function(ex_id, moderatorResponse) {
                        var canRun = _.every(moderatorResponse, function(db) {
                            return db.canRun === true
                        });

                        if (canRun) {
                            logger.debug(`enqueueing job to be processed, job`, ex);
                            pendingExecutionQueue.enqueue(ex);
                        }
                        else {
                            logger.warn(`job cannot be run due to throttled database connections`);
                            moderatorPausedQueue.enqueue(ex);
                        }

                        return {job_id: ex.job_id};
                    })
                    .catch(function(err) {
                        var errMsg = parseError(err);
                        logger.error(`could not set to pending`, errMsg);
                        return Promise.reject(errMsg)
                    })
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not create execution context`, errMsg);
                return Promise.reject(errMsg)
            })
    }

    function ensureAssets(job_spec) {
        return new Promise(function(resolve, reject) {
            if (!job_spec.assets) {
                resolve(job_spec)
            }
            else {
                var id = shortid.generate();
                events.once(id, function(msg) {
                    if (msg.error) {
                        reject(msg.error)
                    }
                    if (!msg.assets) {
                        reject(`no asset was found for ${job_spec.assets}`);
                        return;
                    }

                    if (msg.assets.length !== job_spec.assets.length) {
                        reject(`job specified ${job_spec.assets.length} assets: ${job_spec.assets} but only ${msg.assets.length}
                        where found, assets: ${msg.assets}`);
                        return
                    }

                    //need to normalize asset identifiers to their id form, but not mutate original job_spec
                    var parsedAssetJob = _.cloneDeep(job_spec);
                    parsedAssetJob.assets = msg.assets;
                    resolve(parsedAssetJob)
                });

                events.emit('jobs_service:verify_assets', {assets: job_spec.assets, _msgID: id});
            }
        })
    }

    function submitJob(job_spec, shouldRun) {
        return ensureAssets(job_spec)
            .then(function(parsedAssetJob) {
                return _validateJob(parsedAssetJob)
            })
            .then(function(validJob) {
                var oldAssetNames = job_spec.assets;
                var parsedAssets = validJob.assets;

                // we want to keep old names on job so that assets can be changed dynamically
                // this works since we passed ensureAssets that make sure we have valid assets 
                validJob.assets = oldAssetNames;

                return saveJob(validJob, 'job')
                    .then(function(job) {
                        if (!shouldRun) {
                            return {job_id: job.job_id}
                        }
                        else {
                            //revert back to true asset identifiers for actual invocation
                            job.assets = parsedAssets;
                            return createExecutionContext(job)
                        }
                    })
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not submit job`, errMsg);
                return Promise.reject(errMsg);
            });
    }

    // Updates the job but does not automatically start it.
    function updateJob(job_id, jobUpdates) {
        return getJob(job_id)
            .then(function(job_spec) {
                var updatedJob = _.assign({}, job_spec, jobUpdates);
                return _validateJob(updatedJob);
            })
            .then(function(validJob) {
                return job_store.update(job_id, validJob);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not updateJob`, errMsg);
                return Promise.reject(errMsg);
            });
    }

    function updateEX(ex_id, updateConfig) {
        return ex_store.update(ex_id, updateConfig)
            .catch(function(err) {
                logger.error(`failed to update ex ${ex_id} with new data`, updateConfig)
            });
    }

    // Valid notifications: stop, pause, resume
    function notify(ex_id, state) {
        var status = STATE_MAPPING[state];

        return _signalJobStateChange(ex_id, state, status)
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not notify`, errMsg);
                return Promise.reject(errMsg)
            });
    }

    function startJob(job_id) {
        return getJob(job_id)
            .then(function(job_spec) {
                if(!job_spec) {
                    return Promise.reject(`no job for job_id: ${job_id} could be found`);
                }
                return ensureAssets(job_spec);
            })
            .then(function(assetIdJob) {
                return createExecutionContext(assetIdJob);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not startJob`, errMsg);
                return Promise.reject(errMsg);
            });
    }

    function restartExecution(ex_id) {
        // This will require the job to be scheduled as new.
        return getExecutionContext(ex_id)
            .then(function(ex) {
                if (ex._status === 'completed') {
                    throw new Error("This job has completed and can not be restarted.");
                }
                if (ex._status === 'scheduling') {
                    throw new Error("This job is currently being scheduled and can not be restarted.");
                }
                // port cleanup and hostname happens at jobAllocator
                ex._recover_execution = true;
                return enqueueJob(ex);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not restart execution context`, errMsg)
            });
    }

    function getJob(job_id) {
        return job_store.get(job_id)
            .then(function(job_spec) {
                return job_spec;
            })
            .catch(function(err) {
                logger.error(`could not get job for job_id: ${job_id}`, err)
            });
    }

    function getJobs(from, size, sort) {
        return job_store.getJobs(from, size, sort);
    }

    function getExecutionContexts(status, from, size, sort) {
        return ex_store.getExecutionContexts(status, from, size, sort);
    }


    function getExecutionContext(ex_id) {
        return ex_store.get(ex_id)
            .then(function(ex) {
                return ex;
            })
            .catch(function(err) {
                logger.error(`error getting execution context for ex: ${ex_id}`, err)
            });
    }

    function getExecutions(job_id) {
        var query = `job_id: ${job_id} AND _context:ex`;

        //TODO only get 10000, need room to allow more
        return ex_store.search(query, null, 10000)
            .then(function(exs) {
                return exs.map(ex => ex.ex_id)
            })
    }

    function getJobStateRecords(query, from, size, sort) {
        return job_store.getJobStateRecords(query, from, size, sort)
    }

    function getLatestExecution(job_id, checkIfActive) {
        var query = `job_id: ${job_id} AND _context:ex`;

        if (checkIfActive) {
            var str = ex_store.getTerminalStatuses().map(state => ` _status:${state} `).join('OR');
            query = `job_id: ${job_id} AND _context:ex NOT (${str.trim()})`
        }

        return ex_store.search(query, null, 1, '_created:desc')
            .then(function(ex) {
                if (ex.length === 0) {
                    if (checkIfActive) {
                        return false;
                    }
                    return Promise.reject(`no execution context was found for job_id: ${job_id}`)
                }
                return ex[0].ex_id
            })
    }

    // Checks the queue of pending jobs and will allocate any workers required.
    function jobAllocator() {
        var isJobBeingAllocated = false;

        return function allocator() {

            if (!isJobBeingAllocated && pendingExecutionQueue.size() > 0 && cluster_service.availableWorkers() >= 2) {
                isJobBeingAllocated = true;
                var executionContext = pendingExecutionQueue.dequeue();
                var recover_execution = executionContext._recover_execution;

                logger.info(`Scheduling job: ${executionContext.ex_id}`);

                ex_store.setStatus(executionContext.ex_id, 'scheduling')
                    .then(function() {
                        cluster_service.allocateSlicer(executionContext, recover_execution)
                            .then(function() {
                                return ex_store.setStatus(executionContext.ex_id, 'initializing', {
                                    slicer_port: executionContext.slicer_port,
                                    slicer_hostname: executionContext.slicer_hostname
                                });
                            })
                            .then(function() {
                                return cluster_service.allocateWorkers(executionContext, executionContext.workers)
                                    .then(function() {
                                        isJobBeingAllocated = false;
                                        allocator();
                                    })
                                    .catch(function(err) {
                                        //this is to catch errors of allocateWorkers, if allocation fails, they are enqueued
                                        var errMsg = parseError(err);
                                        logger.error(`Workers failed to be allocated, they will be enqueued, error: ${errMsg}`);
                                        isJobBeingAllocated = false;
                                        allocator();
                                    })
                            })
                            .catch(function(err) {
                                var errMsg = parseError(err);
                                logger.error(`Failure during worker allocation - ${errMsg}`);
                                isJobBeingAllocated = false;
                                ex_store.setStatus(executionContext.ex_id, 'failed');
                                allocator();
                            });
                    });
            }
        }
    }

    function _signalJobStateChange(ex_id, notice, state, excludeNode) {
        return _notifyCluster(ex_id, notice, excludeNode)
            .then(function() {
                return ex_store.get(ex_id)
                    .then(function(job_spec) {
                        logger.info(`job ${ex_id} has changed to state`, state);

                        return ex_store.setStatus(job_spec.ex_id, state);
                    })
                    .then(function(job) {
                        return state
                    });
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`could not signal job state change`, errMsg);
                return Promise.reject(errMsg)
            });
    }

    function _notifyCluster(ex_id, notice, excludeNode) {
        var slicerOnly = false;
        if (notice === 'pause' || notice === 'resume' || notice === 'moderator_paused') slicerOnly = true;

        if (!MESSAGE_MAPPING[notice]) {
            throw new Error(`JobsService: invalid notification message`);
        }

        var message = MESSAGE_MAPPING[notice];

        return new Promise(function(resolve, reject) {
            var requests = [];
            var nodes = cluster_service.findNodesForJob(ex_id, slicerOnly);
            if (excludeNode) {
                nodes = nodes.filter(node => node.hostname !== excludeNode);
            }
            nodes.forEach(function(node) {
                var messageNode = cluster_service.notifyNode(node.node_id, message, {
                    ex_id: ex_id
                });

                requests.push(messageNode);
            });

            return Promise.all(requests)
                .then(function() {
                    resolve(true)
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    logger.error(`could not notify cluster`, errMsg);
                    reject(errMsg);
                });
        });
    }

    function _validateJob(job_spec) {
        return new Promise(function(resolve, reject) {
            // This will throw errors if the job does not pass validation.
            try {
                var validJob = job_validator.validate(job_spec);
            }
            catch (ev) {
                reject(`Error validating job: ${ev.message}`)
            }

            resolve(validJob);
        });
    }

    function shutdown() {
        logger.info(`shutting down`);
        var query = ex_store.getRunningStatuses().map(str => `_status:${str}`).join(" OR ");
        return ex_search(query)
            .map(function(job) {
                logger.warn(`marking job ${job.job_id}, ex_id: ${job.ex_id} as terminated`);
                //need to exclude sending a stop to cluster master host, the shutdown event has already been propagated
                //this can cause a condition of it waiting for stop to return but it already has which pauses this service shutdown
                return _signalJobStateChange(job.ex_id, 'stop', 'terminated', context.sysconfig.teraslice.hostname);
            })
            .then(function() {
                return Promise.all([job_store.shutdown(), ex_store.shutdown()]);
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error while shutting down job/ex stores, error: ${errMsg}`);
                //no matter what we need to shutdown
                return true;
            })
    }

    var api = {
        submitJob: submitJob,
        updateJob: updateJob,
        updateEX: updateEX,
        notify: notify,
        getJob: getJob,
        getJobs: getJobs,
        getExecutionContext: getExecutionContext,
        getExecutionContexts: getExecutionContexts,
        getExecutions: getExecutions,
        getJobStateRecords: getJobStateRecords,
        getLatestExecution: getLatestExecution,
        startJob: startJob,
        restartExecution: restartExecution,
        shutdown: shutdown
    };

    function _initialize() {
        // Reschedule any persistent jobs that were running.
        // There may be some additional subtlety required here.
        return getExecutionContexts('running').each(function(job) {
            // TODO: For this restarting to work correctly we need to check the job on the running
            // cluster to make sure it's not still running after a cluster_master restart.
            if (job.lifecycle === 'persistent') {
                //pendingExecutionQueue.enqueue(job);
            }
            else {
                //ex_store.setStatus(job.ex_id, 'aborted');
            }
        })
            .then(function() {
                // Loads the initial pending jobs queue from storage.
                // the limit for retrieving pending jobs is 10000
                return getExecutionContexts('pending', null, 10000, '_created:asc')
                    .each(function(job_spec) {
                        logger.debug(`enqueuing pending job:`, job_spec);
                        pendingExecutionQueue.enqueue(job_spec);
                    })
                    .then(function() {
                        let queueSize = pendingExecutionQueue.size();

                        if (queueSize > 0) {
                            logger.info(`Jobs queue initialization complete, ${pendingExecutionQueue.size()} pending jobs have been enqueued`);
                        }
                        else {
                            logger.info(`Jobs queue initialization complete`);
                        }

                        var allocateJobs = jobAllocator();
                        pendingJobsScheduler = setInterval(function() {
                            allocateJobs();
                        }, 1000);

                        return api;
                    });
            })
            .error(function(err) {
                if (err.body && err.body.error && err.body.error.reason !== 'no such index') {
                    logger.error(`initialization failed loading state from Elasticsearch: ${err}`);
                }
                var errMsg = parseError(err);
                logger.error(`Error initializing, `, errMsg);
                return Promise.reject(errMsg)
            });
    }


    return Promise.all([require('../storage/jobs')(context, 'job'), require('../storage/jobs')(context, 'ex')])
        .spread(function(job, ex) {
            logger.info("Initializing");
            job_store = job;
            ex_store = ex;

            return _initialize(); // Load the initial pendingJobs state.
        });

};
