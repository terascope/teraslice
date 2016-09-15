'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var event = require('../utils/events');
var logStateInit = require('../utils/elastic_utils').logState;
var elasticError  = require('../utils/error_utils').elasticError;


module.exports = function(context) {
    var cluster = context.cluster;
    var config = context.sysconfig.teraslice;
    var logger = context.logger;

    var makeHostName = require('../utils/cluster').makeHostName;
    var logState;

    var isDone = true;
    var isShuttingDown = false;

    var ID = context.sysconfig.teraslice.hostname + "__" + context.cluster.worker.id;
    var logMessage = makeLog();
    var analytics_store;
    var job_runner, job;

    var queue, max_retries;

    var socket;
    var configHost, configPort, host;

    //this will be used to keep track of the previously sent message just in case of a disconnect
    var sentMessage = false;
    var state_store;
    //this will store errors and the number of retries
    var errorLog = {};

    require('./storage/state')(context)
        .then(function(store) {
            state_store = store;
            logState = logStateInit(state_store);
            return require('./storage/analytics')(context)
        })
        .then(function(store) {
            analytics_store = store;
            return require('./runners/job')(context);
        })
        .then(function(runner) {
            job_runner = runner;
            job = job_runner.initialize();

            queue = job.queue;
            max_retries = job.max_retries;

            configHost = job.jobConfig.slicer_hostname;
            configPort = job.jobConfig.slicer_port;
            host = makeHostName(configHost, configPort);

            initializeNetwork();
        });
    //TODO need catch here

    function initializeNetwork() {
        logger.info(`worker: ${ID} is connecting to host: ${host}`);
        socket = require('socket.io-client')(host, {reconnect: true});

        //set up listener
        socket.on('slicer:new_slice', function(msg) {
            isDone = false;
            //getting a slice means the previous message was handled
            sentMessage = false;
            logger.info(`Worker: ${ID} has received slice: ${msg.data.slice_id}`);
            runSlice(msg.data);
        });

        socket.on('slicer:slice_recorded', function() {
            //the sent message has been processed, so set it to false;
            sentMessage = false;
        });

        socket.on('error', function(err) {
            logger.error('Error in worker socket: ', err)
        });

        socket.on('disconnect', function(e) {
            logger.error(`worker ${ID} getting a disconnect`, e);
        });

        socket.on('connect', function() {
            if (sentMessage) {
                logger.warn('Worker is reconnecting to slicer, previous slice: ', sentMessage);
                sentMessage.retry = true;
                socket.emit('worker:slice_complete', sentMessage);
            }
            else {
                socket.emit('worker:ready', {id: ID});
            }
        });
    }

    function isReady(res, slice, msg, specData) {
        //res may return null if no data was received
        if (res && res.errors) {
            //TODO get better error logging
            return Promise.reject('errors in elasticsearch_bulk', JSON.stringify.res.errors)
        }
        else {
            return logState(job.jobConfig, slice, 'completed')
                .then(function(results) {
                    sentMessage = {id: ID, slice: slice, analytics: specData};
                    logger.info(`worker: ${ID} has completed: `, slice);
                    if (isShuttingDown) {
                        sentMessage.isShuttingDown = true;
                    }
                    socket.emit('worker:slice_complete', sentMessage);

                    if (specData) {
                        if (job.reporter) {
                            job.reporter(context, job.jobConfig, specData);
                            logMessage(msg);
                        }
                        else {
                            logMessage(msg, specData);
                            return analytics_store.log(job, slice, specData)
                                .catch(function(err) {
                                    logger.error("Failure when storing analytics: " + err)
                                });
                        }
                    }
                    else {
                        return logMessage(msg)
                    }
                })
                .then(function() {
                    isDone = true;
                });
        }
    }

    function runSlice(slice) {

        function sliceFailed(err) {
            var errMsg = elasticError(err);
            sentMessage = {id: ID, slice: slice, error: errMsg};
            logState(job.jobConfig, slice, 'error', errMsg)
                .then(function() {
                    logger.error(`worker: ${ID} has failed to process`, sentMessage, `and has slice state is marked as error`);
                    socket.emit('worker:slice_complete', sentMessage);
                })
                .catch(function(err) {
                    var errMsg = elasticError(err);
                    logger.error(`An error has occurred: ${errMsg} on marking slice as failed, message: `, slice);
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
                return fn(data, msg);
            });
        }, msg);

        work.then(function(res) {
            return isReady(res, slice, msg, specData)
        })
            .catch(function(err) {
                var errMsg = elasticError(err);
                logger.error(`An error has occurred: ${errMsg}, message: `, slice);
                if (max_retries) {
                    //checking if error has occurred before
                    if (errorLog[msg]) {
                        errorLog[msg]++;

                        if (errorLog[msg] >= max_retries) {
                            logger.error('Max retires has been reached for: ', slice);

                            sliceFailed(err);
                            isDone = true;
                        }
                        else {
                            runSlice(slice);
                        }
                    }
                    else {
                        errorLog[msg] = 1;
                        runSlice(slice);
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
                logger.info(`Worker: ${ID} , pid: ${process.pid} has finished`);

                if (analytics_store !== undefined) {
                    analytics_store.shutdown()
                        .then(function() {
                            process.exit();
                        });
                }
                else {
                    // Might get shutdown notice before fully instantiating
                    process.exit();
                }
            }
            else {
                if (counter % 10 === 0) {
                    logger.info(`Worker: ${ID} , pid: ${process.pid} is still processing. Will force shutdown in ${counter}  seconds`);
                }

                counter--;
            }
        }, 1000);

    }

    function makeLog() {
        var str = `Worker: ${ID} , pid: ${process.pid} has processed: `;
        return function(msg, specData) {
            var dataStr = '';
            _.forOwn(msg, function(value, key) {
                dataStr += `${key} : ${value} `;
            });

            _.forOwn(specData, function(value, key) {
                dataStr += `${key} : ${value} `;
            });

            logger.info(str + dataStr);
        }
    }

    var finalShutdown = _.once(shutdown);

    //set up listener
    process.on('message', function(msg) {
        if (msg.message === 'cluster_service:stop_job' || msg.message === 'shutdown') {
            finalShutdown();
        }
    });


    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    process.on('SIGTERM', noOP);
    process.on('SIGINT', noOP);

};
