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
    'pending', 'scheduling', 'running', 'paused',
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

var initializing = true;

module.exports = function(context, cluster_service) {
    var logger = context.logger;

    var job_store = require('../storage/jobs')(context);
    var job_validator = require('../../config/validators/job')(context);

    var events = require('../../utils/events');

    _initialize(); // Load the initial pendingJobs state.

    var pendingJobsScheduler = setInterval(function() {
        _allocateJobs();
    }, 1000);

    events.on('cluster:job_finished', function(job_id) {
        getJob(job_id)
            .then(function(job) {
                _setStatus(job, 'completed')
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

        return _signalJobStateChange(job_id, state, status);
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
    function _allocateJobs() {
        function allocateJob() {
            if (pendingJobsQueue.size() > 0) {
                if (cluster_service.availableWorkers() > 0) {
                    var job = pendingJobsQueue.dequeue();
                    var recover_job = job._recover_job;

                    logger.info("JobsService: Scheduling job: " + job.job_id);
                    _setStatus(job, 'scheduling').then(function() {
                        cluster_service.allocateSlicer(job, recover_job).then(function() {
                            cluster_service.allocateWorkers(job, job.workers)
                                .then(function() {
                                    _setStatus(job, 'running');

                                    allocateJob();
                                });

/*                            var workers = [];
                            for (var i = 0; i < job.workers; i++) {
                                workers.push(cluster_service.allocateWorker(job));
                            }
// TODO: error conditions here. not allocating all workers.
                            return Promise.all(workers).then(function() {
                                _setStatus(job, 'running');

                                allocateJob();
                            });*/
                        })
                        .error(function(err) {
                            _setStatus(job, 'failed');
                            throw err;
                        });
                    });
                }
            }
        }

        allocateJob();
    }

    function _signalJobStateChange(job_id, notice, state) {
        return _notifyCluster(job_id, notice)
            .then(function() {
                return job_store.get(job_id)
                    .then(function(job_spec) {
                        return _setStatus(job_spec, state);
                    });
            })
            .then(function(job) {
                return true;
            });
    }

    // TODO: is this in the right place? It may make more sense in services.cluster
    function _notifyCluster(job_id, notice) {
        var slicerOnly = false;
        if (notice === 'pause' || notice === 'resume') slicerOnly = true;

        if (! MESSAGE_MAPPING[notice]) {
            throw new Error("JobsService: invalid notification message");
        }

        var message = MESSAGE_MAPPING[notice];

        return new Promise(function(resolve, reject) {
            var requests = [];
            var nodes = cluster_service.findNodesForJob(job_id, slicerOnly)

            nodes.forEach(function(node) {
                message = cluster_service.notifyNode(node.node_id, message, {
                    job_id: job_id
                });

                requests.push(message);
            });

            return Promise.all(requests)
                .then(function() { resolve(true) });
        });
    }

    function _setStatus(job_spec, status) {
        if (VALID_STATUS.indexOf(status) != -1) {
            if (job_spec.job_id) {
                return job_store.update(job_spec.job_id, {
                    _status: status
                })
                .then(function() {
                    return job_spec;
                });
            }
            else {
                job_spec._status = status;

                return job_store.create(job_spec);
            }
        }
        else {
            throw new Error("Invalid Job status: " + status);
        }
    }

    function _validateJob(job_spec) {
        return new Promise(function(resolve, reject) {
            //if (! job_spec.workers) job_spec.workers = 5;

            // This will throw errors if the job does not pass validation.
            job_validator.validate(job_spec);

            resolve(job_spec);
        });
    }

    function _initialize() {
        if (initializing) {
            pendingJobsQueue = new Queue;

            // Reschedule any persistent jobs that were running.
            // There may be some additional subtlety required here.
            getJobs('running').each(function(job) {
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
                // Currently this will not preserve the order.
                getJobs('pending').each(function(job_spec) {
                    pendingJobsQueue.enqueue(job_spec);
                })
                .then(function() {
                    logger.info("JobsService: Pending Jobs initialization complete.");
                    initializing = false;
                })
            })
            .error(function(err) {
                    if (err.body.error.reason !== 'no such index') {
                        logger.error("JobsService: initialization failed loading state from Elasticsearch: " + err);
                    }
            });
        }
    }

    return {
        submitJob: submitJob,
        updateJob: updateJob,
        notify: notify,
        getJob: getJob,
        getJobs: getJobs,
        startJob: startJob
    }
};