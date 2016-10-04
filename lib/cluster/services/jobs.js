'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

var Queue = require('../../utils/queue');
var exceptions = require('../../utils/exceptions');

// Queue of jobs pending processing
var pendingExecutionQueue;

/*
 Job Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */
var VALID_STATUS = [
    'pending', 'scheduling', 'initializing', 'running', 'failing', 'paused',
    'completed', 'stopped', 'rejected', 'failed', 'aborted'
];

// Maps job notification to execution states
var STATE_MAPPING = {
    'stop': 'stopped',
    'pause': 'paused',
    'resume': 'running'
};

// Maps job control messages into cluster control messages.
var MESSAGE_MAPPING = {
    'pause': 'cluster:job:pause',
    'resume': 'cluster:job:resume',
    'restart': 'cluster:job:restart',
    'stop': 'cluster:job:stop'
};

module.exports = function(context, cluster_service) {
    var logger = context.foundation.makeLogger('jobs', 'jobs', {module: 'jobs_service'});

    var job_store;
    var ex_store;
    var job_validator = require('../../config/validators/job')(context);
    var elasticError = require('../../utils/error_utils').elasticError;

    var events = require('../../utils/events');

    var pendingJobsScheduler;

    events.on('cluster:job_finished', function(data) {
        logger.info(`job ${data.ex_id} has completed`);
        var metaData = {_slicer_stats: data.slicer_stats};

        if (data.hasRecovered) {
            metaData._has_errors = 'recovered';
        }
        _setStatus(data, 'completed', metaData)
    });

    events.on('cluster:job_failure', function(data) {
        var metaData = {_has_errors: 'true', _slicer_stats: data.slicer_stats};
        logger.error(`job ${data.ex_id} has failed to complete`);

        if (data.error) {
            metaData._failureReason = data.error;
        }

        _setStatus(data, 'failed', metaData)
    });

    events.on('slicer:processing:error', function(data) {
        logger.error(`job ${data.ex_id} has had at least one slice failure and will be marked 'failed'`);
        var metaData = {_has_errors: 'true'};

        _setStatus(data, 'failing', metaData)
    });

    events.on('slicer:initialized', function(data) {
        logger.info(`job: ${data.ex_id} is now running`);
        _setStatus(data, 'running')
    });

    events.on('slicer:job:update', function(updateSpec) {
        //this is updating the opConfig for elasticsearch start and/or end dates for ex, this assuemes elasticsearch is first
        updateEX(updateSpec.ex_id, {operations: updateSpec.update})
    });

    events.on('cluster_service:cleanup_job', function(data) {
        var options = {running: true, failing: true, paused: true};
        getExecutionContext(data.ex_id).then(function(ex) {
            if (options[ex._status]) {
                logger.warn(`node ${data.node_id} has disconnected with active workers for job: ${data.ex_id} , enqueuing the workers`);
                restartExecution(ex.ex_id)
            }
        });
    });

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

    function createExecutionContext(job) {
        return saveJob(job, 'ex')
            .then(function(ex) {
                return _setStatus(ex, 'pending')
            }).then(function(ex) {
                pendingExecutionQueue.enqueue(ex);
                return {job_id: ex.job_id, ex_id: ex.ex_id};
            });
    }

    function submitJob(job_spec, shouldRun) {
        return _validateJob(job_spec)
            .then(function(validJob) {
                return saveJob(validJob, 'job')
                    .then(function(job) {
                        if (!shouldRun) {
                            return {job_id: job.job_id}
                        }
                        else {
                            return createExecutionContext(job)
                        }
                    })
            });
    }

    // Updates the job but does not automatically start it.
    function updateJob(job_id, job) {
        return getJob(job_id)
            .then(function(job) {
                return job_store.update(job_id, job);
            })
    }

    function updateEX(ex_id, updateConfig) {
        return ex_store.update(ex_id, updateConfig);
    }

    // Valid notifications: stop, pause, resume
    function notify(ex_id, state) {
        var status = STATE_MAPPING[state];

        return _signalJobStateChange(ex_id, state, status)
            .catch(function(ev) {
                throw new Error(ev.stack)
            });
    }

    function startJob(job_id) {
        return getJob(job_id)
            .then(function(job_spec) {
                return createExecutionContext(job_spec);
            });
    }

    function restartExecution(ex_id) {
        // This will require the job to be scheduled as new.
        return getExecutionContext(ex_id)
            .then(function(ex) {
                if (ex._status === 'completed') {
                    throw new exceptions.JobStateError("This job has completed and can not be restarted.");
                }
                if (ex._status === 'scheduling') {
                    throw new exceptions.JobStateError("This job is currently being scheduled and can not be restarted.");
                }
                // port cleanup and hostname happens at jobAllocator
                ex._recover_execution = true;
                return enqueueJob(ex);
            });
    }

    function getJob(job_id) {
        return job_store.get(job_id)
            .then(function(job_spec) {
                return job_spec;
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
            });
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

                _setStatus(executionContext, 'scheduling')
                    .then(function() {
                        cluster_service.allocateSlicer(executionContext, recover_execution).then(function() {
                            return cluster_service.allocateWorkers(executionContext, executionContext.workers)
                                .then(function() {
                                    _setStatus(executionContext, 'initializing');
                                    isJobBeingAllocated = false;
                                    allocator();
                                })
                                .catch(function(err) {
                                    //this is to catch errors of allocateWorkers, if allocation fails, they are enqueued
                                    var errMsg = elasticError(err);
                                    logger.error(`Workers failed to be allocated, they will be enqueued, error: ${errMsg}`);
                                    isJobBeingAllocated = false;
                                    allocator();
                                })
                        })
                            .catch(function(err) {
                                var errMsg = elasticError(err);
                                logger.error(`Failure during worker allocation - ${errMsg}`);
                                isJobBeingAllocated = false;
                                _setStatus(executionContext, 'failed');
                                allocator();
                            });
                    });
            }

        }
    }

    function _signalJobStateChange(ex_id, notice, state) {
        return _notifyCluster(ex_id, notice)
            .then(function() {
                return ex_store.get(ex_id)
                    .then(function(job_spec) {
                        logger.info(`job ${ex_id} has changed to state '${state}`);

                        return _setStatus(job_spec, state);
                    })
                    .then(function(job) {
                        return state
                    });
            })
            .catch(function(ev) {
                throw new Error(ev);
            })
    }

    // TODO: is this in the right place? It may make more sense in services.cluster
    function _notifyCluster(ex_id, notice) {
        var slicerOnly = false;
        if (notice === 'pause' || notice === 'resume') slicerOnly = true;

        if (!MESSAGE_MAPPING[notice]) {
            throw new Error(`JobsService: invalid notification message`);
        }

        var message = MESSAGE_MAPPING[notice];

        return new Promise(function(resolve, reject) {
            var requests = [];
            var nodes = cluster_service.findNodesForJob(ex_id, slicerOnly);

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
                .catch(function(ev) {
                    reject(ev)
                });
        });
    }

    function _setStatus(job_spec, status, metaData) {
        if (VALID_STATUS.indexOf(status) != -1) {
            return getExecutionContext(job_spec.ex_id)
                .then(function(ex) {
                    var statusObj = {_status: status};
                    if (metaData) {
                        _.assign(statusObj, metaData)
                    }
                    return ex_store.update(job_spec.ex_id, statusObj)
                        .then(function() {
                            return job_spec;
                        });
                })
        }
        else {
            throw new Error(`Invalid Job status: ${status}`);
        }
    }

    function _validateJob(job_spec) {
        return new Promise(function(resolve, reject) {
            // This will throw errors if the job does not pass validation.
            try {
                var validJob = job_validator.validate(job_spec);
            }
            catch (ev) {
                reject(`Error validating job: ${ev}`)
            }

            resolve(validJob);
        });
    }

    function shutdown() {
        logger.info(`shutting down`);
        return Promise.all([job_store.shutdown(), ex_store.shutdown()]);
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
        startJob: startJob,
        restartExecution: restartExecution,
        shutdown: shutdown
    };

    function _initialize() {
        pendingExecutionQueue = new Queue;

        // Reschedule any persistent jobs that were running.
        // There may be some additional subtlety required here.
        return getExecutionContexts('running').each(function(job) {
            // TODO: For this restarting to work correctly we need to check the job on the running
            // cluster to make sure it's not still running after a cluster_master restart.
            if (job.lifecycle === 'persistent') {
                //pendingExecutionQueue.enqueue(job);
            }
            else {
                //_setStatus(job, 'aborted');
            }
        })
            .then(function() {
                // Loads the initial pending jobs queue from storage.
                // Currently this will not preserve the order. => maybe do it by timestamp if need order
                return getExecutionContexts('pending')
                    .each(function(job_spec) {
                        pendingExecutionQueue.enqueue(job_spec);
                    })
                    .then(function() {
                        logger.info(`Pending jobs initialization complete.`);
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
                var errMsg = elasticError(err);
                logger.error(`Error initializing, `, errMsg);
                return Promise.reject(errMsg)
            });
    }


    return Promise.all([require('../storage/jobs')(context, 'job'), require('../storage/jobs')(context, 'ex')])
        .spread(function(job, ex) {
            logger.info("initializing");
            job_store = job;
            ex_store = ex;

            return _initialize(); // Load the initial pendingJobs state.
        });

};
