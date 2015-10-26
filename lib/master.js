'use strict';

var moment = require('moment');
var sendMessage = require('./utils/config').sendMessage;
var Queue = require('./utils/queue');
var workerQueue = new Queue;
var statContainer = require('./utils/analytics').statContainer;
var addStats = require('./utils/analytics').addStats;


module.exports = function(context) {
    var cluster = context.cluster;
    var start = moment();

    var initializeJob = require('./utils/config').initializeJob;
    var code = initializeJob(context);

    var reader = code.reader;
    var nextSlice = reader.newSlicer(context, code.readerConfig, code.jobConfig);
    var analyticsData = statContainer(code.jobs);

    var scheduler = code.scheduler(nextSlice, start, workerQueue, code.jobConfig, analyticsData);

    function enqueue(msg) {
        if (msg.message === 'ready') {
            if(msg.analytics){
                addStats(analyticsData, msg.analytics);
            }
            workerQueue.enqueue(msg);
        }
    }

    //dynamically add listeners to any worker that spawns
    cluster.on('online', function(worker) {
        cluster.workers[worker.id].on('message', enqueue);
        sendMessage(cluster, worker.id, {message: 'ready', data: null})
    });

    setInterval(function(){
        if (workerQueue.size()) {
            scheduler()
        }
    },1)

};
