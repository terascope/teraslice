'use strict';

var processConfig = require('./utils/config').processConfig;
var getClient = require('./utils/config').getClient;
var Promise = require('bluebird');

module.exports = function (context) {
    var cluster = context.cluster;
    var logger = context.logger;
    var configuration = processConfig(context.sysconfig);
    var sourceCode = require(configuration.sourceCode);

    var workerCount = require('os').cpus().length;
    var processDone = 0;

    var addListener = function (cb) {
        for (var id in cluster.workers) {
            cluster.workers[id].on('message', cb);
        }
    };

    function sendMessage(id, message) {
        cluster.workers[id].send(message);
    }

    //need to set from config
    var next = sourceCode.nextChunk(configuration.source);

//TODO msg needs index and size from config
    addListener(function (msg) {
        if (msg.msg === 'finished') {
            var data = next();
            if (data === null) {
                processDone++;
                if (processDone === workerCount) {
                    logger.info('the job has completed, now exiting');
                    process.exit()
                }
            }
            else {
                var message = {start: data.start, end: data.end};
                sendMessage(msg.id, message)
            }
        }
    });

};