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
var elasticError = require('../utils/error_utils').elasticError;
var messaging = require('./services/messaging');


module.exports = function(context) {
    var state_store;
    var network = messaging({type: 'network', isClient: false});
    var ipc = messaging({type: 'process', isClient: true});

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
    var hasRecovered = false;
    var workerFound = false;
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

    var logger = context.foundation.makeLogger('slicer', 'slicer', {ex_id: process.env.ex_id, module: 'slicer'});

    //event can be fired from anything that instantiates a client, such as stores and slicers
    //needs to be setup before job_runner
    event.on('client config error', terminalShutdown);

    //these need to be synchronous, so stop/pause/resume actions actually have job defined at all times
    var job_runner = require('./runners/job')(context);
    var job = job_runner.initialize();
    var slicer = job.slicer;

    var analyticsData = statContainer(job.jobs);


    /*
     Main logic
     _______________________________________________________
     */
    require('./storage/state')(context)
        .then(function(store) {
            state_store = store;
            logState = logStateInit(state_store);
            // We're ready for execution
            startSlicer(job.jobConfig.slicer_port, slicerAnalytics);
        })
        .catch(function(err) {
            logger.error(`Slicer: failure during initialization for job ${process.env.ex_id}`);
            var errMsg = elasticError(err);
            logger.error(errMsg);
            ipc.send({message: 'slicer:terminal_error', error: errMsg, ex_id: process.env.ex_id})
        });


    network.register('worker:ready', function(msg) {
        workerFound = true;
        logger.info(`worker: ${msg.id} has joined slicer: ${job.jobConfig.ex_id}`);
        slicerAnalytics.workers_joined += 1;
        network.decorateConnection('teraslice_id', msg.id);
        network.joinRoom(msg.id);
        workerQueue.enqueue(msg);
    });

    network.register('worker:slice_complete', function(msg) {
        slicerAnalytics.processed += 1;
        //Need to join room if a restart happened
        if (msg.retry) {
            logger.warn(`worker: ${msg.id} has rejoined slicer: ${job.jobConfig.ex_id}`);
            slicerAnalytics.workers_reconnected += 1;
            network.decorateConnection('teraslice_id', msg.id);
            network.joinRoom(msg.id)
        }

        if (msg.error) {
            logger.error(`worker: ${msg.id} has error on slice: ${JSON.stringify(msg)} , slicer: ${job.jobConfig.ex_id}`);
            slicerAnalytics.failed += 1;
            event.emit('slicer:processing_error');
            //if an error occurred while in recovery, fail the job as a whole
            if (inRecoveryMode) {
                ipc.send({message: 'slicer:failed_recovery', ex_id: job.jobConfig.ex_id});
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
        network.send(msg.id, 'slicer:slice_recorded', null);
        if (!msg.isShuttingDown) {
            workerQueue.enqueue(msg);
        }
    });

    network.register('disconnect', function() {
        slicerAnalytics.workers_disconnected += 1;
        var id = network.getDecoration('teraslice_id');
        logger.warn(`Worker: ${id} has disconnected`);
        workerQueue.remove(id);
    });

    network.initialize();

    function startSlicer(port, slicerAnalytics) {
        network.listen(port);

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
            hasRecovered = true;
            inRecoveryMode = false;
        });

        event.once('slicer:processing_error', function() {
            logger.error(`slicer: ${job.jobConfig.ex_id} has encountered a processing_error`);
            ipc.send({message: 'slicer:processing_error', ex_id: job.jobConfig.ex_id});
        });

        //if no worker has attached in allotted time, shutdown job
        setTimeout(function() {
            if (!workerFound) {
                ipc.send({
                    message: 'job:terminal_error',
                    error: 'No workers have connected to slicer in allotted time',
                    ex_id: job.jobConfig.ex_id
                });
            }
        }, context.sysconfig.teraslice.slicer_timeout);

        Promise.all(recoveredSlices).then(function(retryData) {
            return slicer.newSlicer(context, job, retryData, slicerAnalytics, logger)
                .then(function(slicers) {
                    var totalSlicers = slicers.length;
                    slicerAnalytics.slicers = totalSlicers;
                    scheduler = getScheduler(job, slicers, slicerQueue);

                    engineFn = function engineFn() {

                        while (workerQueue.size() && slicerQueue.size()) {
                            var worker = workerQueue.dequeue();
                            var sliceData = slicerQueue.dequeue();
                            network.send(worker.id, 'slicer:new_slice', {message: 'data', data: sliceData});
                        }

                        var currentWorkers = workerQueue.size();
                        slicerAnalytics.workers_available = currentWorkers;
                        slicerAnalytics.queued = slicerQueue.size();
                        slicerAnalytics.workers_active = network.getClientCounts() - currentWorkers;


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
                    ipc.send({message: 'slicer:slicer_initialized', ex_id: job.jobConfig.ex_id});

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
                                if (workerQueue.size() >= network.getClientCounts() && slicerQueue.size() === 0) {
                                    logger.info(`all work for job: ${job.jobConfig.ex_id} has completed, starting cleanup`);

                                    clearInterval(isDone);
                                    if (job.jobConfig.analytics) {
                                        logFinishedJob(context, start, job, analyticsData);
                                    }
                                    checkJobState(job.jobConfig).then(function(errCount) {
                                        var msg = {
                                            message: 'slicer:job_finished',
                                            ex_id: job.jobConfig.ex_id,
                                            errorCount: errCount,
                                            slicer_stats: slicerAnalytics
                                        };

                                        if (errCount === 0 && hasRecovered) {
                                            msg.hasRecovered = true;
                                        }

                                        ipc.send(msg);
                                    });
                                }
                            }, 500)
                        }

                    });

                }).catch(function(err) {
                    var errMsg = elasticError(err);
                    return Promise.reject(`Error on slicer initialization: ${errMsg}`)
                });
        }).catch(function(err) {
            var errMsg = elasticError(err);
            logger.error(errMsg);
            //signal that creation of slicer failed in job allocation
            ipc.send({message: 'slicer:terminal_error', error: errMsg, ex_id: process.env.ex_id})
        });
    }

    ipc.register('message', function(msg) {

        if (msg.message === 'cluster_service:stop_job' || msg.message === 'shutdown') {
            logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a shutdown notice`);

            engineCanRun = false;
            clearInterval(engine);
            setInterval(function() {
                //this is to wait for other workers to complete and report back and shutdown before exiting
                if (network.getClientCounts() === 0) {
                    state_store.shutdown()
                        .then(function() {
                            ipc.send({
                                message: 'message_processed',
                                action: msg.message,
                                ex_id: job.jobConfig.ex_id,
                                _msgID: msg._msgID
                            });

                            return logger.flush();
                        })
                        .then(function() {
                            process.exit();
                        })
                        .catch(function(err) {
                            var errMsg = elasticError(err);
                            logger.error(errMsg);
                            process.exit();
                        });
                }
            }, 500);
        }

        if (msg.message === 'cluster_service:pause_slicer') {
            logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a pause notice`);
            engineCanRun = false;
            clearInterval(engine);
            ipc.send({
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
            ipc.send({
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
                if (network.getClientCounts() <= workerQueue.size()) {
                    ipc.send({
                        message: 'message_processed',
                        action: 'cluster_service:restart_slicer',
                        _msgID: msg._msgID
                    });
                    logger.flush()
                        .then(function() {
                            process.exit()
                        })
                        .catch(function(err) {
                            var errMsg = elasticError(err);
                            logger.error(errMsg);
                            process.exit();
                        });
                }
            }, 500)

        }

        if (msg.message === 'cluster_service:slicer_analytics') {
            ipc.send({
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

    ipc.register('SIGTERM', noOP);
    ipc.register('SIGINT', noOP);

    ipc.initialize();
    /*
     Supporting functions
     ________________________________________________________________
     */

    function terminalShutdown(errEV) {
        logger.error(`Terminal error: shutting down job ${process.env.ex_id}`);
        ipc.send({message: 'job:terminal_error', error: errEV.err, ex_id: process.env.ex_id})
    }

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
                ipc.send({message: 'slicer:failed_recovery', ex_id: job.jobConfig.ex_id});
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

        if (job.jobConfig.analytics) {
            analyzeStats(logger, job.jobConfig.operations, analyticsData);
        }

        logger.info(`job ${job.jobConfig.name} has finished in ${time} seconds`);
    }

    function getScheduler(job, slicers, slicerQueue) {
        var fnArray = [];
        slicers.forEach(function(slicer, index) {
            fnArray.push(lifecycle(job.jobConfig)(slicer, slicerQueue, job, index));
        });

        return fnArray;
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
