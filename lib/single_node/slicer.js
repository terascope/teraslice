'use strict';

var moment = require('moment');
var Promise = require('bluebird');
var logFinishedJob = require('../utils/config').logFinishedJob;
var writeToStateFile = require('../utils/config').writeToStateFile;
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
    var analyticsData = statContainer(job.jobs);
    var engine;

    var io = require('socket.io')();
    var slicerFn = reader.newSlicer(context, job.readerConfig, job.jobConfig)

    Promise.resolve(slicerFn)
        .then(function(slicer){

            //TODO decide what to do with slice complete event that has error // msg.error as well as logging/analytics
            //TODO deal with workers that join after slicer finishes

            function sendMessage(id, msg) {
                io.sockets.in(id).emit('slice', msg)
            }

            var scheduler = job.scheduler(slicer, workerQueue, job, sendMessage, io, event);

            io.on('connection', function(socket) {

                socket.on('ready', function(msg) {
                    socket.join(msg.id);
                    workerQueue.enqueue(msg);
                });

                socket.on('slice complete', function(msg) {
                    writeToStateFile(job.stateName, msg.slice, 'completed');
                    if (msg.analytics) {
                        addStats(analyticsData, msg.analytics);
                    }

                    workerQueue.enqueue(msg);
                });

                socket.on('disconnect', function(msg) {

                });

            });

            event.once('job finished', function() {
                logFinishedJob(start, job, analyticsData)
            });

            engine = setInterval(function() {
                if (workerQueue.size()) {
                    scheduler()
                }
            }, 1);

            io.listen(context.sysconfig.teraslice.port);

        });

    process.on('message', function(msg) {

        if (msg.message === 'shutdown') {
            //TODO Check clearance of engine in async enviroment
            clearInterval(engine);
            setInterval(function() {
                if (Object.keys(io.sockets.sockets).length === 0) {
                    process.exit()
                }
            }, 500);
        }

    });

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    process.on('SIGTERM', noOP);
    process.on('SIGINT', noOP);

};
