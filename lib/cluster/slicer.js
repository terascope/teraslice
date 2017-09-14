'use strict';

var moment = require('moment');
var Promise = require('bluebird');
var uuid = require('uuid');
var _ = require('lodash');

var Queue = require('queue');
var workerQueue = new Queue;
var slicerQueue = new Queue;

var statContainer = require('../utils/analytics').statContainer;
var addStats = require('../utils/analytics').addStats;
var analyzeStats = require('../utils/analytics').analyzeStats;
var dateFormat = require('../utils/date_utils').dateFormat;
var parseError = require('../utils/error_utils').parseError;
var messageModule = require('./services/messaging');


module.exports = function(context) {

    var ex_id = process.env.ex_id;
    var job_id = process.env.job_id;
    var events = context.foundation.getEventEmitter();
    var job_runner = require('./runners/job')(context);
    var logger = context.foundation.makeLogger({module: 'slicer', ex_id: ex_id});
    var messaging = messageModule(context, logger);

    //Stateful variables
    var start = moment();
    var engineCanRun = true;
    var slicerDone = 0;
    var totalSlicers = 0;
    var allSlicersDone = false;
    var inRecoveryMode = false;
    var hasRecovered = false;
    var workerFound = false;
    var isShuttingDown = false;
    var dynamicQueueLength = false;

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
        slice_range_expansion: 0,
        processed: 0,
        slicers: 0,
        subslice_by_key: 0,
        started: moment().format(dateFormat)
    };
    //a place for tracking differences so collector (cluster master) does not have to manage extra state
    var pushedAnalytics = {
        processed: 0,
        failed: 0,
        queued: 0,
        job_duration: 0,
        workers_joined: 0,
        workers_disconnected: 0,
        workers_reconnected: 0
    };

    var analyticsTimer;
    var queueLength;
    var engine;
    var scheduler;
    var job;
    var slicer;
    var analyticsData;
    var state_store;
    var ex_store;
    var engineFn;
    var retryData;

    //events can be fired from anything that instantiates a client, such as stores and slicers
    //needs to be setup before job_runner
    events.on('getClient:config_error', terminalShutdown);

    /*
     Main logic
     _______________________________________________________
     */

    messaging.register('worker:shutdown', slicerShutdown);

    messaging.register('assets:loaded', function(ipcMessage) {
        events.emit('slicer:assets_loaded', ipcMessage)
    });

    messaging.register('cluster:job:pause', function(msg) {
        logger.info(`slicer for job: ${ex_id} has received a pause notice`);
        engineCanRun = false;
        clearInterval(engine);
        events.emit("job:pause");
        messaging.respond(msg, {
            message: 'node:message:processed',
            action: 'cluster:job:pause'
        });
    });

    messaging.register('cluster:job:resume', function(msg) {
        logger.info(`slicer for job: ${ex_id} has received a resume notice`);
        engine = setInterval(engineFn, 1);
        engineCanRun = true;
        events.emit("job:resume");
        messaging.respond(msg, {
            message: 'node:message:processed',
            action: 'cluster:job:resume'
        });
    });

    messaging.register('cluster:job:restart', function(msg) {
        logger.info(`slicer for job: ${ex_id} has received a restart notice`);
        engineCanRun = false;
        clearInterval(engine);
        events.emit("job:stop");

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
                        var errMsg = parseError(err);
                        logger.error(errMsg);
                        process.exit();
                    });
            }
        }, 500)
    });

    messaging.register('cluster:slicer:analytics', function(msg) {
        logger.debug('api is requesting slicer analytics', slicerAnalytics);
        var name = job ? job.jobConfig.name : JSON.parse(process.env.job).name;
        messaging.respond(msg, {
            message: 'node:message:processed',
            action: 'cluster:slicer:analytics',
            data: {node_id: msg.node_id, name: name, job_id: job_id, ex_id: ex_id, stats: slicerAnalytics}
        });
    });

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);


    events.on('slicer:job:update', function(data) {
        logger.debug('slicer sending a job update', data.update);
        //this is updating the opConfig for elasticsearch start and/or end dates for ex, this assumes elasticsearch is first
        ex_store.update(ex_id, {operations: data.update})
    });

    messaging.register('worker:ready', 'worker_id', function(msg, worker_id) {
        workerFound = true;
        logger.info(`worker: ${worker_id} has joined slicer: ${ex_id}`);
        slicerAnalytics.workers_joined += 1;
        //if there are more clients than the length of the queue, increase the queue size
        if (dynamicQueueLength && messaging.getClientCounts() > queueLength) {
            queueLength = messaging.getClientCounts();
        }
        //messaging module will join connection
        workerQueue.enqueue(msg);
    });

    messaging.register('worker:slice:complete', 'worker_id', function(msg, worker_id) {
        slicerAnalytics.processed += 1;
        //Need to join room if a restart happened
        if (msg.retry) {
            logger.warn(`worker: ${worker_id} has rejoined slicer: ${ex_id}`);
            slicerAnalytics.workers_reconnected += 1;
            //messaging module will join connection
        }

        if (msg.error) {
            logger.error(`worker: ${worker_id} has error on slice: ${JSON.stringify(msg)} , slicer: ${ex_id}`);
            slicerAnalytics.failed += 1;
            events.emit('slice:failure', msg);
            //if an error occurred while in recovery, fail the job as a whole
            if (inRecoveryMode) {
                //sending to remove any pending worker allocations and to stop other workers
                messaging.send({message: 'slicer:recovery:failed', ex_id: ex_id});
                var errorMeta = ex_store.failureMeta('there were errors processing a slice in recovery mode', slicerAnalytics);
                ex_store.setStatus(ex_id, 'failed', errorMeta);
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
            events.emit('slice:success', msg);
        }

        logger.debug(`worker ${worker_id} has completed its slice,`, msg);

        //Report to worker that it has been reported, so it can remove reference to last slice
        messaging.send(worker_id, 'slicer:slice:recorded', null);
        if (!msg.isShuttingDown) {
            workerQueue.enqueue(msg);
        }
    });

    messaging.register('network:disconnect', 'worker_id', function(worker_id) {
        slicerAnalytics.workers_disconnected += 1;
        logger.warn(`Worker: ${worker_id} has disconnected`);
        events.emit('network:disconnect', worker_id);
        //if there are less clients than the length of the queue, decrease the queue size
        if (dynamicQueueLength && messaging.getClientCounts() < queueLength) {
            queueLength = messaging.getClientCounts();
        }
        workerQueue.remove(worker_id);
        //only call if workers have connected before, and there are none left
        if (!isShuttingDown && workerFound && messaging.getClientCounts() === 0) {
            //TODO this needs a refactor for when slicer controls ex state
            setTimeout(function() {
                //if after a a set time there are still no workers, it will shutdown
                if (messaging.getClientCounts() === 0) {
                    messaging.send({
                        message: 'slicer:error:terminal',
                        error: `all workers from slicer #${ex_id} have disconnected`,
                        ex_id: ex_id
                    })
                }
            }, context.sysconfig.teraslice.worker_disconnect_timeout);

        }
    });

    events.on('slicer:slice:recursion', function() {
        logger.trace(`id sublicing has occurred`);
        slicerAnalytics.subslices += 1;
    });

    events.on('slicer:slice:range_expansion', function() {
        logger.trace(`a slice range expansion has occurred`);
        slicerAnalytics.slice_range_expansion += 1;
    });

    events.on('slicer:recovery:enqueued', function() {
        logger.info(`The recovered data for job: ${ex_id} has successfully been enqueued`);
        hasRecovered = true;
        inRecoveryMode = false;
    });

    events.once('slice:failure', function() {
        logger.error(`slicer: ${ex_id} has encountered a processing_error`);
        var errorMeta = ex_store.failureMeta(null, slicerAnalytics);
        ex_store.setStatus(ex_id, 'failing', errorMeta);
    });

    events.on('slicer:job:finished', function() {
        slicerDone++;
        logger.info(`a slicer for job: ${ex_id} has completed its range`);
        events.emit('job:finished');

        if (slicerDone === totalSlicers) {
            logger.info(`all slicers for job: ${ex_id} have been completed, waiting for slices in slicerQueue to be processed`);
            //all workers have reported back completions
            allSlicersDone = true;
            slicerAnalytics.queuing_complete = moment().format(dateFormat);

            var isDone = setInterval(function() {
                //slicer is done when slice queue is empty and all workers have reported back from processing
                logger.trace(`worker queue: ${workerQueue.size()}, active clients ${messaging.getClientCounts()}, slicer queue: ${slicerQueue.size()}, in recovery mode: ${inRecoveryMode}`);
                if (workerQueue.size() >= messaging.getClientCounts() && slicerQueue.size() === 0 && !inRecoveryMode) {
                    logger.info(`all work for job: ${ex_id} has completed, starting cleanup`);

                    clearInterval(isDone);
                    if (job.jobConfig.analytics) {
                        logFinishedJob(context, start, job, analyticsData);
                    }
                    checkJobState(job.jobConfig)
                        .then(function(errCount) {
                            var msg = {
                                message: 'slicer:job:finished',
                                ex_id: job.jobConfig.ex_id
                            };

                            if (errCount > 0) {
                                var message = `job: ${ex_id} had ${data.errorCount} slice failures during processing`;
                                logger.error(message);
                                var errorMeta = ex_store.failureMeta(message, slicerAnalytics);
                                ex_store.setStatus(ex_id, 'failed', errorMeta);
                            }
                            else {
                                logger.info(`job ${ex_id} has completed`);
                                var metaData = {_slicer_stats: slicerAnalytics};
                                if (hasRecovered) {
                                    metaData._has_errors = 'recovered';
                                }
                                ex_store.setStatus(ex_id, 'completed', metaData)
                            }

                            messaging.send(msg);
                        });
                }
            }, 500)
        }

    });


    //if slicer has restart by itself, terminate job, need to wait for  registration of process message functions before we can send this message
    if (process.env.__process_restart) {
        //TODO need to restart slicer and make all recoverable
        var errMsg = `Slicer for ex_id: ${ex_id} runtime error led to a restart, terminating job with failed status, please use the recover api to return slicer to a consistent state`;
        logger.error(errMsg);
        //ex_store may not be instantiated, need to rely on CM to mark job as failed
        messaging.send({message: 'job:error:terminal', error: errMsg, ex_id: ex_id})
    }
    else {
        Promise.resolve(require('./storage/assets')(context))
            .then(function(assets_store) {
                context.assets = {};
                context.assets.getPath = assets_store.getPath;
                return job_runner.initialize(events, logger)
            })
            .then(function(_job) {
                job = _job;
                slicer = _job.slicer;
                queueLength = parseQueueLength(job.slicer, job.jobConfig);
                analyticsData = statContainer(_job.jobs);
                return Promise.all([require('./storage/state')(context), require('./storage/jobs')(context, 'ex')])
            })
            .spread(function(stateStore, exStore) {
                state_store = stateStore;
                ex_store = exStore;
                logger.trace(`state_store and job_store for slicer has been initialized`);
                messaging.initialize({port: job.jobConfig.slicer_port});

                // We're ready for execution
                startSlicer();
            })
            .catch(function(err) {
                logger.error(`Slicer: failure during initialization for job ${ex_id}`);
                var errMsg = parseError(err);
                logger.error(errMsg);
                //ex_store may not be instantiated, need to rely on CM to mark job as failed
                messaging.send({message: 'job:error:terminal', error: errMsg, ex_id: ex_id})
            });
    }

    function slicerRecovery() {
        var recoveredSlices = [];
        if (process.env.recover_execution && job.jobConfig.lifecycle === 'once') {
            logger.info(`slicer: ${ex_id} is starting in recovery mode`);

            inRecoveryMode = true;

            var numOfSlicersToRecover = job.jobConfig.slicers;
            for (var i = 0; i < numOfSlicersToRecover; i++) {
                recoveredSlices.push(state_store.recoveryContext(ex_id, i))
            }
        }

        //if no worker has attached in allotted time, shutdown job
        setTimeout(function() {
            if (!workerFound) {
                logger.error(`A worker has not connected to a slicer for ex: ${ex_id}, shutting down job`);
                var errorMeta = ex_store.failureMeta('No workers have connected to slicer in allotted time', slicerAnalytics);
                ex_store.setStatus(ex_id, 'failed', errorMeta)
                    .then(function() {
                        messaging.send({
                            message: 'job:error:terminal',
                            ex_id: ex_id,
                            markedJob: true
                        });
                    });
            }
        }, context.sysconfig.teraslice.slicer_timeout);

        return Promise.all(recoveredSlices)
    }

    function terminalError(err) {
        var errMsg = parseError(err);
        logger.error(errMsg);
        var errorMeta = ex_store.failureMeta(errMsg, slicerAnalytics);

        ex_store.setStatus(ex_id, 'failed', errorMeta)
            .then(function() {
                messaging.send({
                    message: 'job:error:terminal',
                    ex_id: ex_id,
                    markedJob: true
                });
            });
    }


    function slicerInit(retry_Data) {
        if (retry_Data) {
            retryData = retry_Data;
        }

        if (retryData.length > 0) {
            logger.debug(`There are ${retryData.length} segments that are being recovered,`);
            logger.trace(`retry data,`, JSON.stringify(retryData));
        }

        return slicer.newSlicer(context, job, retryData, slicerAnalytics, logger)
    }

    function slicerInitRetry(err) {
        var errMsg = parseError(err);
        var times = 1;
        var max_retries = job.max_retries;
        logger.error(`Error on slicer initialization, will attempt to retry ${max_retries} times: ${errMsg}`);
        return new Promise(function(resolve, reject) {

            function retry() {
                slicerInit()
                    .then(function(slicers) {
                        logger.info('slicer initialization was successful');
                        resolve(slicers)
                    })
                    .catch(function(err) {
                        times += 1;
                        if (times < max_retries) {
                            retry()
                        }
                        else {
                            var retryErrMsg = parseError(err);
                            reject(`Could not initialize slicers, error: ${retryErrMsg}`)
                        }
                    });
            }

            retry();
        });
    }

    function slicerEngine(slicers) {
        if (!Array.isArray(slicers)) {
            throw new Error(`newSlicer from module ${job.jobConfig.operations[0]._op} needs to return an array of slicers`)
        }
        totalSlicers = slicers.length;
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
            if (!inRecoveryMode && !allSlicersDone && slicerQueue.size() < queueLength) {
                //call slicers to enqueue into slicerQueue
                logger.trace('slicers are being called');

                scheduler.forEach(function(slicer) {
                    slicer();
                });
            }
        };

        //send message that job is in running state
        logger.info(`slicer: ${job.jobConfig.ex_id} has initialized and is running`);
        ex_store.setStatus(ex_id, 'running');

        //provision the retry data to the slicerQueue if they exist
        if (retryData.length > 0) {
            getRetryData(retryData)
        }

        //start the engine
        if (engineCanRun) {
            logger.debug('starting the slicer engine');
            engine = setInterval(engineFn, 1);
        }

        //push analytics to cluster master to support cluster level analytics
        analyticsTimer = setInterval(pushAnalytics, context.sysconfig.analytics_rate || 60000)
    }

    function pushAnalytics() {
        //save a copy of what we push so we can emit diffs
        var diffs = {};
        var copy = {};
        _.forOwn(pushedAnalytics, function(value, field) {
            diffs[field] = slicerAnalytics[field] - value;
            copy[field] = slicerAnalytics[field];
        });
        messaging.send({message: 'cluster:analytics', stats: diffs, kind: 'slicer'});
        pushedAnalytics = copy;
    }

    function startSlicer() {
        Promise.resolve(slicerRecovery())
            .catch(terminalError)
            .then(slicerInit)
            .catch(slicerInitRetry)
            .then(slicerEngine)
            .catch(terminalError);
    }

    function slicerShutdown(msg) {
        logger.info(`slicer for job: ${ex_id} has received a shutdown notice`);
        isShuttingDown = true;
        engineCanRun = false;
        clearInterval(engine);
        clearInterval(analyticsTimer);
        pushAnalytics();
        //functionally job:stop acts like a regular shutdown
        events.emit('job:stop');
        var shutdownInterval = setInterval(function() {
            //this is to wait for other workers to complete and report back and shutdown before exiting
            logger.trace(`waiting for any connected clients to exit`);
            if (messaging.getClientCounts() === 0) {
                logger.info('slicer is now shutting down stores and exiting');
                clearInterval(shutdownInterval);
                Promise.resolve()
                    .then(function() {
                        if (state_store) {
                            return state_store.shutdown()
                        }
                        return true
                    })
                    .then(function() {
                        messaging.respond(msg, {
                            message: 'node:message:processed',
                            action: msg.message,
                            ex_id: ex_id
                        });
                        return logger.flush();
                    })
                    .then(function() {
                        process.exit();
                    })
                    .catch(function(err) {
                        var errMsg = parseError(err);
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
        logger.error(`Terminal error: shutting down job ${ex_id}`);
        // ex_store may not be initialized, must rely on CM
        messaging.send({message: 'job:error:terminal', error: errEV.err, ex_id: ex_id})
    }

    function getRetryData(retryArray, retryObj) {
        var isGettingData = false;
        var retryData = retryObj ? retryObj : retryArray.shift();
        logger.debug(`adding ${retryData.retryList.length} to the slicer queue`);
        if (retryData.retryList && retryData.retryList.length > 0) {
            retryData.retryList.forEach(function(doc) {
                //keep state of slices doled out, removed at slice complete events

                retryState[doc.slice_id] = true;
                slicerQueue.enqueue(doc);
            });
        }

        var retrySlicer = setInterval(function() {
            //only get more data if slicerQueue is empty and all work has been reported
            if (slicerQueue.size() === 0 && Object.keys(retryState).length === 0 && !isGettingData) {
                isGettingData = true;

                //remove all intervals/timeouts
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
                                events.emit('slicer:recovery:enqueued')
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
        var query = `ex_id:${jobConfig.ex_id} AND (state:error OR state:start)`;
        return state_store.count(query, 0);
    }

    function allocateSlice(slice_request, slicer_id, slicer_order) {
        var slice = {
            slice_id: uuid.v4(),
            request: slice_request,
            slicer_id: slicer_id,
            slicer_order: slicer_order
        };

        state_store.log(ex_id, slice, 'start');
        logger.trace('enqueuing slice', slice);
        slicerQueue.enqueue(slice);
    }

    function createSlices(slicer, slicerQueue, slicer_id, lifecycle) {
        var hasCompleted = false;
        var isProcessing = false;
        var slicer_order = 0;
        var isOnce = lifecycle === 'once';

        return function() {
            if (!isProcessing) {
                isProcessing = true;
                Promise.resolve(slicer())
                    .then(function(slice_request) {
                        //not null or undefined
                        if (slice_request != null) {
                            if (_.isArray(slice_request)) {
                                logger.warn(`slicer for job: ${ex_id} is subslicing by key`);
                                slicerAnalytics.subslice_by_key += 1;
                                _.forEach(slice_request, function(request) {
                                    allocateSlice(request, slicer_id, slicer_order += 1);
                                });
                            }
                            else {
                                allocateSlice(slice_request, slicer_id, slicer_order += 1);
                            }

                            isProcessing = false;
                        }
                        else {
                            if (isOnce && !hasCompleted) {
                                events.emit('slicer:job:finished');
                                hasCompleted = true;
                            }
                        }
                    })
                    .catch(function(err) {
                        //retries are handled internally by slicer
                        isProcessing = false;
                        var errMsg = `slicer for ex ${ex_id} had an error, shutting down job ${parseError(err)}`;
                        logger.error(errMsg);
                        var errorMeta = ex_store.failureMeta(errMsg, slicerAnalytics);
                        ex_store.setStatus(ex_id, 'failed', errorMeta)
                            .then(function() {
                                messaging.send({
                                    message: 'job:error:terminal',
                                    ex_id: ex_id,
                                    markedJob: true
                                });
                            });
                    })
            }
        }
    }

    function parseQueueLength(reader, jobConfig) {
        var length = 10000;
        if (reader.slicerQueueLength) {
            if (typeof reader.slicerQueueLength !== 'function') {
                logger.error('slicerQueueLength on the reader must be a function, defaulting to 10000');
            }
            else {
                var results = reader.slicerQueueLength(jobConfig);
                if (results === 'QUEUE_MINIMUM_SIZE') {
                    dynamicQueueLength = true;
                    length = jobConfig.workers;
                }
                else {
                    if (_.isNumber(results) && results >= 1) {
                        length = results;
                    }
                }
            }
        }

        return length;
    }

    function logFinishedJob(context, start, job, analyticsData) {
        var end = moment();
        var time = (end - start ) / 1000;

        slicerAnalytics.job_duration = time;

        if (job.jobConfig.analytics) {
            analyzeStats(logger, job.jobConfig.operations, analyticsData);
        }

        logger.info(`job ${job.jobConfig.name} has finished in ${time} seconds`);
    }

    function getScheduler(job, slicers, slicerQueue) {
        var fnArray = [];
        slicers.forEach(function(slicer, index) {
            fnArray.push(createSlices(slicer, slicerQueue, index, job.jobConfig.lifecycle));
        });

        return fnArray;
    }


    function __test_context(temp_context) {
        if (temp_context) context = temp_context;

        return {
            createSlices: createSlices
        }
    }

    return {
        __test_context: __test_context
    }

};
