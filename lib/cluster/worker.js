'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var parseError = require('../utils/error_utils').parseError;
var messagingFn = require('./services/messaging');


module.exports = function module(context) {
    const events = context.apis.foundation.getSystemEvents();
    var cluster = context.cluster;
    var config = context.sysconfig.teraslice;
    var ex_id = process.env.ex_id;
    var job_id = process.env.job_id;
    var isDone = true;
    var isShuttingDown = false;
    var ID = context.sysconfig.teraslice.hostname + "__" + cluster.worker.id;
    var job_runner = require('./runners/job')(context);
    var analytics_store;
    var queue;
    var max_retries;
    var job;
    var recycle;
    var recycleWorkerRandomFactor = _.random(75, 100)

    //this will be used to keep track of the previously sent message just in case of a disconnect
    var sentMessage = false;

    var state_store;

    //this will store errors and the number of retries
    var errorLog = {};

    var logger = context.apis.foundation.makeLogger({
        ex_id: ex_id,
        job_id: job_id,
        module: 'worker',
        worker_id: ID
    });
    //need ipc channels open before job construction
    var messaging = messagingFn(context, logger);

    //if worker cannot make client, job needs to shutdown, needs to be setup before job_runner
    events.on('getClient:config_error', terminalShutdown);

    var host = messaging.getHostUrl();

    logger.info(`worker ${ID} is online, communicating with host: ${host}`);

    messaging.register('assets:loaded', function (ipcMessage) {
        events.emit('worker:assets_loaded', ipcMessage)
    });

    //set up listener
    messaging.register('slicer:slice:new', function (msg) {
        isDone = false;
        //getting a slice means the previous message was handled
        sentMessage = false;
        logger.info(`received slice: ${msg.data.slice_id}`);
        var sliceLogger = context.apis.foundation.makeLogger({
            ex_id: ex_id,
            job_id: job_id,
            module: 'slice',
            worker_id: ID,
            slice_id: msg.data.slice_id
        });

        runSlice(msg.data, sliceLogger);
    });

    messaging.register('slicer:slice:recorded', function () {
        //the sent message has been processed, so set it to false;
        logger.debug('slice has been marked as completed by slicer');
        sentMessage = false;
    });

    messaging.register('network:error', function (err) {
        events.emit('network:error');
        logger.error('Error in worker socket: ', err);
    });

    messaging.register('network:disconnect', function (e) {
        events.emit('network:disconnect');
        if (!isShuttingDown) {
            logger.error(`worker ${ID} has disconnected from slicer ex_id ${ex_id}`, e);
        }
    });

    messaging.register('network:connect', function () {
        if (sentMessage) {
            logger.warn('reconnecting to slicer, previous slice: ', sentMessage);
            sentMessage.retry = true;
            messaging.send('worker:slice:complete', sentMessage);
        }
        else {
            logger.debug(`a worker has made the initial connection to slicer ex_id: ${ex_id}`);
            messaging.send('worker:ready', {worker_id: ID});
        }
    });

    var finalShutdown = _.once(shutdown);

    messaging.register('worker:shutdown', finalShutdown);

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);

    Promise.resolve(require('./storage/assets')(context))
        .then(function(assets_store) {
            // assets store is loaded so it can register under context.apis
            return job_runner.initialize(events, logger);
        })
        .then(function(_job) {
            job = _job;
            queue = _job.queue;
            max_retries = _job.max_retries;
            recycle = recycleFn(job);
            return require('./storage/state')(context)
        })
        .then(function (store) {
            state_store = store;
            return require('./storage/analytics')(context)
        })
        .then(function (store) {
            analytics_store = store;
            logger.info(`connecting to host: ${host}`);
            messaging.initialize();
        })
        .catch(function (err) {
            var errMsg = parseError(err);
            logger.error(`could not instantiate for job execution: ${ex_id}, error: ${errMsg}`);
            logger.flush()
                .then(function () {
                    process.exit()
                })
                .catch(function (err) {
                    var errMsg = parseError(err);
                    logger.error(errMsg);
                    process.exit();
                });
        });

    function isReady(res, slice, msg, specData, sliceLogger) {
        //res may return null if no data was received
        return state_store.updateState(slice, 'completed', slice.index)
            .then(function (results) {
                events.emit('slice:success', slice);
                sentMessage = {worker_id: ID, slice: slice, analytics: specData};
                sliceLogger.info(`completed slice: `, slice);
                if (isShuttingDown) {
                    sentMessage.isShuttingDown = true;
                }

                if (specData) {
                    if (job.reporter) {
                        job.reporter(context, job.jobConfig, specData);
                        logMessage(sliceLogger, msg);
                    }
                    else {
                        logMessage(sliceLogger, msg, specData);
                        return analytics_store.log(job, slice, specData)
                            .catch(function (err) {
                                var errMsg = parseError(err);
                                logger.error(`Failure when storing analytics: ${errMsg}`)
                            });
                    }
                }
            })
            .finally(function () {
                events.emit('slice:finalize');
                isDone = true;
                recycle();
            });

    }

    function runSlice(slice, sliceLogger) {

        function sliceFailed(err) {
            var errMsg = parseError(err);
            sentMessage = {worker_id: ID, slice: slice, error: errMsg};
            events.emit('slice:failure', sentMessage);
            return state_store.updateState(slice, 'error', errMsg)
                .then(function () {
                    sliceLogger.error(`failed to process`, sentMessage, `and has slice state is marked as error`);
                })
                .catch(function (err) {
                    var errMsg = parseError(err);
                    sliceLogger.error(`An error has occurred: ${errMsg} on marking slice as failed, message: `, slice);
                });
        }

        var msg = slice.request;
        var slice_id = slice.slice_id;

        var finalQueue = queue;
        var specData;

        if (job.analytics) {
            specData = {time: [], size: [], memory: []};

            finalQueue = queue.map(function (fn) {
                return fn.bind(null, specData);
            });
        }

        var work = Promise.reduce(finalQueue, function (prev, fn) {
            return Promise.resolve(prev).then(function (data) {
                // return Promise.reject('an error')
                return fn(data, sliceLogger, msg);
            });
        }, msg);

        work.then(function (res) {
            return isReady(res, slice, msg, specData, sliceLogger)
        })
            .catch(function (err) {
                var errMsg = parseError(err);
                sliceLogger.error(`An error has occurred: ${errMsg}, message: `, slice);
                if (max_retries) {
                    //checking if error has occurred before
                    if (errorLog[slice_id]) {
                        errorLog[slice_id]++;

                        if (errorLog[slice_id] >= max_retries) {
                            sliceLogger.error('Max retires has been reached for: ', slice);

                            sliceFailed(err)
                                .finally(function () {
                                    events.emit('slice:finalize');
                                    isDone = true;
                                    recycle();
                                });
                        }
                        else {
                            runSlice(slice, sliceLogger);
                        }
                    }
                    else {
                        errorLog[slice_id] = 1;
                        runSlice(slice, sliceLogger);
                    }
                }
                //no retries, proceed to next slice
                else {
                    sliceFailed(err)
                        .finally(function () {
                            events.emit('slice:finalize');
                            isDone = true;
                            recycle();
                        });
                }
            });
    }


    function shutdown() {
        var counter = config.shutdown_timeout;
        isShuttingDown = true;
        events.emit('worker:shutdown');
        var shutDownInterval = setInterval(function () {
            logger.trace(`is done with current slice: ${isDone}, shutdown counter: ${counter}`);
            if (isDone || counter <= 0) {
                logger.info(`shutting down`);
                clearInterval(shutDownInterval);
                var shutdownSequence = [];
                if (analytics_store !== undefined) {
                    shutdownSequence.push(analytics_store.shutdown)
                }
                if (state_store !== undefined) {
                    shutdownSequence.push(state_store.shutdown)
                }

                shutdownSequence.push(logger.flush);

                Promise.reduce(shutdownSequence, function (prev, curr) {
                    return Promise.resolve(prev)
                        .then(function () {
                            return curr();
                        })
                        .catch(function (err) {
                            var errMsg = parseError(err);
                            logger.error(`Error shutting down store ${prev.name}`, errMsg);
                            return curr();
                        });
                })
                    .then(function () {
                        process.exit();
                    })
                    .catch(function (err) {
                        var errMsg = parseError(err);
                        logger.error(errMsg);
                        // TODO: the log might never be called to stdout with process.exit here
                        process.exit();
                    });
            }
            else {
                if (counter % 6000 === 0) {
                    logger.info(`shutdown sequence initiated, but is still processing. Will force shutdown in ${counter / 1000} seconds`);
                }

                counter -= 1000;
            }
        }, 1000);

    }

    function terminalShutdown(errEV) {
        logger.error(`Terminal error, shutting down job ${ex_id}`);
        events.emit('worker:shutdown');
        messaging.respond({message: 'job:error:terminal', error: errEV.err, ex_id: ex_id})
    }

    function recycleFn(job) {
        var sliceCount = 0;
        return function () {
            if (job.jobConfig.recycle_worker) {
                sliceCount += 1;
                // recycle worker between 75% and 100% of job.jobConfig.recycle_worker
                var recycleCount = Math.trunc(recycleWorkerRandomFactor / 100 * job.jobConfig.recycle_worker);
                if (sliceCount >= recycleCount && !isShuttingDown) {
                    logger.info(`worker: ${ID} recycled after processing ${sliceCount} slices`);
                    //still need to signal that slice completed and not be enqueued
                    sentMessage.isShuttingDown = true;
                    messaging.send('worker:slice:complete', sentMessage);
                    setTimeout(function () {
                        process.exit(42);
                    }, 100)
                }
                else {
                    messaging.send('worker:slice:complete', sentMessage);
                }
            }
            else {
                messaging.send('worker:slice:complete', sentMessage);
            }
        }
    }

    function logMessage(sliceLogger, msg, specData) {
        var str = `analytics for slice `;
        var dataStr = '';

        if (typeof msg === 'string') {
            dataStr = msg + ', '
        }
        else {
            _.forOwn(msg, function (value, key) {
                dataStr += `${key} : ${value} `;
            });
        }
        _.forOwn(specData, function (value, key) {
            dataStr += `${key} : ${value} `;
        });

        sliceLogger.info(str + dataStr);
    }

};
