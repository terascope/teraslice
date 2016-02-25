'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var event = require('../utils/events');

module.exports = function(context) {
    var cluster = context.cluster;
    var config = context.sysconfig.teraslice;
    var initializeJob = require('../utils/config').initializeJob;
    var getClient = require('../utils/config').getClient;
    var sendElasticAnalytics = require('../utils/analytics').sendElasticAnalytics;
    var makeHostName = require('../utils/cluster').makeHostName;
    var job = initializeJob(context);
    var queue = job.queue;
    var max_retries = job.max_retries;
    var logger = job.jobConfig.logger;
    var isDone = true;
    var isShuttingDown = false;

    var ID = context.cluster.worker.id;

    var host = makeHostName(config.host, config.port);
    var client;
    var opConfig;

    if (context.sysconfig.teraslice.cluster) {
        opConfig = context.sysconfig.teraslice.cluster.logs;
        client = getClient(context, opConfig, 'elasticsearch');
    }

    var socket = require('socket.io-client')(host, {reconnect: true});

    //set up listener
    socket.on('slice', function(msg) {
        isDone = false;
        runSlice(msg.data);
    });


    socket.emit('ready', {id: ID});

//TODO catch needs to be changed to correct sender

    //this will store errors and the number of retries
    var errorLog = {};

    function isReady(res, msg, specData) {
        //res may return null if no data was received
        if (res && res.errors) {
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
                        sendElasticAnalytics(client, logger, job.analyticsName, msg, specData)
                    }
                    logAnalytics(msg, specData)
                }
            }
            else {
                logMessage(msg)
            }

            event.emit('slice complete', {id: cluster.worker.id, slice: msg});
            socket.emit('slice complete', {id: cluster.worker.id, slice: msg, analytics: specData});
            isDone = true;
        }
    }

    function runSlice(msg) {

        var msg = msg;
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

            isReady(res, msg, specData)
        })
            .catch(function(err) {

                logger.error('An error has occured: ' + err.stack + ' \n on message: ', msg);
                if (max_retries) {
                    //checking if error has occurred before
                    if (errorLog[msg]) {
                        errorLog[msg]++;

                        if (errorLog[msg] >= max_retries) {
                            logger.error('Max retires has been reached for: ', msg);
                            socket.emit('slice complete', {id: cluster.worker.id, slice: msg, error: true});
                            isDone = true;
                        }
                        else {
                            runSlice(msg);
                        }
                    }
                    else {
                        errorLog[msg] = 1;
                        runSlice(msg);
                    }
                }
                //no retries, proceed to next slice
                else {
                    socket.emit('slice complete', {id: cluster.worker.id, slice: msg, error: true});
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
                logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has finished.');
                process.exit();
            }
            else {
                if (counter % 10 === 0) {
                    logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' is still processing. ' +
                        'Will force shutdown in ' + counter + ' seconds');
                }

                counter--;
            }
        }, 1000);

    }


    function logMessage(msg) {
        if (msg.start && msg.end) {
            logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg.start +
                ' : ' + msg.end);
        }
        else {
            logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg)
        }
    }

    function logAnalytics(msg, specData) {
        if (msg.start && msg.end) {
            logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg.start +
                ' : ' + msg.end + ' time completion ' + specData.time + ' size: ' + specData.size)
        }
        else {
            logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg +
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
