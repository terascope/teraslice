'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var event = require('./utils/events');

module.exports = function(context) {
    var cluster = context.cluster;
    var config = context.sysconfig;
    var initializeJob = require('./utils/config').initializeJob;
    var writeToStateFile = require('./utils/config').writeToStateFile;
    var code = initializeJob(context);
    var queue = code.queue;
    var max_retries = code.max_retries;
    var logger = code.jobConfig.logger;
    var isDone = false;
    var isShuttingDown = false;

    //this will store errors and the number of retries
    var errorLog = {};

    function isReady(res, msg, specData) {
        //res may return null if no data was received
        if (res && res.errors) {
            throw new Error('errors in elastic_bulk_insert')
        }
        else {
            if (specData) {
                if (code.reporter) {
                    code.reporter(context, code.jobConfig, specData);
                    logMessage(msg);
                }
                else {
                    logAnalytics(msg, specData)
                }
            }
            else {
                logMessage(msg)
            }

            writeToStateFile(code.stateName, msg);

            isDone = true;
            if (!isShuttingDown) {
                event.emit('slice_complete', {id: cluster.worker.id, slice: msg});
                process.send({message: 'ready', id: cluster.worker.id, slice: msg, analytics: specData});
            }
        }
    }

    function runSlice(msg) {
        var msg = msg;
        var finalQueue = queue;
        var specData;

        if (code.analytics) {
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
                isDone = true;

                logger.error('An error has occured: ' + err.stack + ' \n on message: ', msg);
                if (max_retries) {
                    //checking if error has occurred before
                    if (errorLog[msg]) {
                        errorLog[msg]++;

                        if (errorLog[msg] >= max_retries) {
                            logger.error('Max retires has been reached for: ', msg);
                            writeToStateFile(code.stateName, msg);
                            process.send({message: 'ready', id: cluster.worker.id, slice: msg, error: true});
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
                    writeToStateFile(code.stateName, msg);
                    process.send({message: 'ready', id: cluster.worker.id, slice: msg, error: true});
                }

            });
    }

    //set up listener
    process.on('message', function(msg) {

        if (msg.message === 'data') {
            runSlice(msg.data);
        }
        else {
            process.send({message: 'ready', id: cluster.worker.id});
        }
    });

    function shutdown() {
        var counter;
        isShuttingDown = true;

        if (config.teraslice && config.teraslice.shutdown_timeout) {
            counter = config.teraslice.shutdown_timeout;
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

    process.on('SIGINT', finalShutdown);
    process.on('SIGTERM', finalShutdown)
};