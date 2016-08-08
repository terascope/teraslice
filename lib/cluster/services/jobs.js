'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

var Queue = require('../../utils/queue');
var exceptions = require('../../utils/exceptions');

// Queue of jobs pending processing
var pendingJobsQueue;

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
    'pause': 'cluster_service:pause_slicer',
    'resume': 'cluster_service:resume_slicer',
    'restart': 'cluster_service:restart_slicer',
    'stop': 'cluster_service:stop_job'
};


//TODO make sure names correctly reflect ex vs job

module.exports = function(context, cluster_service) {
    var logger = context.logger;

    var job_store;
    var ex_store;
    var job_validator = require('../../config/validators/job')(context);

    var events = require('../../utils/events');

    var pendingJobsScheduler;

    events.on('cluster:job_finished', function(data) {
        logger.info(`JobsService: job ${data.ex_id} has completed`);
        _setStatus(data, 'completed')
    });

    events.on('cluster:job_failure', function(data) {
        var metaData = {};
        logger.error(`JobsService: job ${data.job_id} has failed to complete`);

        if (data.error) {
            metaData._failureReason = data.error;
        }

        _setStatus(data, 'failed', metaData)
    });

    events.on('slicer:processing_error', function(data) {
        logger.error(`JobsService: job ${data.ex_id} has had at least one slice failure and will be marked 'failed'`);
        _setStatus(data, 'failing')
    });

    events.on('slicer:slicer_initialized', function(data) {
        logger.info(`Job: ${data.ex_id} is now running`);
        _setStatus(data, 'running')
    });

    //TODO fix getJob and references to errors
    events.on('cluster_service:check_job', function(data) {
        var options = {running: true, failing: true, paused: true};
        getJob(data.ex_id).then(function(job) {
            if (options[job._status]) {
                logger.warn(`node ${data.node_id} has disconnected with active workers for job: ${data.ex_id} , enqueuing the workers`);
                var results = formatJob(data, job);
                events.emit('add_to_workerQueue', results)
            }
        });
    });

    function formatJob(data, job) {
        delete job._status;
        delete job._created;
        delete job._updated;

        job.slicer_port = data.slicer_port;
        job.slicer_hostname = data.slicer_hostname;

        data.job = JSON.stringify(job);

        return data;
    }

    function saveJob(job, jobType) {
        if (jobType === 'job') {
            return job_store.create(job, 'job')
        }
        else {
            return ex_store.create(job, 'ex')
        }
    }

    function enqueueJob(job) {
        return saveJob(job, 'ex')
            .then(function(ex) {
                return _setStatus(ex, 'pending')
            }).then(function(ex) {
                pendingJobsQueue.enqueue(ex);
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
                            return enqueueJob(job)
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
                return enqueueJob(job_spec);
            });
    }

    //TODO this is for restarts
    /* function startJob(job_id, recover_job) {
     // This will require the job to be scheduled as new.
     return getJob(job_id)
     .then(function(job_spec) {
     if (job_spec._status === 'completed') {
     throw new exceptions.JobStateError("This job has completed and can not be restarted.");
     }

     if (job_spec._status === 'scheduling') {
     throw new exceptions.JobStateError("This job is currently being scheduled and can not be restarted.");
     }

     if (recover_job) job_spec._recover_job = true;

     return submitJob(job_spec);
     });
     }*/

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

            if (!isJobBeingAllocated && pendingJobsQueue.size() > 0 && cluster_service.availableWorkers() >= 2) {
                isJobBeingAllocated = true;
                var job = pendingJobsQueue.dequeue();
                var recover_job = job._recover_job;

                logger.info("JobsService: Scheduling job: " + job.job_id);

                //TODO need error handling if ES goes down
                _setStatus(job, 'scheduling').then(function() {
                    cluster_service.allocateSlicer(job, recover_job).then(function() {
                        return cluster_service.allocateWorkers(job, job.workers)
                            .then(function() {
                                _setStatus(job, 'initializing');
                                isJobBeingAllocated = false;
                                allocator();
                            })
                            .catch(function(err) {
                                //this is to catch errors of allocateWorkers, if allocation fails, they are enqueued
                                logger.error("Workers failed to be allocated, they will be enqueued, error: " + err);
                                isJobBeingAllocated = false;
                                allocator();
                            })
                    })
                        .catch(function(err) {
                            logger.error("JobsService: Failure during worker allocation - " + err);
                            isJobBeingAllocated = false;
                            _setStatus(job, 'failed');
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
                        logger.info(`JobsService: job ${ex_id} has changed to state '${state}`);

                        return _setStatus(job_spec, state);
                    });
            })
            .then(function(job) {
                return true;
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
            throw new Error("JobsService: invalid notification message");
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
            if (job_spec.ex_id) {
                var status = {_status: status};
                if (metaData) {
                    _.assign(status, metaData)
                }
                return ex_store.update(job_spec.ex_id, status)
                    .then(function() {
                        return job_spec;
                    });
            }
            /*else {
             job_spec._status = status;
             if (metaData) {
             _.assign(job_spec, metaData)
             }
             return job_store.create(job_spec);
             }*/
        }
        else {
            throw new Error("Invalid Job status: " + status);
        }
    }

    function _validateJob(job_spec) {
        return new Promise(function(resolve, reject) {
            // This will throw errors if the job does not pass validation.
            try {
                var validJob = job_validator.validate(job_spec);
            }
            catch (ev) {
                reject('Error validating job: ' + ev)
            }

            resolve(validJob);
        });
    }

    function shutdown() {
        logger.info(`JobsService: shutting down`);
        return Promise.all([job_store.shutdown(), ex_store.shutdown()]);
    }

    var api = {
        submitJob: submitJob,
        updateJob: updateJob,
        notify: notify,
        getJob: getJob,
        getJobs: getJobs,
        getExecutionContext: getExecutionContext,
        getExecutionContexts: getExecutionContexts,
        startJob: startJob,
        shutdown: shutdown
    };

    function _initialize() {
        pendingJobsQueue = new Queue;

        // Reschedule any persistent jobs that were running.
        // There may be some additional subtlety required here.
        return getExecutionContexts('running').each(function(job) {
            // TODO: For this restarting to work correctly we need to check the job on the running
            // cluster to make sure it's not still running after a cluster_master restart.
            if (job.lifecycle === 'persistent') {
                //pendingJobsQueue.enqueue(job);
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
                        pendingJobsQueue.enqueue(job_spec);
                    })
                    .then(function() {
                        logger.info("JobsService: Pending Jobs initialization complete.");
                        var allocateJobs = jobAllocator();
                        pendingJobsScheduler = setInterval(function() {
                            allocateJobs();
                        }, 1000);

                        return api;
                    });
            })
            .error(function(err) {
                if (err.body && err.body.error && err.body.error.reason !== 'no such index') {
                    logger.error("JobsService: initialization failed loading state from Elasticsearch: " + err);
                }
            });
    }


    return Promise.all([require('../storage/jobs')(context, 'job'), require('../storage/jobs')(context, 'ex')])
        .spread(function(job, ex) {
            logger.info("JobsService: initializing");
            job_store = job;
            ex_store = ex;

            return _initialize(); // Load the initial pendingJobs state.
        });

};
