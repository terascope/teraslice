'use strict';

var moment = require('moment');

module.exports = function(context) {
    var cluster = context.cluster;
    var start = moment();

    var initializeJob = require('./utils/config').initializeJob;
    var code = initializeJob(context);

    var reader = code.reader;

    var nextSlice = reader.newSlicer(context, code.readerConfig);

    var addListener = function(cb) {
        for (var id in cluster.workers) {
            cluster.workers[id].on('message', cb);
        }
    };

    function sendAllMessage(message) {
        for (var id in cluster.workers) {
            context.cluster.workers[id].send(message)
        }
    }

    var scheduler = code.scheduler(nextSlice, start);

    addListener(scheduler);

    //this begins the cycle
    sendAllMessage({message: 'ready', data: null});

};
