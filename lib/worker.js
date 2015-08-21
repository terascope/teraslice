'use strict';

var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function(context) {
    var cluster = context.cluster;
    var logger = context.logger;

    var initializeJob = require('./utils/config').initializeJob;
    var code = initializeJob(context);
    var queue = code.queue;
    var max_retries = code.max_retries;

    //this will store errors and the number of retries
    var errorLog = {};

    function isReady(res, msg, specData) {
        //res may return null if no data was received
        if (res && res.errors) {
           // logger.error('errors in elastic_bulk_insert');
            throw new Error('errors in elastic_bulk_insert')
        }
        else {
            if (specData) {
                logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg.start +
                    ' : ' + msg.end + ' time completion ' + specData.time + ' size: ' + specData.size)
            }
            else if (msg.start && msg.end) {
                logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg.start +
                    ' : ' + msg.end);
            }
            else {
                logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg)
            }
            process.send({message: 'ready', id: cluster.worker.id, slice: msg});
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

        Promise.resolve(work).then(function(res) {
            isReady(res, msg, specData)
        })
            .catch(function(err) {
                logger.error('An error has occured: ' + err.stack + ' \n on message: ', msg);
                if (max_retries) {
                    //checking if error has occurred before
                    if (errorLog[msg]) {
                        errorLog[msg]++;
                        if (errorLog[msg] === max_retries) {
                            logger.error('Max retires has been reached for: ', msg);
                            process.send({message: 'ready', id: cluster.worker.id, slice: msg});
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
                    process.send({message: 'ready', id: cluster.worker.id, slice: msg});
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
};