'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var event = require('../utils/events');

module.exports = function(context) {
    var cluster = context.cluster;
    var config = context.sysconfig.teraslice;
    //var initializeJob = require('../utils/config').initializeJob;
    //var getClient = require('../utils/config').getClient;
    //var sendElasticAnalytics = require('../utils/analytics').sendElasticAnalytics;
    var makeHostName = require('../utils/cluster').makeHostName;

    var analytics_store = require('./storage/analytics')(context);

    var isDone = true;
    var isShuttingDown = false;

    var logger = context.logger;
    var ID = context.sysconfig.teraslice.hostname + "__" + context.cluster.worker.id;

    var job_runner = require('./runners/job')(context);

    Promise.resolve(job_runner.initialize()).then(function(job) {

        var queue = job.queue;
        var max_retries = job.max_retries;

        //TODO this is not ideal, look over how config work in single mode vs cluster
        var configHost = job.jobConfig.slicer_hostname ? job.jobConfig.slicer_hostname : config.hostname;
        var configPort = job.jobConfig.slicer_port ? job.jobConfig.slicer_port : config.port;
        var host = makeHostName(configHost, configPort);

        var socket = require('socket.io-client')(host, {reconnect: true});

        //this will be used to keep track of the previously sent message just in case of a disconnect
        var sentMessage = false;

        //set up listener
        socket.on('slice', function(msg) {
            isDone = false;
            //getting a slice means the previous message was handled
            sentMessage = false;
            runSlice(msg.data);
        });

        socket.on('slice has been reported', function() {
            //the sent message has been processed, so set it to false;
            sentMessage = false;
        });

        socket.on('error', function(err) {
            logger.error('Error in worker socket: ', err)
        });

        socket.on('disconnect', function(e) {
            //console.log('worker getting a disconnect', e);
        });

        socket.on('connect', function() {
            if (sentMessage) {
                sentMessage.retry = true;
                socket.emit('slice complete', sentMessage);
            }
            else {
                socket.emit('ready', {id: ID});
            }
        });

//TODO catch needs to be changed to correct sender

        //this will store errors and the number of retries
        var errorLog = {};

        function isReady(res, slice, msg, specData) {
            //res may return null if no data was received
            if (res && res.errors) {
                //TODO get better error logging
                console.log(res.items[0]);
                throw new Error('errors in elastic_bulk_insert')
            }
            else {
                if (specData) {
                    if (job.reporter) {
                        job.reporter(context, job.jobConfig, specData);
                        logMessage(msg);
                    }
                    else {
                        //TODO review logging requirements
                        if (context.sysconfig.teraslice.cluster) {
                            analytics_store.log(job, msg, specData);
                        }
                        logAnalytics(msg, specData)
                    }
                }
                else {
                    logMessage(msg)
                }

                event.emit('slice complete', {id: ID, slice: msg});
                sentMessage = {id: ID, slice: slice, analytics: specData};
                socket.emit('slice complete', sentMessage);
                isDone = true;
            }
        }

        function runSlice(slice) {
            function sliceFailed(err) {
                sentMessage = { id: ID, slice: slice, error: err.message };
                socket.emit('slice complete', sentMessage);
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
                    return fn(data, msg)
                });
            }, msg);

            work.then(function(res) {
                isReady(res, slice, msg, specData)
            })
                .catch(function(err) {
                    logger.error('An error has occured: ' + err.stack + ' \n on message: ', slice);
                    if (max_retries) {
                        //checking if error has occurred before
                        if (errorLog[msg]) {
                            errorLog[msg]++;

                            if (errorLog[msg] >= max_retries) {
                                logger.error('Max retires has been reached for: ', slice);

                                sliceFailed(err)
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

    });

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
                logger.info('Worker: ' + ID + ' , pid: ' + process.pid + ' has finished.');
                process.exit();
            }
            else {
                if (counter % 10 === 0) {
                    logger.info('Worker: ' + ID + ' , pid: ' + process.pid + ' is still processing. ' +
                        'Will force shutdown in ' + counter + ' seconds');
                }

                counter--;
            }
        }, 1000);

    }

    function logMessage(msg) {
        if (msg.start && msg.end) {
            logger.info('Worker: ' + ID + ' , pid: ' + process.pid + ' has processed: ' + msg.start +
                ' : ' + msg.end);
        }
        else {
            logger.info('Worker: ' + ID + ' , pid: ' + process.pid + ' has processed: ' + msg)
        }
    }

    function logAnalytics(msg, specData) {
        if (msg.start && msg.end) {
            logger.info('Worker: ' + ID + ' , pid: ' + process.pid + ' has processed: ' + msg.start +
                ' : ' + msg.end + ' time completion ' + specData.time + ' size: ' + specData.size)
        }
        else {
            logger.info('Worker: ' + ID + ' , pid: ' + process.pid + ' has processed: ' + msg +
                ' time completion ' + specData.time + ' size: ' + specData.size)
        }
    }

    var finalShutdown = _.once(shutdown);

    //set up listener
    process.on('message', function(msg) {
        if (msg.message === 'shutdown') {
            finalShutdown();
        }
    });


    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    process.on('SIGTERM', noOP);
    process.on('SIGINT', noOP);

};
