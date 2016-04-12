'use strict';

//TODO look into dynamic validations with convict based on lifecycles
//TODO for master shutdown, need to empty newWorkerQueue so no restarts happen
var Queue = require('../utils/queue');
var newWorkerQueue = new Queue;
var makeHostName = require('../utils/cluster').makeHostName;
var findPort = require('../config/schemas/system').findPort;
var _ = require('lodash');

function getNodeState(context) {
    var state = {
        node_id: context.sysconfig._nodeName,
        total: context.sysconfig.terafoundation.workers,
        hostname: context.sysconfig.teraslice.hostname
    };
    var clusterWorkers = context.cluster.workers;
    var active = [];

    for (var childID in clusterWorkers) {
        var child = {
            worker_id: clusterWorkers[childID].id,
            assignment: clusterWorkers[childID].assignment,
            pid: clusterWorkers[childID].process.pid
        };

        if (clusterWorkers[childID].job_id) {
            child.job_id = clusterWorkers[childID].job_id
        }

        active.push(child);
    }

    state.active = active;
    state.available = state.total - active.length;

    return state;
}

function portAllocator(sysconfig) {
    var portConfig = sysconfig.teraslice.cluster.slicer_port_range;
    var dataArray = portConfig.split(':');
    var start = Number(dataArray[0]);
    var end = Number(dataArray[1]) + 1;   //range end is non-inclusive, so add one to make it so
    var portQueue = new Queue();

    for (var i = start; i < end; i++) {
        portQueue.enqueue(i)
    }

    function getPort() {
        return portQueue.dequeue();
    }

    function addPort(port) {
        portQueue.enqueue(port)
    }

    return {
        getPort: getPort,
        addPort: addPort
    };
}

module.exports = function(context) {
    var cluster = context.cluster;
    var logger = context.logger;
    var configWorkerLimit = context.sysconfig.terafoundation.workers;
    var workerCount = configWorkerLimit ? configWorkerLimit : require('os').cpus().length;
    var systemPorts = portAllocator(context.sysconfig);

    //temporary
    var processDone = 0;

    if (workerCount === 0) {
        throw new Error(' Number of workers specified in terafoundtion configuration need to be set to greater than zero')
    }

    if (context.sysconfig.teraslice.cluster.master) {
        context.foundation.startWorkers(1, {assignment: 'cluster_master'});
    }

    var config = context.sysconfig.teraslice;
    var host = makeHostName(config.cluster.master_hostname, config.cluster.port);

    logger.info("node " + context.sysconfig._nodeName + " is attempting to connect to: " + host);

    var socket = require('socket.io-client')(host, {reconnect: true});


    function messageWorkers(context, clusterMsg, processMsg, filterFn, resultsFn) {
        var workers = context.cluster.workers;

        var allWorkersForJob = _.filter(workers, filterFn);

        _.each(allWorkersForJob, function(worker) {
            if (resultsFn) {
                resultsFn(worker)
            }
            worker.send(processMsg)
        });

        socket.emit('message processed', clusterMsg)
    }

    socket.on('connect', function() {
        logger.info('node has successfully connected to: ' + host);
        socket.emit('node online', getNodeState(context))
    });

    socket.on('disconnect', function() {
        logger.info('node has disconnected from: ' + host)
    });

    socket.on('create slicer', function(msg) {
        var slicerContext = {assignment: 'slicer', job: msg.job, job_id: msg.job_id, slicer_port: msg.slicer_port};
        //used to retry a job on startup after a stop command
        if (msg.recover_job) {
            slicerContext.recover_job = true;
        }

        context.foundation.startWorkers(1, slicerContext);
        socket.emit('message processed', msg);
        socket.emit('node state', getNodeState(context));

        workerCount--;
    });

    socket.on('create workers', function(msg) {
        var numOfCurrentWorkers = Object.keys(context.cluster.workers);
        var newWorkers = msg.workers;

        //if there is an over allocation, send back rest to be enqueued
        if (configWorkerLimit < numOfCurrentWorkers + newWorkers) {
            newWorkers = configWorkerLimit - numOfCurrentWorkers;

            //mutative
            msg.workers = msg.workers - newWorkers;
            socket.emit('node_master:over-allocated workers', msg);
        }
        context.foundation.startWorkers(newWorkers, {assignment: 'worker', job: msg.job, job_id: msg.job_id});
        socket.emit('message processed', msg);
        socket.emit('node state', getNodeState(context));
    });

    socket.on('get node state', function() {
        socket.emit('node state', getNodeState(context));
    });

    socket.on('stop job', function(data) {
        messageWorkers(context, data, {message: 'shutdown'}, function(worker) {
            if (worker.slicer_port) {
                systemPorts.addPort(worker.slicer_port)
            }
            return worker.job_id === data.job_id
        });
        socket.emit('node state', getNodeState(context));
    });

    socket.on('pause slicer', function(data) {
        messageWorkers(context, data, {message: 'pause'}, function(worker) {
            return worker.job_id === data.job_id && worker.assignment === 'slicer'
        });
    });

    socket.on('resume slicer', function(data) {
        messageWorkers(context, data, {message: 'resume'}, function(worker) {
            return worker.job_id === data.job_id && worker.assignment === 'slicer'
        });
    });

    socket.on('restart slicer', function(data) {
        messageWorkers(context, data, {message: 'exit for retry'},
            function(worker) {
                return worker.job_id === data.job_id && worker.assignment === 'slicer'
            },
            function(worker) {
                newWorkerQueue.enqueue({
                    assignment: worker.assignment,
                    job: worker.job,
                    job_id: worker.job_id,
                    recover_job: true
                });
            });
    });

    //used to find an open port for slicer
    socket.on('cluster_master:get_open_port', function(msg) {
        msg.port = systemPorts.getPort();
        socket.emit('message processed', msg);
    });


    function messageHandler(msg) {

        if (msg.message === 'shutdown') {
            processDone++;
            cluster.workers[msg.id].kill('SIGINT');
            //temporary

            if (Object.keys(cluster.workers).length === processDone) {
                process.exit()
            }
        }
        else if (msg.message === 'job finished') {
            //sending job finished notification to cluster_master
            socket.emit('job finished', msg.job_id);
        }
    }

    cluster.on('online', function(worker) {
        cluster.workers[worker.id].on('message', messageHandler);
    });

    cluster.on('exit', function(worker) {

        //used to catch slicer shutdown to allow retry, allows to bypass the jobRequest requestedWorkers
        if (worker.assignment === 'slicer' && newWorkerQueue.size()) {
            context.foundation.startWorkers(1, newWorkerQueue.dequeue());
            socket.emit('node state', getNodeState(context));
        }
        else {
            //look into maybe debouncing this to create less chatter for cluster_master
            socket.emit('node state', getNodeState(context));
        }
    })

};