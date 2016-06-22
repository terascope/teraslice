'use strict';

var moment = require('moment');
var Promise = require('bluebird');
var uuid = require('uuid');

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

    var job, reader, analyticsData;

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
        available_workers: 0,
        active_workers: 0,
        failed: 0,
        subslices: 0,
        queued: 0,
        zero_slice_reduction: 0,
        processed: 0,
        slicers: 0,
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
            reader = job.reader;
            analyticsData = statContainer(job.jobs);

            // We're ready for execution
            startSlicer(job.jobConfig.slicer_port, slicerAnalytics);
        })
        .catch(function(err) {
            logger.error("Slicer: failure during initialization for job " + job.jobConfig.job_id);
            logger.error(err);
        });

    io.on('connection', function(socket) {

        socket.on('worker:ready', function(msg) {
            socket.teraslice_id = msg.id;
            socket.join(msg.id);
            workerQueue.enqueue(msg);
        });

        socket.on('worker:slice_complete', function(msg) {
            slicerAnalytics.processed += 1;
            //Need to join room if a restart happened
            if (msg.retry) {
                socket.teraslice_id = msg.id;
                socket.join(msg.id)
            }

            if (msg.error) {
                slicerAnalytics.failed += 1;
                event.emit('slicer:processing_error');
                //if an error occurred while in recovery, fail the job as a whole
                if (inRecoveryMode) {
                    process.send({message: 'slicer:failed_recovery', job_id: job.jobConfig.job_id});
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
            workerQueue.enqueue(msg);
        });

        socket.on('disconnect', function() {
            workerQueue.remove(socket.teraslice_id)
        });
    });

    function startSlicer(port, slicerAnalytics) {
        io.listen(port);

        if (process.env.recover_job && job.jobConfig.lifecycle === 'once') {
            inRecoveryMode = true;

            var numOfSlicersToRecover = reader.parallelSlicers ? job.jobConfig.slicers : 1;
            for (var i = 0; i < numOfSlicersToRecover; i++) {
                recoveredSlices.push(state_store.recoveryContext(job.jobConfig.job_id, i))
            }
        }

        event.on('slicer recursion', function() {
            slicerAnalytics.subslices += 1;
        });
        event.on('zero slice reduction', function() {
            slicerAnalytics.zero_slice_reduction += 1;
        });

        event.on('getRetryData_completed', function() {
            logger.info('The recovered data for job:' + job.jobConfig.job_id + ' has successfully been enqueued');
            inRecoveryMode = false;
        });

        event.once('slicer:processing_error', function() {
            process.send({message: 'slicer:processing_error', job_id: job.jobConfig.job_id});
        });


        Promise.all(recoveredSlices).then(function(retryData) {
            return reader.newSlicer(context, job, retryData, slicerAnalytics)
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
                        slicerAnalytics.available_workers = currentWorkers;
                        slicerAnalytics.queued = slicerQueue.size();
                        slicerAnalytics.active_workers = io.eio.clientsCount - currentWorkers;


                        //don't run slicers if recovering, all slices have been divided up or if the queue is too large
                        if (!inRecoveryMode && !allSlicersDone && slicerQueue.size() <= 10000) {
                            //call slicers to enqueue into slicerQueue
                            scheduler.forEach(function(slicer) {
                                slicer();
                            });
                        }
                    };

                    //send message that job is in running state
                    process.send({message: 'slicer:slicer_initialized', job_id: job.jobConfig.job_id});

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
                        if (slicerDone === totalSlicers) {
                            //all workers have reported back completions
                            allSlicersDone = true;
                            slicerAnalytics.queuing_complete = moment().format(dateFormat);

                            var isDone = setInterval(function() {
                                //slicer is done when slice queue is empty and all workers have reported back from processing
                                if (workerQueue.size() >= Object.keys(io.sockets.sockets).length && slicerQueue.size() === 0) {
                                    clearInterval(isDone);
                                    logFinishedJob(context, start, job, analyticsData);
                                    checkJobState(job.jobConfig).then(function(errCount) {
                                        process.send({
                                            message: 'slicer:job_finished',
                                            job_id: job.jobConfig.job_id,
                                            errorCount: errCount
                                        });
                                    });
                                }
                            }, 500)
                        }

                    });

                }).catch(function(err) {
                    return Promise.reject('Error on slicer initialization: ' + err.stack)
                });
        }).catch(function(err) {
            logger.error(err);
            var errorMsg = err.stack ? err.stack : err;
            //signal that creation of slicer failed in job allocation
            process.send({message: 'slicer:error', error: errorMsg, job_id: process.env.job_id})
        });
    }

    process.on('message', function(msg) {

        if (msg.message === 'cluster_service:stop_job' || msg.message === 'shutdown') {
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
                                job_id: job.jobConfig.job_id,
                                _msgID: msg._msgID
                            });
                            process.exit();
                        });
                }
            }, 500);
        }

        if (msg.message === 'cluster_service:pause_slicer') {
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
                data: {node_id: msg.node_id, job_id: job.jobConfig.job_id, stats: slicerAnalytics}
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
                process.send({message: 'slicer:failed_recovery', job_id: job.jobConfig.job_id});
            }
        }, 600000);

        var retrySlicer = setInterval(function() {
            //only get more data if slicerQueue is empty and all work has been reported
            if (slicerQueue.size() === 0 && Object.keys(retryState).length === 0 && !isGettingData) {
                isGettingData = true;

                //remove all intervals/timeouts
                clearTimeout(retryError);
                clearInterval(retrySlicer);

                state_store.recoveryContext(retryData.job_id, retryData.slicer_id)
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
            var query = 'job_id:' + jobConfig.job_id + ' AND state:error';
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
                            var slice = {
                                slice_id: uuid.v4(),
                                request: slice_request,
                                slicer_id: index
                            };

                            logState(job.jobConfig, slice, 'start');
                            slicerQueue.enqueue(slice);
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
                            var slice = {
                                slice_id: uuid.v4(),
                                request: slice_request,
                                slicer_id: index
                            };

                            logState(job.jobConfig, slice, 'start');
                            slicerQueue.enqueue(slice);
                            isProcessing = false;
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
