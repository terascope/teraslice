'use strict';

var Promise = require('bluebird');
var moment = require('moment');

module.exports = function(context) {
    var cluster = context.cluster;
    var logger = context.logger;
    var workerCount = require('os').cpus().length;
    var processDone = 0;

    var queue = [];
    var sliceData = [];
    var start = moment();

    var addListener = function(cb) {
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

    var logMessage = setInterval(function() {
        logger.info(sliceData.length + ' : are in the queue')
    }, 3000);

    function setQueue() {
        while (sliceData.length) {
            queue.push(sliceData.pop())
        }
        clearInterval(logMessage);
        logger.info('queue is ready to be processed, the total enqueued is ' + queue.length);
        sendAllMessage({message: 'ready', data: null});
    }


    var initializeJob = require('./utils/config').initializeJob;
    var code = initializeJob(context);

    var reader = code.reader;

    var nextSlice = reader.newSlicer(context, code.readerConfig);

    function makeQueue() {
        Promise.resolve(nextSlice())
            .then(function(data) {
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

    addListener(function(msg) {
        if (msg.msg === 'finished') {
            if (queue.length) {
                sendMessage(msg.id, {message: 'data', data: queue.pop()})
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

    makeQueue();

};
