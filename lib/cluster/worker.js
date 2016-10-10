'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var event = require('../utils/events');
var logStateInit = require('../utils/elastic_utils').logState;
var elasticError = require('../utils/error_utils').elasticError;
var messagingFn = require('./services/messaging');


module.exports = function(context) {
    var cluster = context.cluster;
    var config = context.sysconfig.teraslice;

    var isDone = true;
    var isShuttingDown = false;

    var ID = context.sysconfig.teraslice.hostname + "__" + cluster.worker.id;
    var analytics_store;

    //this will be used to keep track of the previously sent message just in case of a disconnect
    var sentMessage = false;

    var state_store;
    var logState;

    //this will store errors and the number of retries
    var errorLog = {};

    var logger = context.foundation.makeLogger('worker', ID, {
        ex_id: process.env.ex_id,
        module: 'worker',
        worker_id: ID
    });

    logger.info(`worker ${ID} is online`);
    //if worker cannot make client, job needs to shutdown, needs to be setup before job_runner
    event.on('client config error', terminalShutdown);

    var job_runner = require('./runners/job')(context);
    var job = job_runner.initialize();

    var queue = job.queue;
    var max_retries = job.max_retries;

    var messaging = messagingFn(context);

    var host = messaging.getHostUrl();


    //set up listener
    messaging.register('slicer:slice:new', function(msg) {
        isDone = false;
        //getting a slice means the previous message was handled
        sentMessage = false;
        logger.info(`received slice: ${msg.data.slice_id}`);
        var sliceLogger = context.foundation.makeLogger('worker_slice', ID, {
            ex_id: process.env.ex_id,
            module: 'worker',
            worker_id: ID,
            slice_id: msg.data.slice_id
        });

        runSlice(msg.data, sliceLogger);
    });

    messaging.register('slicer:slice:recorded', function() {
        //the sent message has been processed, so set it to false;
        sentMessage = false;
    });

    messaging.register('worker:connection:error', function(err) {
        logger.error('Error in worker socket: ', err)
    });

    messaging.register('worker:disconnect', function(e) {
        logger.error(`worker ${ID} had disconnected from slicer ex_id ${process.env.ex_id}`, e);
    });

    messaging.register('worker:slicer:connect', function() {
        if (sentMessage) {
            logger.warn('reconnecting to slicer, previous slice: ', sentMessage);
            sentMessage.retry = true;
            messaging.send('worker:slice:complete', sentMessage);
        }
        else {
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


    logger.info(`connecting to host: ${host}`);
    messaging.initialize();

    require('./storage/state')(context)
        .then(function(store) {
            state_store = store;
            logState = logStateInit(state_store);
            return require('./storage/analytics')(context)
        })
        .then(function(store) {
            analytics_store = store;
        })
        .catch(function(err) {
            var errMsg = elasticError(err);
            logger.error(`could not instantiate for job execution: ${job.jobConfig.ex_id}, error: ${errMsg}`);
            logger.flush()
                .then(function() {
                    process.exit()
                })
                .catch(function(err) {
                    var errMsg = elasticError(err);
                    logger.error(errMsg);
                    process.exit();
                });
        });

    function isReady(res, slice, msg, specData, sliceLogger) {
        //res may return null if no data was received
        if (res && res.errors) {
            return Promise.reject('errors in elasticsearch_bulk', res.toJSON())
        }
        else {
            return logState(job.jobConfig, slice, 'completed')
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
                .then(function() {
                    isDone = true;
                });
        }
    }

    function runSlice(slice, sliceLogger) {

        function sliceFailed(err) {
            var errMsg = elasticError(err);
            sentMessage = {worker_id: ID, slice: slice, error: errMsg};
            logState(job.jobConfig, slice, 'error', errMsg)
                .then(function() {
                    sliceLogger.error(`failed to process`, sentMessage, `and has slice state is marked as error`);
                    messaging.send('worker:slice:complete', sentMessage);
                })
                .catch(function(err) {
                    var errMsg = elasticError(err);
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
                var errMsg = elasticError(err);
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
        var counter;
        isShuttingDown = true;

        if (config && config.shutdown_timeout) {
            counter = config.shutdown_timeout;
        }
        else {
            counter = 60;
        }

        setInterval(function() {
            if (isDone || counter <= 0) {
                logger.info(`shutting down`);

                if (analytics_store !== undefined) {
                    analytics_store.shutdown()
                        .then(function() {
                            return logger.flush()
                        })
                        .then(function() {
                            process.exit()
                        })
                        .catch(function(err) {
                            var errMsg = elasticError(err);
                            logger.error(errMsg);
                            process.exit();
                        });

                }
                else {
                    // Might get shutdown notice before fully instantiating
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
            }
            else {
                if (counter % 10 === 0) {
                    logger.info(`shutdown sequence initiated, but is still processing. Will force shutdown in ${counter}  seconds`);
                }

                counter--;
            }
        }, 1000);

    }

    function terminalShutdown(errEV) {
        logger.error(`Terminal error, shutting down job ${process.env.ex_id}`);
        messaging.respond({message: 'job:error:terminal', error: errEV.err, ex_id: process.env.ex_id})
    }

    function logMessage(sliceLogger, msg, specData) {
        var str = `analytics for slice `;
        var dataStr = '';
        _.forOwn(msg, function(value, key) {
            dataStr += `${key} : ${value} `;
        });

        _.forOwn(specData, function(value, key) {
            dataStr += `${key} : ${value} `;
        });

        sliceLogger.info(str + dataStr);

    }


};
