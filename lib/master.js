'use strict';

var processConfig = require('./utils/config').processConfig;
var getClient = require('./utils/config').getClient;
var Promise = require('bluebird');
var moment = require('moment');

module.exports = function (context) {
    var cluster = context.cluster;
    var logger = context.logger;
    var configuration = processConfig(context.sysconfig);
    var sourceCode = require(configuration.sourceCode);

    var workerCount = require('os').cpus().length;
    var processDone = 0;

    var queue = [];
    var sliceData = [];
    var start = moment();

    var addListener = function (cb) {
        for (var id in cluster.workers) {
            cluster.workers[id].on('message', cb);
        }
    };

    function sendMessage(id, message) {
        cluster.workers[id].send(message);
    }

    function sendAllMessage(message) {
        for (var id in cluster.workers) {
            cluster.workers[id].send(message)
        }
    }

    var sourceClient = getClient(configuration.source.system, context);
    var next = sourceCode.nextChunk(configuration.source, sourceClient);

    addListener(function (msg) {
        if (msg.msg === 'finished') {
            if (queue.length) {
                sendMessage(msg.id, queue.pop())
            }
            else {
                processDone++;

                if (processDone === workerCount) {
                    var end = moment();
                    var time = (end - start ) / 1000;
                    logger.info('processing has finished in ' + time + ' seconds, will now exit');
                    process.exit()
                }
            }
        }
    });

    var logMessage = setInterval(function(){
        logger.info(sliceData.length + ' : are in the queue')
    }, 3000);

    function setQueue() {
        while (sliceData.length) {
            queue.push(sliceData.pop())
        }
        clearInterval(logMessage);
        logger.info('queue is ready to be processed, the total enqueued is '+ queue.length);
        sendAllMessage('ready');
    }

    function makeQueue() {
        Promise.resolve(next())
            .then(function (data) {
                if (data === null) {
                    setQueue();
                    return;
                }
                else {
                    sliceData.push(data);
                    return makeQueue();
                }
            })
    }

    makeQueue();
};
