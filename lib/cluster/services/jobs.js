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
    'pending', 'scheduling', 'running', 'failing', 'paused',
    'completed', 'stopped', 'rejected', 'failed', 'aborted'
];

// Maps job notification to Job states
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


module.exports = function(context, cluster_service) {
    var logger = context.logger;

    var job_store;
    var job_validator = require('../../config/validators/job')(context);

    var events = require('../../utils/events');

    var pendingJobsScheduler;

    events.on('cluster:job_finished', function(job_id) {
        getJob(job_id)
            .then(function(job) {
                logger.info("JobsService: job " + job_id + " has completed.");

                _setStatus(job, 'completed')
            });
    });

    events.on('cluster:job_failure', function(data) {
        var job_id = data.job_id;

        getJob(job_id)
            .then(function(job) {
                logger.error("JobsService: job " + job_id + " has failed to complete.");

                var metaData = {};
                if (data._errorMessage) metaData._failureReason = data._errorMessage;

                _setStatus(job, 'failed', metaData)
            });
    });

    events.on('slicer:processing_error', function(data) {
        getJob(data.job_id)
            .then(function(job) {
                logger.error("JobsService: job " + data.job_id + " has had at least one slice failure and will be marked 'failed'");

                _setStatus(job, 'failing')
            });
    });

    function submitJob(job_spec) {
        // Default status for jobs is pending
        return _validateJob(job_spec)
            .then(function() {
                return _setStatus(job_spec, 'pending')
                    .then(function(job) {
                        pendingJobsQueue.enqueue(job);
                        return job.job_id;
                    });
            });
    }

    // Updates the job but does not automatically start it.
    function updateJob(job_id, job_spec) {
        return getJob(job_id)
            .then(function(job) {
                if (job._status == 'pending' || job._status == 'scheduling') {
                    throw new Error("Job's can not be updated when in pending or scheduling state");
                }

                if (job._status == 'running' || job._status == 'paused') {
                    throw new Error("Job must be stopped before it can be updated.");
                }

                return job_store.update(job_id, job_spec);
            })
    }

    // Valid notifications: stop, pause, resume
    function notify(job_id, state) {
        var status = STATE_MAPPING[state];

        return _signalJobStateChange(job_id, state, status)
            .catch(function(ev) {
                throw new Error(ev)
            });
    }

    function startJob(job_id, recover_job) {
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
    }

    function getJob(job_id) {
        return job_store.get(job_id)
            .then(function(job_spec) {
                return job_spec;
            });
    }

    function jobStatus(job_id) {
        return getJob(job_id)
            .then(function(job_spec) {
                return job_spec.status;
            });
    }

    function getJobs(status, from, size) {
        // This is looking at persistent storage. In some scenarios the in memory
        // queue may differ.
        return job_store.getJobs(status, from, size);
    }

    // Checks the queue of pending jobs and will allocate any workers required.
    function jobAllocator() {
        var isJobBeingAllocated = false;

        return function() {

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
                                return _setStatus(job, 'running');
                            })
                            .then(function(status) {
                                console.log('allowing more jobs to be run');
                                isJobBeingAllocated = false;
                            })
                            .catch(function(err) {
                                //this is to catch errors of allocateWorkers, if allocation fails, they are enqueued
                                logger.error("Workers failed to be allocated, they will be enqueued, error: " + err);
                                isJobBeingAllocated = false;
                            })
                    })
                        .catch(function(err) {
                            logger.error("JobsService: Failure during worker allocation - " + err);
                            isJobBeingAllocated = false;
                            _setStatus(job, 'failed');
                        });
                });
            }

        }
    }

    function _signalJobStateChange(job_id, notice, state) {
        return _notifyCluster(job_id, notice)
            .then(function() {
                return job_store.get(job_id)
                    .then(function(job_spec) {
                        logger.info("JobsService: job " + job_id + " has changed to state '" + state + "'");

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
    function _notifyCluster(job_id, notice) {
        var slicerOnly = false;
        if (notice === 'pause' || notice === 'resume') slicerOnly = true;

        if (!MESSAGE_MAPPING[notice]) {
            throw new Error("JobsService: invalid notification message");
        }

        var message = MESSAGE_MAPPING[notice];

        return new Promise(function(resolve, reject) {
            var requests = [];
            var nodes = cluster_service.findNodesForJob(job_id, slicerOnly);

            nodes.forEach(function(node) {
                var messageNode = cluster_service.notifyNode(node.node_id, message, {
                    job_id: job_id
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
            if (job_spec.job_id) {
                var status = {_status: status};
                if (metaData) {
                    _.assign(status, metaData)
                }
                return job_store.update(job_spec.job_id, status)
                    .then(function() {
                        return job_spec;
                    });
            }
            else {
                job_spec._status = status;
                if (metaData) {
                    _.assign(job_spec, metaData)
                }
                return job_store.create(job_spec);
            }
        }
        else {
            throw new Error("Invalid Job status: " + status);
        }
    }

    function _validateJob(job_spec) {
        return new Promise(function(resolve, reject) {
            // This will throw errors if the job does not pass validation.
            try {
                job_validator.validate(job_spec);
            }
            catch (ev) {
                reject('Error validating job: ' + ev)
            }

            resolve(job_spec);
        });
    }

    function shutdown() {
        logger.info("JobsService: shutting down.");
        return job_store.shutdown();
    }

    var api = {
        submitJob: submitJob,
        updateJob: updateJob,
        notify: notify,
        getJob: getJob,
        getJobs: getJobs,
        startJob: startJob,
        shutdown: shutdown
    };

    function _initialize() {
        pendingJobsQueue = new Queue;

        // Reschedule any persistent jobs that were running.
        // There may be some additional subtlety required here.
        return getJobs('running').each(function(job) {
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
                return getJobs('pending')
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


    return require('../storage/jobs')(context)
        .then(function(store) {
            logger.info("JobsService: initializing");
            job_store = store;
            return _initialize(); // Load the initial pendingJobs state.
        });

};
