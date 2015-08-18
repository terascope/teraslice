'use strict';

var moment = require('moment');
var sendMessage = require('./utils/config').sendMessage;

module.exports = function(context) {
    var cluster = context.cluster;
    var start = moment();

    var initializeJob = require('./utils/config').initializeJob;
    var code = initializeJob(context);

    var reader = code.reader;

    var nextSlice = reader.newSlicer(context, code.readerConfig, code.jobConfig);

    var scheduler = code.scheduler(nextSlice, start);

    //dynamically add listeners to any worker that spawns
    cluster.on('online', function(worker) {
        cluster.workers[worker.id].on('message', scheduler);
        sendMessage(cluster, worker.id, {message: 'ready', data: null} )
    });

};
