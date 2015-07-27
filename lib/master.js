'use strict';
var processConfig = require('./utils/config').processConfig;
var getClient = require('./utils/config').getClient;
var Promise = require('bluebird');
var moment = require('moment');

module.exports = function (context) {
    var cluster = context.cluster;
    var logger = context.logger;
    var configuration = processConfig(context.sysconfig);



    var workerCount = require('os').cpus().length;
    var processDone = 0;

    var addListner = function (cb) {
        for (var id in cluster.workers) {
            cluster.workers[id].on('message', cb);
        }
    };

    function sendMessage(id, message) {
        cluster.workers[id].send(message);
    }
    var sourceClient = getClient(configuration.source.system, context);

   /* sourceClient.search({index: 'events-*'}).then(function(data){
        console.log(data.hits.hits[0]);})*/

//TODO this need to be in utils
    function nextChunk(config) {
        var start = moment(config.start);
        var interval = config.interval.split('_');
        var end = moment(config.start).add(interval[0], interval[1]);
        var limit = moment(config.end);
        var wasCalled = false;

        return function () {
            if (wasCalled) {
                start = start.add(interval[0], interval[1]);
                end = end.add(interval[0], interval[1]);
                if (start > limit) {
                    return null;
                }
                return {start: start.format(), end: end.format()};
            }
            else {
                wasCalled = true;
                return {start: start.startOf(interval[1]).format(), end: end.startOf(interval[1]).format()};
            }
        }
    }

    //need to set from config
    var next = nextChunk(configuration.source);

//TODO msg needs index and size from config
    addListner(function (msg) {
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
                var message = {start: data.start, end: data.end, isDone: false};
                sendMessage(msg.id, message)
            }
        }
    });


};