'use strict';

var moment = require('moment');
var logFinishedJob = require('../utils/config').logFinishedJob;
var Queue = require('../utils/queue');
var workerQueue = new Queue;
var statContainer = require('../utils/analytics').statContainer;
var addStats = require('../utils/analytics').addStats;
var event = require('../utils/events');

module.exports = function(context) {

    var start = moment();
    var initializeJob = require('../utils/config').initializeJob;
    var job = initializeJob(context);

    var reader = job.reader;
    var slicer = reader.newSlicer(context, job.readerConfig, job.jobConfig);
    var analyticsData = statContainer(job.jobs);

    var workerConnections = {};
    var io = require('socket.io')();
    //TODO decide what to do with slice complete event that has error // msg.error as well as logging/analytics
    //TODO deal with workers that join after slicer finishes

    function sendMessage(id, msg) {
        io.sockets.in(id).emit('slice', msg)
    }

    var scheduler = job.scheduler(slicer, workerQueue, job, sendMessage, workerConnections, event);

    io.on('connection', function(socket) {

        socket.on('ready', function(msg) {
            workerConnections[msg.id] = socket.id;
            socket.join(msg.id);
            workerQueue.enqueue(msg);
        });

        socket.on('slice complete', function(msg) {
            if (msg.analytics) {
                addStats(analyticsData, msg.analytics);
            }

            workerQueue.enqueue(msg);
        });

        socket.on('disconnect', function(msg) {
            //TODO remove id from workConnections obj
        });

    });

    event.once('job finished', function() {
        logFinishedJob(start, job, analyticsData)
    });

    setInterval(function() {
        if (workerQueue.size()) {
            scheduler()
        }
    }, 1);

    io.listen(context.sysconfig.teraslice.port)

    process.on('message', function(msg) {
        if (msg.message === 'shutdown') {
            process.exit();
        }
    })

};
