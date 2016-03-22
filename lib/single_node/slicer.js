'use strict';

var moment = require('moment');
var Promise = require('bluebird');
var logFinishedJob = require('../utils/config').logFinishedJob;
var initializeJob = require('../utils/config').initializeJob;
var Queue = require('../utils/queue');
var workerQueue = new Queue;
var statContainer = require('../utils/analytics').statContainer;
var addStats = require('../utils/analytics').addStats;
var event = require('../utils/events');

module.exports = function(context) {

    var writeToStateLog = require('../utils/config').writeToState(context);
    var io = require('socket.io')();
    var start = moment();
    var engineCanRun = true;
    var engine;
    var scheduler;

    Promise.resolve(initializeJob(context))
        .then(function(job) {

            var reader = job.reader;
            var analyticsData = statContainer(job.jobs);
            var port = job.jobConfig.slicer_port ? job.jobConfig.slicer_port : context.sysconfig.teraslice.port;

            var slicerFn = reader.newSlicer(context, job.readerConfig, job.jobConfig);

            function sendMessage(id, msg, data) {
                io.sockets.in(id).emit(msg, data)
            }

            io.on('connection', function(socket) {
                socket.on('ready', function(msg) {
                    socket.join(msg.id);
                    workerQueue.enqueue(msg);
                });

                socket.on('slice complete', function(msg) {
                    //Need to join room if a restart happened
                    if (msg.retry) {
                        socket.join(msg.id)
                    }

                    if (msg.error) {
                        writeToStateLog(job.stateName, msg.slice, 'error');
                    }
                    else {
                        writeToStateLog(job.stateName, msg.slice, 'completed');
                    }

                    if (msg.analytics) {
                        addStats(analyticsData, msg.analytics);
                    }
                    //Report to worker that it has been reported, so it can remove reference to last slice
                    sendMessage(msg.id, 'slice has been reported', null);

                    workerQueue.enqueue(msg);
                });

                socket.on('disconnect', function(msg) {

                });
            });

            io.listen(port);


            Promise.resolve(slicerFn)
                .then(function(slicer) {
                    scheduler = job.scheduler(context, slicer, workerQueue, job, sendMessage, writeToStateLog, io, event);

                    event.once('job finished', function() {
                        logFinishedJob(context, start, job, analyticsData);
                        process.send({message: 'job finished', jobID: job.jobConfig.__id});
                    });

                    if (engineCanRun) {
                        engine = setInterval(function() {
                            if (workerQueue.size()) {
                                scheduler()
                            }
                        }, 1);
                    }

                });
        });

    process.on('message', function(msg) {

        if (msg.message === 'shutdown') {
            engineCanRun = false;
            clearInterval(engine);
            setInterval(function() {
                //this is to wait for other workers to complete and report back and shutdown before exiting
                if (Object.keys(io.sockets.sockets).length === 0) {
                    process.exit()
                }
            }, 500);
        }

        if (msg.message === 'pause') {
            engineCanRun = false;
            clearInterval(engine);
        }

        if (msg.message === 'resume') {
            engineCanRun = true;
            engine = setInterval(function() {
                if (workerQueue.size()) {
                    scheduler()
                }
            }, 1);
        }

        if (msg.message === 'exit for retry') {
            engineCanRun = false;
            clearInterval(engine);

            setInterval(function() {
                //every socket joins a room by it's unique io identifier by default besides the id room
                var rooms = Object.keys(io.sockets.adapter.rooms).length / 2;
                if (rooms <= workerQueue.size()) {
                    process.exit()
                }
            }, 500)

        }
    });


    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    process.on('SIGTERM', noOP);
    process.on('SIGINT', noOP);

};
