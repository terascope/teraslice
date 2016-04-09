'use strict';

var moment = require('moment');
var Promise = require('bluebird');
var logFinishedJob = require('../utils/config').logFinishedJob;
var Queue = require('../utils/queue');
var workerQueue = new Queue;
var statContainer = require('../utils/analytics').statContainer;
var addStats = require('../utils/analytics').addStats;
var event = require('../utils/events');

module.exports = function(context) {

    var state_store = require('./storage/state')(context);
    var io = require('socket.io')();
    var start = moment();
    var engineCanRun = true;
    var engine;
    var scheduler;

    var job_runner = require('./runners/job')(context);

    function sendMessage(id, msg, data) {
        io.sockets.in(id).emit(msg, data)
    }

    function lifecycle(job) {
        if (job.lifecycle === 'once') {
            return once;
        }
        if (job.lifecycle === 'periodic') {
            return periodic;
        }
        if (job.lifecycle === 'persistent') {
            return persistent;
        }
    }

    function periodic(msg) {

    }

    function persistent(slicer, workerQueue, job) {
        var logger = job.jobConfig.logger;
        var isProcessing = false;

        return function() {

            if (!isProcessing) {
                isProcessing = true;

                Promise.resolve(slicer())
                    .then(function(data) {
                        //not null or undefined
                        if (data != null) {
                            var worker = workerQueue.dequeue();
                            //writeToStateFile(job.stateName, data, 'start');
                            state_store.log(job.jobConfig.job_id, data, 'start');
                            sendMessage(worker.id, 'slice', {message: 'data', data: data})
                        }
                        isProcessing = false;
                    })

            }
        }
    }

    function once(slicer, workerQueue, job) {
        var isProcessing = false;
        var retryQueue = false;
        var processDone = 0;
        var clusterShutdown = context.sysconfig.teraslice.cluster ? true : false;

        if (job.logData && job.logData.retryQueue) {
            retryQueue = job.logData.retryQueue;
        }

        return function() {
            if (!isProcessing) {
                isProcessing = true;
                var worker = workerQueue.dequeue();

                if (retryQueue && retryQueue.size()) {
                    var retryData = retryQueue.dequeue();
                    sendMessage(worker.id, 'slice', {message: 'data', data: retryData});
                    isProcessing = false;
                }
                else {
                    Promise.resolve(slicer(worker))
                        .then(function(data) {
                            //not null or undefined
                            if (data != null) {
                                //writeToStateFile(job.stateName, data, 'start');
                                state_store.log(job.jobConfig.job_id, data, 'start');
                                sendMessage(worker.id, 'slice', {message: 'data', data: data});
                            }
                            else {
                                if (clusterShutdown) {
                                    event.emit('job finished')
                                }
                                else {
                                    processDone++;

                                    if (processDone >= Object.keys(io.sockets.sockets).length) {
                                        event.emit('job finished')
                                    }
                                }
                            }
                            isProcessing = false;
                        })
                }
            }
        }
    }

    //Promise.resolve(initializeJob(context))
    Promise.resolve(job_runner.initialize())
        .then(function(job) {

            var reader = job.reader;
            var analyticsData = statContainer(job.jobs);
            var port = job.jobConfig.slicer_port ? job.jobConfig.slicer_port : context.sysconfig.teraslice.port;

            var slicerFn = reader.newSlicer(context, job.readerConfig, job.jobConfig);

            io.on('connection', function(socket) {

                socket.on('ready', function(msg) {
                    socket.teraslice_id = msg.id;
                    socket.join(msg.id);
                    workerQueue.enqueue(msg);
                });

                socket.on('slice complete', function(msg) {
                    //Need to join room if a restart happened
                    if (msg.retry) {
                        socket.teraslice_id = msg.id;
                        socket.join(msg.id)
                    }

                    if (msg.error) {
                        //writeToStateLog(job.stateName, msg.slice, 'error');
                        state_store.log(job.jobConfig.job_id, msg.slice, 'error');
                    }
                    else {
                        //writeToStateLog(job.stateName, msg.slice, 'completed');
                        state_store.log(job.jobConfig.job_id, msg.slice, 'completed');
                    }

                    if (msg.analytics) {
                        addStats(analyticsData, msg.analytics);
                    }
                    //Report to worker that it has been reported, so it can remove reference to last slice
                    sendMessage(msg.id, 'slice has been reported', null);

                    workerQueue.enqueue(msg);
                });

                socket.on('disconnect', function() {
                    workerQueue.remove(socket.teraslice_id)
                });
            });

            io.listen(port);


            Promise.resolve(slicerFn)
                .then(function(slicer) {
                    scheduler = lifecycle(job.jobConfig)(slicer, workerQueue, job);

                    event.once('job finished', function() {
                        logFinishedJob(context, start, job, analyticsData);
                        process.send({message: 'job finished', job_id: job.jobConfig.job_id});
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
