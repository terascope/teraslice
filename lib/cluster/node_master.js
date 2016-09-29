'use strict';

var Queue = require('../utils/queue');
var newWorkerQueue = new Queue;
var _ = require('lodash');
var messaging = require('./services/messaging');

var nodeVersion = process.version;
var terasliceVersion = require('../../package.json').version;

function getNodeState(context) {
    var state = {
        node_id: context.sysconfig._nodeName,
        hostname: context.sysconfig.teraslice.hostname,
        pid: process.pid,
        node_version: nodeVersion,
        teraslice_version: terasliceVersion,
        total: context.sysconfig.teraslice.workers,
        state: 'connected'
    };
    var clusterWorkers = context.cluster.workers;
    var active = [];

    for (var childID in clusterWorkers) {
        var child = {
            worker_id: clusterWorkers[childID].id,
            assignment: clusterWorkers[childID].assignment,
            pid: clusterWorkers[childID].process.pid
        };

        if (clusterWorkers[childID].ex_id) {
            child.ex_id = clusterWorkers[childID].ex_id
        }

        active.push(child);
    }

    state.available = state.total - active.length;
    state.active = active;

    return state;
}

function portAllocator(sysconfig) {
    var portConfig = sysconfig.teraslice.slicer_port_range;
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
    var logger = context.foundation.makeLogger('node_master', 'node_master', {module: 'node_master'});
    var configWorkerLimit = context.sysconfig.teraslice.workers;
    var systemPorts = portAllocator(context.sysconfig);

    var config = context.sysconfig.teraslice;

    logger.info(`node ${context.sysconfig._nodeName} is attempting to connect to cluster_master`);

    var network = messaging({
        type: 'network',
        isClient: true,
        host: config.master_hostname,
        port: config.port,
        networkConfig: {reconnect: true}
    });

    var ipc = messaging({type: 'process', isClient: false, context: context});
    var host = network.getHostUrl();

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

    network.register('connect', function() {
        logger.info(`node has successfully connected to: ${host}`);
        network.send('node_master:node_online', getNodeState(context))
    });

    network.register('disconnect', function() {
        logger.info(`node has disconnected from: ${host}`)
    });

    network.register('cluster_service:slicer_analytics', function(data) {
        messageWorkers(context, data, {
            message: 'cluster_service:slicer_analytics',
            node_id: context.sysconfig._nodeName
        }, function(worker) {
            if (data.ex_id) {
                return worker.ex_id === data.ex_id && worker.assignment === 'slicer'
            }
            else {
                return worker.assignment === 'slicer'
            }
        });
    });

    network.register('cluster_service:create_slicer', function(slicerConfig) {
        var slicerContext = {
            assignment: 'slicer',
            job: slicerConfig.job,
            node_id: context.sysconfig._nodeName,
            ex_id: slicerConfig.ex_id,
            slicer_port: slicerConfig.slicer_port
        };
        //used to retry a job on startup after a stop command
        if (slicerConfig.recover_execution) {
            slicerContext.recover_execution = true;
        }

        context.foundation.startWorkers(1, slicerContext);
        network.send('node_master:node_state', getNodeState(context));
        network.send('node_master:message_processed', slicerConfig);

    });

    network.register('cluster_service:create_workers', function(msg) {
        var numOfCurrentWorkers = Object.keys(context.cluster.workers).length;

        var newWorkers = msg.workers;
        logger.info(`Attempting to allocate ${newWorkers} workers.`);

        //if there is an over allocation, send back rest to be enqueued
        if (configWorkerLimit < numOfCurrentWorkers + newWorkers) {
            newWorkers = configWorkerLimit - numOfCurrentWorkers;

            //mutative
            msg.workers = msg.workers - newWorkers;
            network.send('node_master:over_allocated_workers', msg);
            logger.warn(`Worker allocation request would exceed maximum number of workers - ${configWorkerLimit}`);
            logger.warn(`Reducing allocation to ${newWorkers} workers.`);
        }

        context.foundation.startWorkers(newWorkers, {
            assignment: 'worker',
            node_id: context.sysconfig._nodeName,
            job: msg.job,
            ex_id: msg.ex_id
        });

        network.send('node_master:node_state', getNodeState(context));
        network.send('node_master:message_processed', msg);
    });

    network.register('cluster_service:get_node_state', function() {
        network.send('node_master:node_state', getNodeState(context));
    });

    network.register('cluster_service:stop_job', function(data) {
        var slicerFound = false;
        var stopTime = config.timeout;
        var intervalTime = 200;

        messageWorkers(context, data, {message: 'cluster_service:stop_job'}, function(worker) {
            if (worker.slicer_port) {
                systemPorts.addPort(worker.slicer_port);
                slicerFound = true;
            }
            return worker.ex_id === data.ex_id
        });

        if (!slicerFound) {
            var stop = setInterval(function() {
                var children = getNodeState(context);
                var workersForJob = _.filter(children.active, function(worker) {
                    return worker.ex_id === data.ex_id
                });

                if (workersForJob.length === 0) {
                    clearInterval(stop);
                    network.send('node_master:message_processed', data);
                }
                //this is here for the sole purpose of cleanup of interval, top level promise will have rejected by now
                if (stopTime <= 0) {
                    clearInterval(stop);
                }

                stopTime -= intervalTime;

            }, intervalTime);
        }
        network.send('node_master:node_state', getNodeState(context));
    });

    network.register('cluster_service:pause_slicer', function(data) {
        messageWorkers(context, data, {message: 'cluster_service:pause_slicer'}, function(worker) {
            return worker.ex_id === data.ex_id && worker.assignment === 'slicer'
        });
    });

    network.register('cluster_service:resume_slicer', function(data) {
        messageWorkers(context, data, {message: 'cluster_service:resume_slicer'}, function(worker) {
            return worker.ex_id === data.ex_id && worker.assignment === 'slicer'
        });
    });

    network.register('cluster_service:restart_slicer', function(data) {
        messageWorkers(context, data, {message: 'cluster_service:restart_slicer'},
            function(worker) {
                return worker.ex_id === data.ex_id && worker.assignment === 'slicer'
            },
            function(worker) {
                newWorkerQueue.enqueue({
                    assignment: worker.assignment,
                    job: worker.job,
                    ex_id: worker.ex_id,
                    recover_job: true
                });
            });
    });

    network.register('cluster_service:remove_workers', function(data) {
        var counter = data.workers;
        //TODO temp multiply by 1000, its listed in seconds
        var stopTime = config.shutdown_timeout * 1000;
        var intervalTime = 200;
        var children = getNodeState(context);

        var workerCount = _.filter(children.active, function(worker) {
            return worker.ex_id === data.ex_id && worker.assignment === 'worker';
        }).length;

        messageWorkers(context, data, {message: 'shutdown'},
            function(worker) {
                if (worker.ex_id === data.ex_id && worker.assignment === 'worker' && counter) {
                    counter -= 1;
                    return worker;
                }
            });

        var workerStop = setInterval(function() {
            var children = getNodeState(context);
            var workersForJob = _.filter(children.active, function(worker) {
                return worker.ex_id === data.ex_id && worker.assignment === 'worker';
            });

            if (workersForJob.length + data.workers <= workerCount) {
                clearInterval(workerStop);
                network.send('node_master:message_processed', data);
            }
            //this is here for the sole purpose of cleanup of interval, top level promise will have rejected by now
            if (stopTime <= 0) {
                clearInterval(workerStop);
            }

            stopTime -= intervalTime;
        }, intervalTime);
    });

    //used to find an open port for slicer
    network.register('cluster_service:get_open_port', function(msg) {
        msg.port = systemPorts.getPort();
        network.send('node_master:message_processed', msg);
    });

    network.register('connect_error', function(err) {
        logger.warn(`Attempting to connect to cluster_master: ${host}`, err)
    });

    network.initialize();

    //TODO abstract this away
    function messageHandler(processMsg) {

        if (processMsg.message === 'slicer:slicer_initialized') {
            network.send('slicer:slicer_initialized', processMsg);
            return;
        }

        if (processMsg.message === 'slicer:job_finished') {
            console.log('am i getting called here when all is said and done in node master for a job');
            network.send('slicer:job_finished', processMsg);
            return;
        }

        if (processMsg.message === 'job:terminal_error') {
            network.send('job:terminal_error', processMsg);
            return;
        }

        if (processMsg.message === 'message_processed') {
            network.send('node_master:message_processed', processMsg);
            return;
        }

        if (processMsg.message === 'slicer:failed_recovery') {
            network.send('slicer:failed_recovery', processMsg);
            return;
        }

        if (processMsg.message === 'slicer:processing_error') {
            network.send('slicer:processing_error', processMsg);
            return;
        }

        if (processMsg.message === 'slicer:job_update') {
            network.send('slicer:job_update', processMsg);
            return;
        }
        if (processMsg.message === 'error:terminal') {
            logger.flush().then(function() {
                process.exit()
            });
        }

    }

    ipc.register('online', function(worker) {
        cluster.workers[worker.id].on('message', messageHandler);
    });

    ipc.register('exit', function(worker) {
        //reclaim ports
        if (worker.slicer_port) {
            systemPorts.addPort(worker.slicer_port)
        }
        //used to catch slicer shutdown to allow retry, allows to bypass the jobRequest requestedWorkers
        if (worker.assignment === 'slicer' && newWorkerQueue.size()) {
            context.foundation.startWorkers(1, newWorkerQueue.dequeue());
            network.send('node_master:node_state', getNodeState(context));
        }
        else {
            //look into maybe debouncing this to create less chatter for cluster_master
            network.send('node_master:node_state', getNodeState(context));
        }
    });

    ipc.initialize();

    if (context.sysconfig.teraslice.master) {
        context.foundation.startWorkers(1, {assignment: 'cluster_master', node_id: context.sysconfig._nodeName});
    }

};