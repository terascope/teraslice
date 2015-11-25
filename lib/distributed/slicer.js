'use strict';

var moment = require('moment');
var Queue = require('./../utils/queue');
var workerQueue = new Queue;
var statContainer = require('./../utils/analytics').statContainer;
var addStats = require('./../utils/analytics').addStats;
var event = require('./../utils/events');

module.exports = function(context) {
    var start = moment();
    var initializeJob = require('./../utils/config').initializeJob;
    var code = initializeJob(context);

    var reader = code.reader;
    var nextSlice = reader.newSlicer(context, code.readerConfig, code.jobConfig);
    var analyticsData = statContainer(code.jobs);

    var workerConnections = {};
    var io = require('socket.io')();
    var slicerConfig = context.sysconfig.teraslice.slicer;

    //temp
    var workerCount = 0;
    var processDone = 0;

    function sendMessage(_, id, msg) {
        io.sockets.in(id).emit('slice', msg)
    }

    function terminateWorker(_, id, msg) {
        io.sockets.in(id).emit('terminate_child_process', msg)
    }

    var scheduler = code.scheduler(nextSlice, start, workerQueue, code.jobConfig, sendMessage, analyticsData, slicerConfig, terminateWorker);

    io.on('connection', function(socket) {

        socket.on('ready', function(msg) {
            workerConnections[msg.id] = socket.id;
            socket.join(msg.id);
            workerQueue.enqueue(msg);
        });

        socket.on('slice_complete', function(msg) {
            if (msg.analytics) {
                addStats(analyticsData, msg.analytics);
            }

            workerQueue.enqueue(msg);
        });

        socket.on('worker is done', function(msg) {
            processDone++;

            if (Object.keys(workerConnections).length === processDone) {
                process.send({message: 'terminate_child_process', id: context.cluster.worker.id})
            }
        });

        socket.on('disconnect', function(msg) {

        })

    });

    setInterval(function() {
        if (workerQueue.size()) {
            scheduler()
        }
    }, 1);

    io.listen(slicerConfig.port)
};



