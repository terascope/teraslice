'use strict';

var moment = require('moment');
var Promise = require('bluebird');
var uuid = require('uuid');

var Queue = require('../utils/queue');
var workerQueue = new Queue;

var statContainer = require('../utils/analytics').statContainer;
var addStats = require('../utils/analytics').addStats;
var analyzeStats = require('../utils/analytics').analyzeStats;

var event = require('../utils/events');

module.exports = function(context) {
    var logger = context.logger;
    var state_store = require('./storage/state')(context);
    var io = require('socket.io')();
    var start = moment();
    var engineCanRun = true;
    var engine;
    var scheduler;

    var job_runner = require('./runners/job')(context);

    function sendMessage(id, msg, data) {
        io.sockets.in(id).emit(msg, data)
    }

    function checkJobState(jobConfig) {
        if (jobConfig.lifecycle !== "persistent") {
            var query = 'job_id:' + jobConfig.job_id + ' AND state:error';
            //query, from, size, sort
            return state_store.search(query, 0, 0)
        }
    }

    function logState(jobConfig, slice, status, error) {
        if (jobConfig.lifecycle !== "persistent") {
            state_store.log(jobConfig.job_id, slice, status, error)
                .catch(function(err) {
                    logger.error("Error when saving state record: " + err)
                });
        }
    }

    function lifecycle(job) {
        if (job.lifecycle === 'once') {
            return once;
        }
        if (job.lifecycle === 'periodic') {
            return periodic;
        }
        if (job.lifecycle === 'persistent') {
            return persistent;
        }
    }

    function periodic(msg) {

    }

    function persistent(slicer, workerQueue, job) {
        var logger = job.jobConfig.logger;
        var isProcessing = false;

        return function() {

            if (!isProcessing) {
                isProcessing = true;

                Promise.resolve(slicer())
                    .then(function(slice_request) {
                        //not null or undefined
                        if (slice_request != null) {
                            var worker = workerQueue.dequeue();

                            var slice = {
                                slice_id: uuid.v4(),
                                request: slice_request
                            };

                            //writeToStateFile(job.stateName, data, 'start');
                            logState(job.jobConfig, slice, 'start');

                            sendMessage(worker.id, 'slicer:new_slice', {message: 'data', data: slice})
                        }
                        isProcessing = false;
                    })

            }
        }
    }

    function once(slicer, workerQueue, job) {
        var isProcessing = false;
        var retryQueue = false;
        var processDone = 0;
        var clusterShutdown = context.sysconfig.teraslice.cluster ? true : false;

        if (job.logData && job.logData.retryQueue) {
            retryQueue = job.logData.retryQueue;
        }

        return function() {
            if (!isProcessing) {
                isProcessing = true;
                var worker = workerQueue.dequeue();

                if (retryQueue && retryQueue.size()) {
                    var retryData = retryQueue.dequeue();
                    sendMessage(worker.id, 'slicer:new_slice', {message: 'data', data: retryData});
                    isProcessing = false;
                }
                else {

                    Promise.resolve(slicer(worker))
                        .then(function(slice_request) {
                            //not null or undefined
                            if (slice_request != null) {
                                var slice = {
                                    slice_id: uuid.v4(),
                                    request: slice_request
                                };

                                logState(job.jobConfig, slice, 'start');
                                sendMessage(worker.id, 'slicer:new_slice', {message: 'data', data: slice});
                            }
                            else {
                                processDone++;

                                if (processDone >= Object.keys(io.sockets.sockets).length) {
                                    event.emit('slicer:job_finished')
                                }
                            }
                            isProcessing = false;
                        })
                }
            }
        }
    }

    function logFinishedJob(start, job, analyticsData) {
        var end = moment();
        var time = (end - start ) / 1000;
        var logger = job.jobConfig.logger;

        if (job.jobConfig.analytics) {
            analyzeStats(logger, job.jobConfig.operations, analyticsData);
        }

        logger.info('job ' + job.jobConfig.name + ' has finished in ' + time + ' seconds');

        if (context.sysconfig.teraslice.cluster) {
            //TODO do the calc stuff
        }
        else {
            //transferLogs(logger, job.stateName);
        }
    }

    Promise.resolve(job_runner.initialize())
        .then(function(job) {

            var reader = job.reader;
            var analyticsData = statContainer(job.jobs);
            var port = job.jobConfig.slicer_port;

            var slicerFn = reader.newSlicer(context, job.readerConfig, job.jobConfig);

            io.on('connection', function(socket) {

                socket.on('worker:ready', function(msg) {
                    socket.teraslice_id = msg.id;
                    socket.join(msg.id);
                    workerQueue.enqueue(msg);
                });

                socket.on('worker:slice_complete', function(msg) {
                    //Need to join room if a restart happened
                    if (msg.retry) {
                        socket.teraslice_id = msg.id;
                        socket.join(msg.id)
                    }

                    if (msg.error) {
// TODO: there needs to be some sort of event generated here that there was an error in the job.
                        logState(job.jobConfig, msg.slice, 'error', msg.error);
                    }
                    else {
                        logState(job.jobConfig, msg.slice, 'completed');
                    }

                    if (msg.analytics) {
                        addStats(analyticsData, msg.analytics);
                    }
                    //Report to worker that it has been reported, so it can remove reference to last slice
                    sendMessage(msg.id, 'slicer:slice_recorded', null);

                    workerQueue.enqueue(msg);
                });

                socket.on('disconnect', function() {
                    workerQueue.remove(socket.teraslice_id)
                });
            });

            io.listen(port);


            Promise.resolve(slicerFn)
                .then(function(slicer) {
                    scheduler = lifecycle(job.jobConfig)(slicer, workerQueue, job);

                    event.once('slicer:job_finished', function() {
                        logFinishedJob(start, job, analyticsData);
                        checkJobState(job.jobConfig).then(function(errData) {
                            process.send({
                                message: 'node_master:job_finished',
                                job_id: job.jobConfig.job_id,
                                errors: errData
                            });
                        });

                    });

                    if (engineCanRun) {
                        engine = setInterval(function() {
                            if (workerQueue.size()) {
                                scheduler()
                            }
                        }, 1);
                    }

                });
        });

    process.on('message', function(msg) {

        if (msg.message === 'cluster_service:stop_job' || msg.message === 'shutdown') {
            engineCanRun = false;
            clearInterval(engine);
            setInterval(function() {
                //this is to wait for other workers to complete and report back and shutdown before exiting
                if (Object.keys(io.sockets.sockets).length === 0) {
                    process.exit()
                }
            }, 500);
        }

        if (msg.message === 'cluster_service:pause_slicer') {
            engineCanRun = false;
            clearInterval(engine);
        }

        if (msg.message === 'cluster_service:resume_slicer') {
            engineCanRun = true;
            engine = setInterval(function() {
                if (workerQueue.size()) {
                    scheduler()
                }
            }, 1);
        }

        if (msg.message === 'cluster_service:restart_slicer') {
            engineCanRun = false;
            clearInterval(engine);

            setInterval(function() {
                //every socket joins a room by it's unique io identifier by default besides the id room
                var rooms = Object.keys(io.sockets.adapter.rooms).length / 2;
                if (rooms <= workerQueue.size()) {
                    process.exit()
                }
            }, 500)

        }
    });

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    process.on('SIGTERM', noOP);
    process.on('SIGINT', noOP);

    function __test_context(temp_context) {
        if (temp_context) context = temp_context;

        return {
            once: once,
            persistent: persistent,
            lifecycle: lifecycle
        }
    }

    return {
        __test_context: __test_context
    }
};
