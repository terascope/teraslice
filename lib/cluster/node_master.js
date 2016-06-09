'use strict';

//TODO look into dynamic validations with convict based on lifecycles
//TODO for master shutdown, need to empty newWorkerQueue so no restarts happen
var Queue = require('../utils/queue');
var newWorkerQueue = new Queue;
var makeHostName = require('../utils/cluster').makeHostName;
var _ = require('lodash');

function getNodeState(context) {
    var state = {
        node_id: context.sysconfig._nodeName,
        hostname: context.sysconfig.teraslice.hostname,
        total: context.sysconfig.teraslice.workers
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

    state.available = state.total - active.length;
    state.active = active;

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
    var configWorkerLimit = context.sysconfig.teraslice.workers;
    var workerCount = configWorkerLimit ? configWorkerLimit : require('os').cpus().length;
    var systemPorts = portAllocator(context.sysconfig);

    if (workerCount === 0) {
        throw new Error(' Number of workers specified in teraslice configuration needs to be greater than zero')
    }

    if (context.sysconfig.teraslice.cluster.master) {
        context.foundation.startWorkers(1, {assignment: 'cluster_master', node_id: context.sysconfig._nodeName});
    }

    var config = context.sysconfig.teraslice;
    var host = makeHostName(config.cluster.master_hostname, config.cluster.port);

    logger.info("node " + context.sysconfig._nodeName + " is attempting to connect to: " + host);

    var socket = require('socket.io-client')(host, {reconnect: true});


    function messageWorkers(context, clusterMsg, processMsg, filterFn, resultsFn) {
        var workers = context.cluster.workers;
        //sharing the unique msg id for each message sent
        processMsg._msgID = clusterMsg._msgID;

        var allWorkersForJob = _.filter(workers, filterFn);

        _.each(allWorkersForJob, function(worker) {
            if (resultsFn) {
                resultsFn(worker)
            }
            worker.send(processMsg)
        });
    }

    socket.on('connect', function() {
        logger.info('node has successfully connected to: ' + host);
        socket.emit('node_master:node_online', getNodeState(context))
    });

    socket.on('disconnect', function() {
        logger.info('node has disconnected from: ' + host)
    });

    socket.on('cluster_service:slicer_analytics', function(data) {
        messageWorkers(context, data, {
            message: 'cluster_service:slicer_analytics',
            node_id: context.sysconfig._nodeName
        }, function(worker) {
            if (data.job_id) {
                return worker.job_id === data.job_id && worker.assignment === 'slicer'
            }
            else {
                return worker.assignment === 'slicer'
            }
        });
    });

    socket.on('cluster_service:create_slicer', function(msg) {
        var slicerContext = {
            assignment: 'slicer',
            job: msg.job,
            node_id: context.sysconfig._nodeName,
            job_id: msg.job_id,
            slicer_port: msg.slicer_port
        };
        //used to retry a job on startup after a stop command
        if (msg.recover_job) {
            slicerContext.recover_job = true;
        }

        context.foundation.startWorkers(1, slicerContext);
        socket.emit('node_master:node_state', getNodeState(context));
        socket.emit('node_master:message_processed', msg);

    });

    socket.on('cluster_service:create_workers', function(msg) {
        var numOfCurrentWorkers = Object.keys(context.cluster.workers).length;

        var newWorkers = msg.workers;
        logger.info("Attempting to allocate " + newWorkers + " workers.");

        //if there is an over allocation, send back rest to be enqueued
        if (configWorkerLimit < numOfCurrentWorkers + newWorkers) {
            newWorkers = configWorkerLimit - numOfCurrentWorkers;

            //mutative
            msg.workers = msg.workers - newWorkers;
            socket.emit('node_master:over_allocated_workers', msg);
            logger.warn("Worker allocation request would exceed maximum number of workers - " + configWorkerLimit);
            logger.warn("Reducing allocation to " + newWorkers + " workers.");
        }

        context.foundation.startWorkers(newWorkers, {
            assignment: 'worker',
            node_id: context.sysconfig._nodeName,
            job: msg.job,
            job_id: msg.job_id
        });

        socket.emit('node_master:node_state', getNodeState(context));
        socket.emit('node_master:message_processed', msg);
    });

    socket.on('cluster_service:get_node_state', function() {
        socket.emit('node_master:node_state', getNodeState(context));
    });

    socket.on('cluster_service:stop_job', function(data) {
        messageWorkers(context, data, {message: 'cluster_service:stop_job'}, function(worker) {
            if (worker.slicer_port) {
                systemPorts.addPort(worker.slicer_port)
            }
            return worker.job_id === data.job_id
        });
        socket.emit('node_master:node_state', getNodeState(context));
    });

    socket.on('cluster_service:pause_slicer', function(data) {
        messageWorkers(context, data, {message: 'cluster_service:pause_slicer'}, function(worker) {
            return worker.job_id === data.job_id && worker.assignment === 'slicer'
        });
    });

    socket.on('cluster_service:resume_slicer', function(data) {
        messageWorkers(context, data, {message: 'cluster_service:resume_slicer'}, function(worker) {
            return worker.job_id === data.job_id && worker.assignment === 'slicer'
        });
    });

    socket.on('cluster_service:restart_slicer', function(data) {
        messageWorkers(context, data, {message: 'cluster_service:restart_slicer'},
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
    socket.on('cluster_service:get_open_port', function(msg) {
        msg.port = systemPorts.getPort();
        socket.emit('node_master:message_processed', msg);
    });


    function messageHandler(msg) {

        if (msg.message === 'slicer:slicer_initialized') {
            socket.emit('slicer:slicer_initialized', msg);
            return;
        }

        if (msg.message === 'slicer:job_finished') {
            socket.emit('slicer:job_finished', msg);
            return;
        }

        if (msg.message === 'slicer:error') {
            socket.emit('slicer:error', msg);
            return;
        }

        if (msg.message === 'message_processed') {
            socket.emit('node_master:message_processed', msg);
            return;
        }

        if (msg.message === 'slicer:failed_recovery') {
            socket.emit('slicer:failed_recovery', msg);
            return;
        }

        if (msg.message === 'slicer:processing_error') {
            socket.emit('slicer:processing_error', msg);
            return;
        }
    }

    cluster.on('online', function(worker) {
        cluster.workers[worker.id].on('message', messageHandler);
    });

    cluster.on('exit', function(worker) {
        //reclaim ports
        if (worker.slicer_port) {
            systemPorts.addPort(worker.slicer_port)
        }
        //used to catch slicer shutdown to allow retry, allows to bypass the jobRequest requestedWorkers
        if (worker.assignment === 'slicer' && newWorkerQueue.size()) {
            context.foundation.startWorkers(1, newWorkerQueue.dequeue());
            socket.emit('node_master:node_state', getNodeState(context));
        }
        else {
            //look into maybe debouncing this to create less chatter for cluster_master
            socket.emit('node_master:node_state', getNodeState(context));
        }
    })

};