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
var messageModule = require('./services/messaging');


module.exports = function(context) {
    var state_store;

    var logger = context.foundation.makeLogger('slicer', 'slicer', {ex_id: process.env.ex_id, module: 'slicer'});
    var messaging = messageModule(context, logger);

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

    messaging.register('worker:shutdown', slicerShutdown);

    messaging.register('cluster:job:pause', function(msg) {
        logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a pause notice`);
        engineCanRun = false;
        clearInterval(engine);
        messaging.respond(msg, {
            message: 'node:message:processed',
            action: 'cluster:job:pause'
        });
    });

    messaging.register('cluster:job:resume', function(msg) {
        logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a resume notice`);
        engine = setInterval(engineFn, 1);
        engineCanRun = true;
        messaging.respond(msg, {
            message: 'node:message:processed',
            action: 'cluster:job:resume'
        });
    });

    messaging.register('cluster:job:restart', function(msg) {
        logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a restart notice`);
        engineCanRun = false;
        clearInterval(engine);

        setInterval(function() {
            //every socket joins a room by it's unique io identifier by default besides the id room
            logger.trace(`action 'cluster:job:restart' is waiting for client count:${messaging.getClientCounts()} <= queue size:${workerQueue.size()} to exit`);
            if (messaging.getClientCounts() <= workerQueue.size()) {
                messaging.respond(msg, {
                    message: 'node:message:processed',
                    action: 'cluster:job:restart'
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
    });

    messaging.register('cluster:slicer:analytics', function(msg) {
        logger.debug('api is requesting slicer analytics', slicerAnalytics);
        messaging.respond(msg, {
            message: 'node:message:processed',
            action: 'cluster:slicer:analytics',
            data: {node_id: msg.node_id, ex_id: job.jobConfig.ex_id, stats: slicerAnalytics}
        });
    });

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);


    event.on('slicer:job:update', function(data) {
        logger.debug('slicer sending a job update', data.update);
        messaging.send({message: 'slicer:job:update', update: data.update, ex_id: process.env.ex_id})
    });

    messaging.register('worker:ready', 'worker_id', function(msg, worker_id) {
        workerFound = true;
        logger.info(`worker: ${worker_id} has joined slicer: ${job.jobConfig.ex_id}`);
        slicerAnalytics.workers_joined += 1;
        //messaging module will join connection
        workerQueue.enqueue(msg);
    });

    messaging.register('worker:slice:complete', 'worker_id', function(msg, worker_id) {
        slicerAnalytics.processed += 1;
        //Need to join room if a restart happened
        if (msg.retry) {
            logger.warn(`worker: ${worker_id} has rejoined slicer: ${job.jobConfig.ex_id}`);
            slicerAnalytics.workers_reconnected += 1;
            //messaging module will join connection
        }

        if (msg.error) {
            logger.error(`worker: ${worker_id} has error on slice: ${JSON.stringify(msg)} , slicer: ${job.jobConfig.ex_id}`);
            slicerAnalytics.failed += 1;
            event.emit('slicer:processing:error');
            //if an error occurred while in recovery, fail the job as a whole
            if (inRecoveryMode) {
                messaging.send({message: 'slicer:recovery:failed', ex_id: job.jobConfig.ex_id});
            }
        }
        else {
            if (msg.analytics) {
                addStats(analyticsData, msg.analytics);
            }

            //temporary for retry mode
            if (inRecoveryMode) {
                delete retryState[msg.slice.slice_id]
            }
        }

        logger.debug(`worker ${worker_id} has completed its slice,`, msg);

        //Report to worker that it has been reported, so it can remove reference to last slice
        messaging.send(worker_id, 'slicer:slice:recorded', null);
        if (!msg.isShuttingDown) {
            workerQueue.enqueue(msg);
        }
    });

    messaging.register('worker:disconnect', 'worker_id', function(worker_id) {
        slicerAnalytics.workers_disconnected += 1;
        logger.warn(`Worker: ${worker_id} has disconnected`);
        workerQueue.remove(worker_id);
    });

    messaging.initialize({port: job.jobConfig.slicer_port});


    require('./storage/state')(context)
        .then(function(store) {
            state_store = store;
            logger.trace(`state_store for slicer has been initialized`);
            logState = logStateInit(state_store);
            // We're ready for execution
            startSlicer(slicerAnalytics);
        })
        .catch(function(err) {
            logger.error(`Slicer: failure during initialization for job ${process.env.ex_id}`);
            var errMsg = elasticError(err);
            logger.error(errMsg);
            messaging.send({message: 'slicer:error:terminal', error: errMsg, ex_id: process.env.ex_id})
        });


    function startSlicer(slicerAnalytics) {

        if (process.env.recover_execution && job.jobConfig.lifecycle === 'once') {
            logger.info(`slicer: ${job.jobConfig.ex_id} is starting in recovery mode`);

            inRecoveryMode = true;

            var numOfSlicersToRecover = slicer.parallelSlicers ? job.jobConfig.slicers : 1;
            for (var i = 0; i < numOfSlicersToRecover; i++) {
                recoveredSlices.push(state_store.recoveryContext(job.jobConfig.ex_id, i))
            }
        }

        event.on('slicer recursion', function() {
            logger.trace(`id sublicing has occurred`);
            slicerAnalytics.subslices += 1;
        });

        event.on('zero slice reduction', function() {
            logger.trace(`zero slice reduction has occurred`);

            slicerAnalytics.zero_slice_reduction += 1;
        });

        event.on('getRetryData_completed', function() {
            logger.info(`The recovered data for job: ${job.jobConfig.ex_id} has successfully been enqueued`);
            hasRecovered = true;
            inRecoveryMode = false;
        });

        event.once('slicer:processing:error', function() {
            logger.error(`slicer: ${job.jobConfig.ex_id} has encountered a processing_error`);
            messaging.send({message: 'slicer:processing:error', ex_id: job.jobConfig.ex_id});
        });

        //if no worker has attached in allotted time, shutdown job
        setTimeout(function() {
            if (!workerFound) {
                logger.error(`A worker has not connected to a slicer for ex: ${job.jobConfig.ex_id}, shutting down job`);
                messaging.send({
                    message: 'job:error:terminal',
                    error: 'No workers have connected to slicer in allotted time',
                    ex_id: job.jobConfig.ex_id
                });
            }
        }, context.sysconfig.teraslice.slicer_timeout);

        Promise.all(recoveredSlices).then(function(retryData) {
            if (retryData.length > 0) {
                logger.debug(`There are ${retryData.length} segments that are being recovered,`);
                logger.trace(`retry data,`, JSON.stringify(retryData));
            }
            return slicer.newSlicer(context, job, retryData, slicerAnalytics, logger)
                .then(function(slicers) {
                    var totalSlicers = slicers.length;
                    slicerAnalytics.slicers = totalSlicers;
                    scheduler = getScheduler(job, slicers, slicerQueue);

                    engineFn = function engineFn() {
                        while (workerQueue.size() && slicerQueue.size()) {
                            var worker = workerQueue.dequeue();
                            var sliceData = slicerQueue.dequeue();
                            messaging.send(worker.worker_id, 'slicer:slice:new', {message: 'data', data: sliceData});
                        }

                        var currentWorkers = workerQueue.size();
                        slicerAnalytics.workers_available = currentWorkers;
                        slicerAnalytics.queued = slicerQueue.size();
                        slicerAnalytics.workers_active = messaging.getClientCounts() - currentWorkers;


                        //don't run slicers if recovering, all slices have been divided up or if the queue is too large
                        if (!inRecoveryMode && !allSlicersDone && slicerQueue.size() <= 10000) {
                            //call slicers to enqueue into slicerQueue
                            logger.trace('slicers are being called');
                            scheduler.forEach(function(slicer) {
                                slicer();
                            });
                        }
                    };

                    //send message that job is in running state
                    logger.info(`slicer: ${job.jobConfig.ex_id} has initialized`);
                    messaging.send({message: 'slicer:initialized', ex_id: job.jobConfig.ex_id});

                    //start the engine
                    if (engineCanRun) {
                        logger.debug('starting the slicer engine');
                        engine = setInterval(engineFn, 1);
                    }
                    //provision the retry data to the slicerQueue if they exist
                    if (retryData.length > 0) {
                        getRetryData(retryData)
                    }

                    event.on('slicer:job:finished', function() {
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
                                logger.trace(`worker queue: ${workerQueue.size()}, active clients ${messaging.getClientCounts()}, slicer queue: ${slicerQueue.size()}, in recovery mode: ${inRecoveryMode}`);
                                if (workerQueue.size() >= messaging.getClientCounts() && slicerQueue.size() === 0 && !inRecoveryMode) {
                                    logger.info(`all work for job: ${job.jobConfig.ex_id} has completed, starting cleanup`);

                                    clearInterval(isDone);
                                    if (job.jobConfig.analytics) {
                                        logFinishedJob(context, start, job, analyticsData);
                                    }
                                    checkJobState(job.jobConfig).then(function(errCount) {
                                        var msg = {
                                            message: 'slicer:job:finished',
                                            ex_id: job.jobConfig.ex_id,
                                            errorCount: errCount,
                                            slicer_stats: slicerAnalytics
                                        };

                                        if (errCount === 0 && hasRecovered) {
                                            msg.hasRecovered = true;
                                        }
                                        messaging.send(msg);
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
            messaging.send({message: 'slicer:error:terminal', error: errMsg, ex_id: process.env.ex_id})
        });
    }

    function slicerShutdown(msg) {
        logger.info(`slicer for job: ${job.jobConfig.ex_id} has received a shutdown notice`);

        engineCanRun = false;
        clearInterval(engine);
        setInterval(function() {
            //this is to wait for other workers to complete and report back and shutdown before exiting
            logger.trace(`waiting for connected clients: ${messaging.getClientCounts()} to equal zero`);
            if (messaging.getClientCounts() === 0) {
                state_store.shutdown()
                    .then(function() {
                        messaging.respond(msg, {
                            message: 'node:message:processed',
                            action: msg.message,
                            ex_id: job.jobConfig.ex_id
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

    /*
     Supporting functions
     ________________________________________________________________
     */

    function terminalShutdown(errEV) {
        logger.error(`Terminal error: shutting down job ${process.env.ex_id}`);
        messaging.send({message: 'job:error:terminal', error: errEV.err, ex_id: process.env.ex_id})
    }

    function getRetryData(retryArray, retryObj) {
        var isGettingData = false;
        var retryData = retryObj ? retryObj : retryArray.shift();
        logger.debug(`adding ${retryData.retryList.length} to the slicer queue`);
        if (retryData.retryList && retryData.retryList.length > 0) {
            retryData.retryList.forEach(function(doc) {
                //keep state of slices doled out, removed at slice complete event

                retryState[doc.slice_id] = true;
                slicerQueue.enqueue(doc);
            });
        }

        //set to error if the slice set of the recovering slicer cannot complete in 10 minutes
        var retryError = setTimeout(function() {
            if (Object.keys(retryState).length !== 0) {
                messaging.send({message: 'slicer:recovery:failed', ex_id: job.jobConfig.ex_id});
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
                            logger.debug(`slicer ${retryData.slicer_id} segment needs additional processing, ${resultObj.retryList.length}`);
                            getRetryData(retryArray, resultObj)
                        }
                        else {
                            //data set complete of this slicer, check if its the last, if so emit all done
                            if (retryArray.length === 0) {
                                event.emit('getRetryData_completed')
                            }
                            else {
                                //process the next in line
                                logger.debug('finished processing retry segment, continuing with the next');
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
        var tracker = 0;

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
                                        slicer_id: index,
                                        slicer_order: tracker += 1
                                    };

                                    logState(job.jobConfig, slice, 'start');
                                    slicerQueue.enqueue(slice);
                                });

                            }
                            else {
                                var slice = {
                                    slice_id: uuid.v4(),
                                    request: slice_request,
                                    slicer_id: index,
                                    slicer_order: tracker += 1
                                };

                                logState(job.jobConfig, slice, 'start');
                                logger.trace('enqueuing slice', slice);
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
        var tracker = 0;

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
                                        slicer_id: index,
                                        slicer_order: tracker += 1
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
                                    slicer_id: index,
                                    slicer_order: tracker += 1
                                };

                                logState(job.jobConfig, slice, 'start');
                                logger.trace('enqueuing slice', slice);
                                slicerQueue.enqueue(slice);
                                isProcessing = false;
                            }
                        }
                        else {
                            if (!hasCompleted) {
                                event.emit('slicer:job:finished');
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
