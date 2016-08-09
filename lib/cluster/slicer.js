'use strict';

var moment = require('moment');
var Promise = require('bluebird');
var uuid = require('uuid');
var _ = require('lodash');

var Queue = require('../utils/queue');
var workerQueue = new Queue;
var slicerQueue = new Queue;

var statContainer = require('../utils/analytics').statContainer;
var addStats = require('../utils/analytics').addStats;
var analyzeStats = require('../utils/analytics').analyzeStats;
var logStateInit = require('../utils/elastic_utils').logState;
var dateFormat = require('../utils/elastic_utils').dateFormat;
var event = require('../utils/events');

module.exports = function(context) {
    var logger = context.logger;
    var state_store;
    var job_runner;

    var job, slicer, analyticsData;

    var io = require('socket.io')();

    //Stateful variables
    var start = moment();
    var engineCanRun = true;
    var engine;
    var scheduler;
    var slicerDone = 0;
    var allSlicersDone = false;
    var engineFn;
    var recoveredSlices = [];
    var inRecoveryMode = false;
    var logState;

    //temporary fix
    var retryState = {};

    var slicerAnalytics = {
        workers_available: 0,
        workers_active: 0,
        workers_joined: 0,
        workers_reconnected: 0,
        workers_disconnected: 0,
        failed: 0,
        subslices: 0,
        queued: 0,
        zero_slice_reduction: 0,
        processed: 0,
        slicers: 0,
        subslice_by_key: 0,
        started: moment().format(dateFormat)
    };

    /*
     Main logic
     _______________________________________________________
     */
    require('./storage/state')(context)
        .then(function(store) {
            state_store = store;
            logState = logStateInit(state_store);
            return require('./runners/job')(context);
        })
        .then(function(runner) {
            job_runner = runner;

            job = job_runner.initialize();
            slicer = job.slicer;
            analyticsData = statContainer(job.jobs);
            // We're ready for execution
            startSlicer(job.jobConfig.slicer_port, slicerAnalytics);
        })
        .catch(function(err) {
            logger.error(`Slicer: failure during initialization for job ${process.env.ex_id}`);
            logger.error(err);
        });

    io.on('connection', function(socket) {

        socket.on('worker:ready', function(msg) {
            logger.info(`worker: ${msg.id} has joined slicer: ${job.jobConfig.ex_id}`);
            slicerAnalytics.workers_joined += 1;
            socket.teraslice_id = msg.id;
            socket.join(msg.id);
            workerQueue.enqueue(msg);
        });

        socket.on('worker:slice_complete', function(msg) {
            slicerAnalytics.processed += 1;
            //Need to join room if a restart happened
            if (msg.retry) {
                logger.warn(`worker: ${msg.id} has rejoined slicer: ${job.jobConfig.ex_id}`);
                slicerAnalytics.workers_reconnected += 1;
                socket.teraslice_id = msg.id;
                socket.join(msg.id)
            }

            if (msg.error) {
                logger.error(`worker: ${msg.id} has error on slice: ${JSON.stringify(msg)} , slicer: ${job.jobConfig.ex_id}`);
                slicerAnalytics.failed += 1;
                event.emit('slicer:processing_error');
                //if an error occurred while in recovery, fail the job as a whole
                if (inRecoveryMode) {
                    process.send({message: 'slicer:failed_recovery', ex_id: job.jobConfig.ex_id});
                }
            }
            else {
                if (msg.analytics) {
                    addStats(analyticsData, msg.analytics);
                }

                //temporary for retry mode
                if (inRecoveryMode) {
                    delete retryState[msg.slice.request.start]
                }
            }
            //Report to worker that it has been reported, so it can remove reference to last slice
            sendMessage(msg.id, 'slicer:slice_recorded', null);
            if (!msg.isShuttingDown) {
                workerQueue.enqueue(msg);
            }
        });

        socket.on('disconnect', function() {
            slicerAnalytics.workers_disconnected += 1;
            logger.warn(`Worker: ${socket.teraslice_id} has disconnected`);
            workerQueue.remove(socket.teraslice_id);
        });
    });

    function startSlicer(port, slicerAnalytics) {
        io.listen(port);

        if (process.env.recover_execution && job.jobConfig.lifecycle === 'once') {
            logger.info(`slicer: ${job.jobConfig.ex_id} is starting in recovery mode`);

            inRecoveryMode = true;

            var numOfSlicersToRecover = slicer.parallelSlicers ? job.jobConfig.slicers : 1;
            for (var i = 0; i < numOfSlicersToRecover; i++) {
                recoveredSlices.push(state_store.recoveryContext(job.jobConfig.ex_id, i))
            }
        }

        event.on('slicer recursion', function() {
            slicerAnalytics.subslices += 1;
        });

        event.on('zero slice reduction', function() {
            slicerAnalytics.zero_slice_reduction += 1;
        });

        event.on('getRetryData_completed', function() {
            logger.info(`The recovered data for job: ${job.jobConfig.ex_id} has successfully been enqueued`);
            inRecoveryMode = false;
        });

        event.once('slicer:processing_error', function() {
            logger.error(`slicer: ${job.jobConfig.ex_id} has encountered a processing_error`);
            process.send({message: 'slicer:processing_error', ex_id: job.jobConfig.ex_id});
        });


        Promise.all(recoveredSlices).then(function(retryData) {
            return slicer.newSlicer(context, job, retryData, slicerAnalytics)
                .then(function(slicers) {
                    var totalSlicers = slicers.length;
                    slicerAnalytics.slicers = totalSlicers;
                    scheduler = getScheduler(job, slicers, slicerQueue);

                    engineFn = function engineFn() {

                        while (workerQueue.size() && slicerQueue.size()) {
                            var worker = workerQueue.dequeue();
                            var sliceData = slicerQueue.dequeue();
                            sendMessage(worker.id, 'slicer:new_slice', {message: 'data', data: sliceData});
                        }

                        var currentWorkers = workerQueue.size();
                        slicerAnalytics.workers_available = currentWorkers;
                        slicerAnalytics.queued = slicerQueue.size();
                        slicerAnalytics.workers_active = io.eio.clientsCount - currentWorkers;


                        //don't run slicers if recovering, all slices have been divided up or if the queue is too large
                        if (!inRecoveryMode && !allSlicersDone && slicerQueue.size() <= 10000) {
                            //call slicers to enqueue into slicerQueue
                            scheduler.forEach(function(slicer) {
                                slicer();
                            });
                        }
                    };

                    //send message that job is in running state
                    logger.info(`slicer: ${job.jobConfig.ex_id} has initialized`);
                    process.send({message: 'slicer:slicer_initialized', ex_id: job.jobConfig.ex_id});

                    //start the engine
                    if (engineCanRun) {
                        engine = setInterval(engineFn, 1);
                    }
                    //provision the retry data to the slicerQueue if they exist
                    if (retryData.length > 0) {
                        getRetryData(retryData)
                    }

                    event.on('slicer:job_finished', function() {
                        slicerDone++;
                        logger.info(`a slicer for job: ${job.jobConfig.ex_id} has completed its range`);

                        if (slicerDone === totalSlicers) {
                            logger.info(`all slicers for job: ${job.jobConfig.ex_id} have been completed, 
                            waiting for slices in slicerQueue to be processed`);
                            //all workers have reported back completions
                            allSlicersDone = true;
                            slicerAnalytics.queuing_complete = moment().format(dateFormat);

                            var isDone = setInterval(function() {
                                //slicer is done when slice queue is empty and all workers have reported back from processing
                                if (workerQueue.size() >= Object.keys(io.sockets.sockets).length && slicerQueue.size() === 0) {
                                    logger.info(`all work for job: ${job.jobConfig.ex_id} has completed, starting cleanup`);

                                    clearInterval(isDone);
                                    if (job.jobConfig.analytics) {
                                        logFinishedJob(context, start, job, analyticsData);
                                    }
                                    checkJobState(job.jobConfig).then(function(errCount) {
                                        process.send({
                                            message: 'slicer:job_finished',
                                            ex_id: job.jobConfig.ex_id,
                                            errorCount: errCount
                                        });
                                    });
                                }
                            }, 500)
                        }

                    });

                }).catch(function(err) {
                    return Promise.reject('Error on slicer initialization: ' + JSON.stringify(err))
                });
        }).catch(function(err) {
            logger.error(err);
            var errorMsg = err.stack ? err.stack : err;
            //signal that creation of slicer failed in job allocation
            process.send({message: 'slicer:error', error: errorMsg, ex_id: process.env.ex_id})
        });
    }

    process.on('message', function(msg) {

        if (msg.message === 'cluster_service:stop_job' || msg.message === 'shutdown') {
            logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a shutdown notice`);

            engineCanRun = false;
            clearInterval(engine);
            setInterval(function() {
                //this is to wait for other workers to complete and report back and shutdown before exiting
                if (Object.keys(io.sockets.sockets).length === 0) {
                    state_store.shutdown()
                        .then(function() {
                            process.send({
                                message: 'message_processed',
                                action: msg.message,
                                ex_id: job.jobConfig.ex_id,
                                _msgID: msg._msgID
                            });
                            process.exit();
                        });
                }
            }, 500);
        }

        if (msg.message === 'cluster_service:pause_slicer') {
            logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a pause notice`);
            engineCanRun = false;
            clearInterval(engine);
            process.send({
                message: 'message_processed',
                action: 'cluster_service:pause_slicer',
                _msgID: msg._msgID
            });
            return;
        }

        if (msg.message === 'cluster_service:resume_slicer') {
            logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a resume notice`);
            engine = setInterval(engineFn, 1);
            engineCanRun = true;
            process.send({
                message: 'message_processed',
                action: 'cluster_service:resume_slicer',
                _msgID: msg._msgID
            });
            return;
        }

        if (msg.message === 'cluster_service:restart_slicer') {
            logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a restart notice`);
            engineCanRun = false;
            clearInterval(engine);

            setInterval(function() {
                //every socket joins a room by it's unique io identifier by default besides the id room
                var rooms = Object.keys(io.sockets.adapter.rooms).length / 2;
                if (rooms <= workerQueue.size()) {
                    process.send({
                        message: 'message_processed',
                        action: 'cluster_service:restart_slicer',
                        _msgID: msg._msgID
                    });
                    process.exit()
                }
            }, 500)

        }

        if (msg.message === 'cluster_service:slicer_analytics') {
            process.send({
                message: 'message_processed',
                action: 'cluster_service:slicer_analytics',
                _msgID: msg._msgID,
                data: {node_id: msg.node_id, ex_id: job.jobConfig.ex_id, stats: slicerAnalytics}
            });
            return;
        }
    });

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    process.on('SIGTERM', noOP);
    process.on('SIGINT', noOP);


    /*
     Supporting functions
     ________________________________________________________________
     */
    function getRetryData(retryArray, retryObj) {
        var isGettingData = false;
        var retryData = retryObj ? retryObj : retryArray.shift();

        if (retryData.retryList && retryData.retryList.length > 0) {
            retryData.retryList.forEach(function(doc) {
                //keep state of slices doled out, removed at slice complete event

                retryState[doc.request.start] = true;
                slicerQueue.enqueue(doc);
            });
        }

        //set to error if the slice set of the recovering slicer cannot complete in 10 minutes
        var retryError = setTimeout(function() {
            if (Object.keys(retryState).length !== 0) {
                process.send({message: 'slicer:failed_recovery', ex_id: job.jobConfig.ex_id});
            }
        }, 600000);

        var retrySlicer = setInterval(function() {
            //only get more data if slicerQueue is empty and all work has been reported
            if (slicerQueue.size() === 0 && Object.keys(retryState).length === 0 && !isGettingData) {
                isGettingData = true;

                //remove all intervals/timeouts
                clearTimeout(retryError);
                clearInterval(retrySlicer);

                state_store.recoveryContext(retryData.ex_id, retryData.slicer_id)
                    .then(function(resultObj) {
                        //if any data returns run it again
                        if (resultObj.retryList.length > 0) {
                            getRetryData(retryArray, resultObj)
                        }
                        else {
                            //data set complete of this slicer, check if its the last, if so emit all done
                            if (retryArray.length === 0) {
                                event.emit('getRetryData_completed')
                            }
                            else {
                                //process the next in line
                                getRetryData(retryArray)
                            }
                        }
                    });
            }
        }, 200);

    }

    function checkJobState(jobConfig) {
        if (jobConfig.lifecycle !== "persistent") {
            var query = 'ex_id:' + jobConfig.ex_id + ' AND state:error';
            //return the count of errors
            return state_store.count(query, 0)
        }
    }

    function lifecycle(job) {
        if (job.lifecycle === 'once') {
            return once;
        }
        if (job.lifecycle === 'persistent') {
            return persistent;
        }
    }

    function persistent(slicer, slicerQueue, job, index) {
        var logger = job.jobConfig.logger;
        var isProcessing = false;

        return function() {

            if (!isProcessing) {
                isProcessing = true;

                Promise.resolve(slicer())
                    .then(function(slice_request) {
                        //not null or undefined
                        if (slice_request != null) {
                            if (_.isArray(slice_request)) {
                                logger.warn(`slicer for job: ${job.jobConfig.ex_id} is subslicing by key`);
                                slicerAnalytics.subslice_by_key += 1;
                                _.forEach(slice_request, function(data) {
                                    var slice = {
                                        slice_id: uuid.v4(),
                                        request: data,
                                        slicer_id: index
                                    };

                                    logState(job.jobConfig, slice, 'start');
                                    slicerQueue.enqueue(slice);
                                });

                            }
                            else {
                                var slice = {
                                    slice_id: uuid.v4(),
                                    request: slice_request,
                                    slicer_id: index
                                };

                                logState(job.jobConfig, slice, 'start');
                                slicerQueue.enqueue(slice);
                            }
                        }
                        isProcessing = false;
                    })
            }
        }
    }

    function once(slicer, slicerQueue, job, index) {
        var hasCompleted = false;
        var isProcessing = false;

        return function() {
            if (!isProcessing) {
                isProcessing = true;
                Promise.resolve(slicer())
                    .then(function(slice_request) {
                        //not null or undefined
                        if (slice_request != null) {
                            if (_.isArray(slice_request)) {
                                logger.warn(`slicer for job: ${job.jobConfig.ex_id} is subslicing by key`);
                                slicerAnalytics.subslice_by_key += 1;
                                _.forEach(slice_request, function(data) {
                                    var slice = {
                                        slice_id: uuid.v4(),
                                        request: data,
                                        slicer_id: index
                                    };

                                    logState(job.jobConfig, slice, 'start');
                                    slicerQueue.enqueue(slice);
                                });

                                isProcessing = false;
                            }
                            else {
                                var slice = {
                                    slice_id: uuid.v4(),
                                    request: slice_request,
                                    slicer_id: index
                                };

                                logState(job.jobConfig, slice, 'start');
                                slicerQueue.enqueue(slice);
                                isProcessing = false;
                            }
                        }
                        else {
                            if (!hasCompleted) {
                                event.emit('slicer:job_finished');
                                hasCompleted = true;
                            }
                        }
                    })
            }
        }
    }

    function logFinishedJob(context, start, job, analyticsData) {
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

    function getScheduler(job, slicers, slicerQueue) {
        var fnArray = [];
        slicers.forEach(function(slicer, index) {
            fnArray.push(lifecycle(job.jobConfig)(slicer, slicerQueue, job, index));
        });

        return fnArray;
    }

    function sendMessage(id, msg, data) {
        io.sockets.in(id).emit(msg, data)
    }


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
