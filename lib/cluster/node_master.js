'use strict';

var Queue = require('../utils/queue');
var newWorkerQueue = new Queue;
var _ = require('lodash');
var messageModule = require('./services/messaging');

var nodeVersion = process.version;
var terasliceVersion = require('../../package.json').version;

//setting assignment
process.env.assignment = 'node_master';

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

    var messaging = messageModule(context, logger);
    var host = messaging.getHostUrl();

    logger.info(`node ${context.sysconfig._nodeName} is attempting to connect to cluster_master: ${host}`);

    function messageWorkers(context, clusterMsg, processMsg, filterFn, resultsFn) {
        var workers = context.cluster.workers;
        //sharing the unique msg id for each message sent
        processMsg._msgID = clusterMsg._msgID;

        var allWorkersForJob = _.filter(workers, filterFn);
        _.each(allWorkersForJob, function(worker) {
            if (resultsFn) {
                resultsFn(worker)
            }
            logger.trace(`sending message to worker ${worker.id}, ex_id: ${worker.ex_id}, msg:`, processMsg);
            worker.send(processMsg)
        });
    }

    messaging.register('node:cluster:connect', function() {
        logger.info(`node has successfully connected to: ${host}`);
        messaging.send('node:online', getNodeState(context))
    });

    messaging.register('node:cluster:disconnect', function() {
        logger.info(`node has disconnected from: ${host}`)
    });

    messaging.register('cluster:slicer:analytics', function(data) {
        messageWorkers(context, data, {
            message: 'cluster:slicer:analytics',
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

    messaging.register('cluster:slicer:create', function(slicerConfig) {
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
        logger.trace('starting a slicer', slicerContext);
        context.foundation.startWorkers(1, slicerContext);
        messaging.send('node:state', getNodeState(context));
        messaging.send('node:message:processed', slicerConfig);

    });

    messaging.register('cluster:workers:create', function(msg) {
        var numOfCurrentWorkers = Object.keys(context.cluster.workers).length;

        var newWorkers = msg.workers;
        logger.info(`Attempting to allocate ${newWorkers} workers.`);

        //if there is an over allocation, send back rest to be enqueued
        if (configWorkerLimit < numOfCurrentWorkers + newWorkers) {
            newWorkers = configWorkerLimit - numOfCurrentWorkers;

            //mutative
            msg.workers = msg.workers - newWorkers;
            messaging.send('node:workers:over_allocated', msg);
            logger.warn(`Worker allocation request would exceed maximum number of workers - ${configWorkerLimit}`);
            logger.warn(`Reducing allocation to ${newWorkers} workers.`);
        }
        logger.trace(`starting ${newWorkers} workers`, msg.ex_id);

        context.foundation.startWorkers(newWorkers, {
            assignment: 'worker',
            node_id: context.sysconfig._nodeName,
            job: msg.job,
            ex_id: msg.ex_id
        });

        messaging.send('node:state', getNodeState(context));
        messaging.send('node:message:processed', msg);
    });

    messaging.register('cluster:node:state', function() {
        messaging.send('node:state', getNodeState(context));
    });

    messaging.register('cluster:job:stop', function(data) {
        var slicerFound = false;
        var stopTime = config.timeout;
        var intervalTime = 200;

        messageWorkers(context, data, {message: 'worker:shutdown'}, function(worker) {
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
                logger.debug(`waiting for ${workersForJob.length} to stop for ex: ${data.ex_id}`);
                if (workersForJob.length === 0) {
                    clearInterval(stop);
                    logger.debug(`workers have stopped, relaying process message signal`);

                    messaging.send('node:message:processed', data);
                }
                //this is here for the sole purpose of cleanup of interval, top level promise will have rejected by now
                if (stopTime <= 0) {
                    clearInterval(stop);
                }

                stopTime -= intervalTime;

            }, intervalTime);
        }
        messaging.send('node:state', getNodeState(context));
    });

    messaging.register('cluster:job:pause', function(data) {
        messageWorkers(context, data, {message: 'cluster:job:pause'}, function(worker) {
            return worker.ex_id === data.ex_id && worker.assignment === 'slicer'
        });
    });

    messaging.register('cluster:job:resume', function(data) {
        messageWorkers(context, data, {message: 'cluster:job:resume'}, function(worker) {
            return worker.ex_id === data.ex_id && worker.assignment === 'slicer'
        });
    });

    messaging.register('cluster:job:restart', function(data) {
        messageWorkers(context, data, {message: 'cluster:job:restart'},
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

    messaging.register('cluster:workers:remove', function(data) {
        var counter = data.workers;
        var stopTime = config.shutdown_timeout;
        var intervalTime = 200;
        var children = getNodeState(context);

        var workerCount = _.filter(children.active, function(worker) {
            return worker.ex_id === data.ex_id && worker.assignment === 'worker';
        }).length;

        messageWorkers(context, data, {message: 'worker:shutdown'},
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
                messaging.send('node:message:processed', data);
            }
            //this is here for the sole purpose of cleanup of interval, top level promise will have rejected by now
            if (stopTime <= 0) {
                clearInterval(workerStop);
            }

            stopTime -= intervalTime;
        }, intervalTime);
    });

    //used to find an open port for slicer
    messaging.register('cluster:node:get_port', function(msg) {
        msg.port = systemPorts.getPort();
        logger.debug(`assigning port ${msg.port} for new job`);
        messaging.send('node:message:processed', msg);
    });

    messaging.register('node:connection:error', function(err) {
        logger.warn(`Attempting to connect to cluster_master: ${host}`, err)
    });

    messaging.register('cluster:error:terminal', function() {
        logger.error('terminal error in cluster_master, flushing logs and shutting down');
        logger.flush().then(function() {
            process.exit()
        });
    });

    messaging.register('child:exit', function(worker) {
        //reclaim ports
        if (worker.slicer_port) {
            logger.debug(`reclaiming port ${worker.slicer_port} from slicer exit`);
            systemPorts.addPort(worker.slicer_port)
        }
        //used to catch slicer shutdown to allow retry, allows to bypass the jobRequest requestedWorkers
        if (worker.assignment === 'slicer' && newWorkerQueue.size()) {
            context.foundation.startWorkers(1, newWorkerQueue.dequeue());
            messaging.send('node:state', getNodeState(context));
        }
        else {
            //look into maybe debouncing this to create less chatter for cluster_master
            messaging.send('node:state', getNodeState(context));
        }
    });

    messaging.initialize();

    if (context.sysconfig.teraslice.master) {
        logger.debug(`node ${context.sysconfig._nodeName} is creating the cluster_master`);
        context.foundation.startWorkers(1, {assignment: 'cluster_master', node_id: context.sysconfig._nodeName});
    }

};