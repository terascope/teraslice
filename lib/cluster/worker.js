'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var event = require('../utils/events');
var parseError = require('../utils/error_utils').parseError;
var messagingFn = require('./services/messaging');


module.exports = function(context) {
    var cluster = context.cluster;
    var config = context.sysconfig.teraslice;
    var ex_id = process.env.ex_id;
    var isDone = true;
    var isShuttingDown = false;
    var ID = context.sysconfig.teraslice.hostname + "__" + cluster.worker.id;
    var analytics_store;
    var queue;
    var max_retries;
    var job;

    //this will be used to keep track of the previously sent message just in case of a disconnect
    var sentMessage = false;

    var state_store;

    //this will store errors and the number of retries
    var errorLog = {};

    var logger = context.foundation.makeLogger('worker', ID, {
        ex_id: ex_id,
        module: 'worker',
        worker_id: ID
    });

    var job_runner = require('./runners/job')(context);
    var job = job_runner.initialize();

    var queue = job.queue;
    var max_retries = job.max_retries;

    var messaging = messagingFn(context, logger);
    
    //if worker cannot make client, job needs to shutdown, needs to be setup before job_runner
    event.on('getClient:config_error', terminalShutdown);
    
    var host = messaging.getHostUrl();

    logger.info(`worker ${ID} is online, communicating with host: ${host}`);


    //set up listener
    messaging.register('slicer:slice:new', function(msg) {
        isDone = false;
        //getting a slice means the previous message was handled
        sentMessage = false;
        logger.info(`received slice: ${msg.data.slice_id}`);
        var sliceLogger = context.foundation.makeLogger('worker_slice', ID, {
            ex_id: ex_id,
            module: 'worker',
            worker_id: ID,
            slice_id: msg.data.slice_id
        });

        runSlice(msg.data, sliceLogger);
    });

    messaging.register('slicer:slice:recorded', function() {
        //the sent message has been processed, so set it to false;
        logger.debug('slice has been marked as completed by slicer');
        sentMessage = false;
    });

    messaging.register('network:error', function(err) {
        logger.error('Error in worker socket: ', err)
    });

    messaging.register('network:disconnect', function(e) {
        logger.error(`worker ${ID} has disconnected from slicer ex_id ${ex_id}`, e);
    });

    messaging.register('network:connect', function() {
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

    Promise.resolve()
        .then(instantiateJob)
        .then(function(_job) {
            job = _job;
            queue = _job.queue;
            max_retries = _job.max_retries;
            return require('./storage/state')(context)
        })
        .then(function(store) {
            state_store = store;
            return require('./storage/analytics')(context)
        })
        .then(function(store) {
            analytics_store = store;
            logger.info(`connecting to host: ${host}`);
            messaging.initialize();
        })
        .catch(function(err) {
            var errMsg = parseError(err);
            logger.error(`could not instantiate for job execution: ${ex_id}, error: ${errMsg}`);
            logger.flush()
                .then(function() {
                    process.exit()
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    logger.error(errMsg);
                    process.exit();
                });
        });

    function isReady(res, slice, msg, specData, sliceLogger) {
        //res may return null if no data was received
        //TODO this needs to be addressed
        if (res && res.errors) {
            return Promise.reject('errors in elasticsearch_bulk', res.toJSON())
        }
        else {
            return state_store.log(ex_id, slice, 'completed')
                .then(function(results) {
                    sentMessage = {worker_id: ID, slice: slice, analytics: specData};
                    sliceLogger.info(`completed slice: `, slice);
                    if (isShuttingDown) {
                        sentMessage.isShuttingDown = true;
                    }
                    messaging.send('worker:slice:complete', sentMessage);

                    if (specData) {
                        if (job.reporter) {
                            job.reporter(context, job.jobConfig, specData);
                            logMessage(sliceLogger, msg);
                        }
                        else {
                            logMessage(sliceLogger, msg, specData);
                            return analytics_store.log(job, slice, specData)
                                .catch(function(err) {
                                    logger.error("Failure when storing analytics: ", err)
                                });
                        }
                    }
                    else {
                        return logMessage(sliceLogger, msg)
                    }
                })
                .finally(function() {
                    isDone = true;
                });
        }
    }

    function runSlice(slice, sliceLogger) {

        function sliceFailed(err) {
            var errMsg = parseError(err);
            sentMessage = {worker_id: ID, slice: slice, error: errMsg};
            state_store.log(ex_id, slice, 'error', errMsg)
                .then(function() {
                    sliceLogger.error(`failed to process`, sentMessage, `and has slice state is marked as error`);
                    messaging.send('worker:slice:complete', sentMessage);
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    sliceLogger.error(`An error has occurred: ${errMsg} on marking slice as failed, message: `, slice);
                });
        }

        var msg = slice.request;

        var finalQueue = queue;
        var specData;

        if (job.analytics) {
            specData = {time: [], size: []};

            finalQueue = queue.map(function(fn) {
                return fn.bind(null, specData);
            });
        }

        var work = Promise.reduce(finalQueue, function(prev, fn) {
            return Promise.resolve(prev).then(function(data) {
                return fn(data, sliceLogger, msg);
            });
        }, msg);

        work.then(function(res) {
            return isReady(res, slice, msg, specData, sliceLogger)
        })
            .catch(function(err) {
                var errMsg = parseError(err);
                sliceLogger.error(`An error has occurred: ${errMsg}, message: `, slice);
                if (max_retries) {
                    //checking if error has occurred before
                    if (errorLog[msg]) {
                        errorLog[msg]++;

                        if (errorLog[msg] >= max_retries) {
                            sliceLogger.error('Max retires has been reached for: ', slice);

                            sliceFailed(err);
                            isDone = true;
                        }
                        else {
                            runSlice(slice, sliceLogger);
                        }
                    }
                    else {
                        errorLog[msg] = 1;
                        runSlice(slice, sliceLogger);
                    }
                }
                //no retries, proceed to next slice
                else {
                    sliceFailed(err);
                    isDone = true;
                }
            });
    }


    function shutdown() {
        var counter = config.shutdown_timeout;
        isShuttingDown = true;

        setInterval(function() {
            logger.trace(`is done with current slice: ${isDone}, shutdown counter: ${counter}`);
            if (isDone || counter <= 0) {
                logger.info(`shutting down`);
                //just in case analytic or state store are not initialized before it shuts down, could happen if slicer immediately fails
                if (analytics_store === undefined) {
                    analytics_store = {
                        shutdown: function() {
                            return Promise.resolve(true)
                        }
                    }
                }
                if (state_store === undefined) {
                    state_store = {
                        shutdown: function() {
                            return Promise.resolve(true)
                        }
                    }
                }

                let stores = [state_store.shutdown, analytics_store.shutdown, logger.flush];

                var shutdownStores = Promise.reduce(stores, function(prev, curr) {
                    return Promise.resolve(prev)
                        .then(function() {
                            return curr()
                        })
                        .catch(function(err) {
                            var errMsg = parseError(err);
                            logger.error(`Error shutting down store ${prev.name}`, errMsg);
                            return Promise.resolve(curr)
                        });
                });

                shutdownStores
                    .then(function() {
                        process.exit()
                    })
                    .catch(function(err) {
                        var errMsg = parseError(err);
                        logger.error(errMsg);
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

    function instantiateJob() {
        var job_runner = require('./runners/job')(context);
        return job_runner.initialize();
    }

    function terminalShutdown(errEV) {
        logger.error(`Terminal error, shutting down job ${ex_id}`);
        messaging.respond({message: 'job:error:terminal', error: errEV.err, ex_id: ex_id})
    }

    function logMessage(sliceLogger, msg, specData) {
        var str = `analytics for slice `;
        var dataStr = '';

        if (typeof msg === 'string') {
            dataStr = msg + ', '
        }
        else {
            _.forOwn(msg, function(value, key) {
                dataStr += `${key} : ${value} `;
            });
        }
        _.forOwn(specData, function(value, key) {
            dataStr += `${key} : ${value} `;
        });

        sliceLogger.info(str + dataStr);

    }


};
