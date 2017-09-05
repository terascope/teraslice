'use strict';

var Queue = require('queue');
var newWorkerQueue = new Queue;
var _ = require('lodash');
var messageModule = require('./services/messaging');
var parseError = require('../utils/error_utils').parseError;
var deleteDir = require('../utils/file_utils').deleteDir;
var nodeVersion = process.version;
var terasliceVersion = require('../../package.json').version;

//setting assignment
process.env.assignment = 'node_master';


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
    var assets_path = config.assets_directory;

    var sendNodeState = _.debounce(function() {
        messaging.send('node:state', getNodeState());
    }, 500, {leading: false, trailing: true});

    var messaging = messageModule(context, logger, sendNodeState);
    var host = messaging.getHostUrl();

    logger.info(`node ${context.sysconfig._nodeName} is attempting to connect to cluster_master: ${host}`);

    function assetIsLoading(context, ex_id) {
        var workers = context.cluster.workers;
        var assetWorker = _.filter(workers, function(worker) {
            return worker.assignment === 'assets_loader' && worker.ex_id === ex_id
        });

        return assetWorker.length === 1;
    }

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

    messaging.register('network:connect', function() {
        logger.info(`node has successfully connected to: ${host}`);
        messaging.send('node:online', getNodeState())
    });

    messaging.register('network:disconnect', function() {
        logger.info(`node has disconnected from: ${host}`)
    });

    messaging.register('assets:loaded', function(assetsMsg) {
        messageWorkers(context, assetsMsg, assetsMsg, function(worker) {
            if (worker.ex_id === assetsMsg.identifier) {
                //set all workers with the asset id's so it can show up in node state
                worker.assets = assetsMsg.meta;
                return true;
            }
        });
    });

    messaging.register('assets:delete', function(assetID) {
        deleteDir(`${assets_path}/${assetID}`)
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(errMsg)
            })
    });

    messaging.register('assets:preloaded', function(assetsMsg) {
        messageWorkers(context, assetsMsg, assetsMsg, function(worker) {
            return worker.assignment === 'cluster_master';
        });
    });

    messaging.register('jobs_service:verify_assets', function(loadMsg) {
        context.foundation.startWorkers(1, {
            assignment: 'assets_loader',
            node_id: context.sysconfig._nodeName,
            preload: true,
            job: JSON.stringify(loadMsg)
        });
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

    messaging.register('cluster:slicer:create', function(createSlicerMsg) {
        var slicerContext = {
            assignment: 'slicer',
            job: createSlicerMsg.job,
            node_id: context.sysconfig._nodeName,
            ex_id: createSlicerMsg.ex_id,
            job_id: createSlicerMsg.job_id,
            slicer_port: createSlicerMsg.slicer_port
        };
        //used to retry a job on startup after a stop command
        if (createSlicerMsg.recover_execution) {
            slicerContext.recover_execution = true;
        }
        logger.trace('starting a slicer', slicerContext);
        context.foundation.startWorkers(1, slicerContext);

        if (createSlicerMsg.needsAssets) {
            logger.info(`node ${context.sysconfig._nodeName} is checking assets for job ${createSlicerMsg.ex_id}`);
            context.foundation.startWorkers(1, {
                assignment: 'assets_loader',
                node_id: context.sysconfig._nodeName,
                job: createSlicerMsg.job,
                ex_id: createSlicerMsg.ex_id
            });
        }

        //need to update cluster_master immediately so it can balance workers correctly and prevent wrong allocations
        messaging.send('node:state', getNodeState());
        messaging.send('node:message:processed', createSlicerMsg);
    });

    messaging.register('cluster:workers:create', function(createWorkerMsg) {
        var numOfCurrentWorkers = Object.keys(context.cluster.workers).length;

        var newWorkers = createWorkerMsg.workers;
        logger.info(`Attempting to allocate ${newWorkers} workers.`);

        //if there is an over allocation, send back rest to be enqueued
        if (configWorkerLimit < numOfCurrentWorkers + newWorkers) {
            newWorkers = configWorkerLimit - numOfCurrentWorkers;

            //mutative
            createWorkerMsg.workers = createWorkerMsg.workers - newWorkers;
            messaging.send('node:workers:over_allocated', createWorkerMsg);
            logger.warn(`Worker allocation request would exceed maximum number of workers - ${configWorkerLimit}`);
            logger.warn(`Reducing allocation to ${newWorkers} workers.`);
        }
        logger.trace(`starting ${newWorkers} workers`, createWorkerMsg.ex_id);

        context.foundation.startWorkers(newWorkers, {
            assignment: 'worker',
            node_id: context.sysconfig._nodeName,
            job: createWorkerMsg.job,
            ex_id: createWorkerMsg.ex_id,
            job_id: createWorkerMsg.job_id
        });

        //for workers on nodes that don't have the asset loading process already going
        if (createWorkerMsg.needsAssets && !assetIsLoading(context, createWorkerMsg.ex_id)) {
            logger.info(`node ${context.sysconfig._nodeName} is checking assets for job ${createWorkerMsg.ex_id}`);
            context.foundation.startWorkers(1, {
                assignment: 'assets_loader',
                node_id: context.sysconfig._nodeName,
                job: createWorkerMsg.job,
                ex_id: createWorkerMsg.ex_id
            });
        }

        messaging.send('node:message:processed', createWorkerMsg);
    });

    messaging.register('cluster:node:state', function() {
        sendNodeState();
    });

    messaging.register('cluster:job:stop', function(data) {
        var slicerFound = false;
        var stopTime = config.timeout;
        var intervalTime = 200;

        messageWorkers(context, data, {message: 'worker:shutdown'}, function(worker) {
            if (worker.ex_id === data.ex_id && worker.slicer_port) {
                slicerFound = true;
            }
            return worker.ex_id === data.ex_id
        });

        if (!slicerFound) {
            var stop = setInterval(function() {
                var children = getNodeState();
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
        var children = getNodeState();

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
            var children = getNodeState();
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

    messaging.register('network:error', function(err) {
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
            //reclaim port if slicer exits, if slicer tries to restart it will exit and mark the job as failed
            systemPorts.addPort(worker.slicer_port)
        }
        //used to catch slicer shutdown to allow retry, allows to bypass the jobRequest requestedWorkers
        if (worker.assignment === 'slicer' && newWorkerQueue.size()) {
            context.foundation.startWorkers(1, newWorkerQueue.dequeue());
        }
        else {
            sendNodeState()
        }
    });

    function getNodeState() {
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

            if (clusterWorkers[childID].job_id) {
                child.job_id = clusterWorkers[childID].job_id
            }

            if (clusterWorkers[childID].assets) {
                child.assets = clusterWorkers[childID].assets.map(asset => asset.id);
            }

            active.push(child);
        }

        state.available = state.total - active.length;
        state.active = active;

        return state;
    }

    messaging.initialize();

    if (context.sysconfig.teraslice.master) {
        var assets_port = systemPorts.getPort();

        logger.debug(`node ${context.sysconfig._nodeName} is creating the cluster_master`);
        context.foundation.startWorkers(1, {
            assignment: 'cluster_master',
            assets_port: assets_port,
            node_id: context.sysconfig._nodeName
        });

        logger.debug(`node ${context.sysconfig._nodeName} is creating assets endpoint on port ${assets_port}`);
        context.foundation.startWorkers(1, {
            assignment: 'assets_service',
            //key needs to be called port to bypass cluster port sharing
            port: assets_port,
            node_id: context.sysconfig._nodeName
        });
    }

    if (context.sysconfig.teraslice.moderator) {
        logger.debug(`node ${context.sysconfig._nodeName} is creating the moderator`);
        context.foundation.startWorkers(1, {assignment: 'moderator', node_id: context.sysconfig._nodeName});
    }
};