'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var event = require('../../utils/events');
var shortid = require('shortid');
var Queue = require('../../utils/queue');

module.exports = function(context, server) {
    var messaging = context.messaging;
    var logger = context.foundation.makeLogger('cluster', 'cluster', {module: 'cluster_service'});
    var configTimeout = context.sysconfig.teraslice.timeout;
    var pendingWorkerRequests = new Queue();

    var cluster_state = {};

    //temporary holding spot used to attach nodes that are non responsive or disconnect before final cleanup
    var droppedNodes = {};

    //event can be fired from anything that instantiates a client, such as stores
    event.on('client config error', terminalShutdown);

    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    function terminalShutdown(errEV) {
        logger.error(`Terminal error: ${errEV.err}`);
        messaging.send({message: 'cluster:error:terminal'});
    }

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);

    messaging.register('worker:shutdown', function(msg) {
        event.emit('cluster_master:shutdown')
    });

    messaging.register('node:online', 'node_id', function(data, node_id) {
        logger.info(`node ${node_id} has connected`);
        //messaging module will join connection

        //if a reconnect happens stop timer
        if (droppedNodes[node_id]) {
            clearTimeout(droppedNodes[node_id]);
            delete droppedNodes[node_id];
        }
        logger.trace(`node ${node_id} has state:`, data);
        cluster_state[node_id] = data;
        //if new node comes online, check if jobs need more workers
        event.emit('cluster:available_workers')
    });

    messaging.register('node:state', function(data) {
        cluster_state[data.node_id] = data;
        logger.debug(`node ${data.node_id} state is being updated`);
        logger.trace(`node ${data.node_id} has updated state:`, data);
        event.emit('cluster:available_workers')
    });

    messaging.register('node:message:processed', function(data) {
        //emitting the unique msg id to allow easier listener cleanup
        logger.debug(`node message ${data._msgID} has been processed`);
        event.emit(data._msgID, data);
    });

    messaging.register('node:workers:over_allocated', function(requestData) {
        logger.debug(`over-allocated workers, returning them to pending worker request queue`);
        pendingWorkerRequests.enqueue(requestData);
    });

    messaging.register('slicer:job:finished', function(data) {
        //remove any pending worker request on completed jobs
        logger.debug(`job for ex_id: ${data.ex_id} has finished, removing any from pending queue`);
        logger.trace(`job ex_id: ${data.ex_id} has finished,  message:`, data);

        pendingWorkerRequests.remove(data.ex_id);

        messaging.send('cluster:job:stop', data);
        //if errors in slices, emit error event
        if (data.errorCount > 0) {
            var message = `job: ${data.ex_id} had ${data.errorCount} slice failures during processing`;
            data.error = message;

            logger.warn(message);
            event.emit('cluster:job_failure', data)
        }
        else {
            event.emit('cluster:job_finished', data);
        }
    });

    messaging.register('slicer:recovery:failed', function(data) {
        //remove any pending worker request
        logger.debug(`slicer for execution: ${data.ex_id} has failed on recovery`);
        pendingWorkerRequests.remove(data.ex_id);
        messaging.send('cluster:job:stop', {ex_id: data.ex_id});
        event.emit('cluster:job_failure', data);
    });

    messaging.register('job:error:terminal', function(data) {
        logger.debug(`terminal job error for execution: ${data.ex_id}, canceling job`);

        pendingWorkerRequests.remove(data.ex_id);
        messaging.send('cluster:job:stop', {ex_id: data.ex_id});
        event.emit('cluster:job_failure', data);
    });

    messaging.register('slicer:error:terminal', function(data) {
        logger.debug(`terminal slicer error for execution: ${data.ex_id}, canceling job`);

        pendingWorkerRequests.remove(data.ex_id);
        messaging.send('cluster:job:stop', {ex_id: data.ex_id});
        event.emit('cluster:slicer_failure', data);
    });

    messaging.register('slicer:processing:error', function(data) {
        logger.debug(`an error has occurred processing a slice, ex_id: ${data.ex_id}`);
        logger.trace(`error processing slice,ex_id: ${data.ex_id}, message:`, data);
        event.emit('slicer:processing:error', data)
    });

    messaging.register('slicer:initialized', function(data) {
        logger.debug(`slicer has initialized, ex_id: ${data.ex_id}`);
        logger.trace(`slicer initialized, ex_id: ${data.ex_id}, message:`, data);

        event.emit('slicer:initialized', data)
    });

    messaging.register('slicer:job:update', function(ex_Update) {
        logger.debug(`updating ex: ${ex_Update.ex_id}`);
        logger.trace(`updating ex: ${ex_Update.ex_id}, message:`, ex_Update);
        event.emit('slicer:job:update', ex_Update);
    });

    messaging.register('cluster:connection:error', function(err, other) {
        logger.error(`Error : cluster_master had an error with one of its connections`, err)
    });

    messaging.register('node:disconnect', 'node_id', function(msg, node_id) {
        if (node_id && cluster_state[node_id]) {
            if (cluster_state[node_id].active.length === 0) {
                logger.warn(`node ${node_id} has disconnected`);
                delete cluster_state[node_id];
            }
            else {
                cluster_state[node_id].state = 'disconnected';

                var timer = setTimeout(function() {
                    cleanUpNode(node_id);
                }, 5000);

                droppedNodes[node_id] = timer;
            }
        }
        else {
            logger.error(`cluster got a node_master disconnect event, but no node_id or state was found. might be a network issue, node_id: ${node_id}`, cluster_state[node_id])
        }
    });


    messaging.initialize({server: server});

    setInterval(function() {
        logger.trace(`cluster_master requesting state update for all nodes`);
        messaging.send('cluster:node:state')
    }, 5000);


    function cleanUpNode(node_id) {
        //check workers and slicers
        var node = checkNode(cluster_state[node_id]);

        if (node.hasSlicer) {
            _.forIn(node.slicerJobID, function(ex_id) {
                logger.error(`node ${node_id} has disconnected with active slicer for job: ${ex_id}, marking as failed and shutting down job`);

                var data = {ex_id: ex_id, error: 'node_master where slicer resided has disconnected'};
                pendingWorkerRequests.remove(ex_id);
                event.emit('cluster:job_failure', data);
                messaging.send('cluster:job:stop', {ex_id: ex_id});
            });
        }

        _.forIn(node.workerJobID, function(value) {
            //looking for unique ex_id's not in slicerJobID
            if (!node.slicerJobID[value]) {
                //emitting to job service, since cluster is instantiated before job service is ready
                var numOfWorkers = cluster_state[node_id].active.filter(function(worker) {
                    return worker.ex_id === value;
                }).length;

                event.emit('cluster_service:cleanup_job', {
                    ex_id: value,
                    id: value,
                    node_id: node_id,
                    workers: numOfWorkers,
                    assignment: 'worker'
                })
            }
        });

        //cleanup key so we don't get ever growing obj
        delete droppedNodes[node_id];

        delete cluster_state[node_id];
    }

    function getClusterState() {
        return _.cloneDeep(cluster_state);
    }

    function checkNode(node) {
        var obj = {
            hasSlicer: false,
            numOfSlicers: 0,
            slicerJobID: {},
            workerJobID: {},
            numOfWorkers: 0,
            id: node.id,
            available: node.available
        };

        return node.active.reduce(function(prev, curr) {
            if (curr.assignment === 'slicer') {
                prev.hasSlicer = true;
                prev.numOfSlicers++;
                prev.slicerJobID[curr.ex_id] = curr.ex_id;
            }

            if (curr.assignment === 'worker') {
                prev.numOfWorkers++;
                prev.workerJobID[curr.ex_id] = curr.ex_id;
            }

            return prev;
        }, obj);

    }

    function findNodeForSlicer(stateArray, errorNodes) {
        var slicerNode = null;
        for (var i = 0; i < stateArray.length; i++) {

            if (stateArray[i].state === 'connected' && stateArray[i].available > 0 && !errorNodes[stateArray[i].node_id]) {

                var node = checkNode(stateArray[i]);

                if (!node.hasSlicer) {
                    slicerNode = stateArray[i].node_id;
                    break;
                }
            }
        }

        //if all nodes have a slicer
        if (!slicerNode) {
            //list is already sorted by num available since stateArray is sorted
            slicerNode = stateArray[0].node_id;
        }

        return slicerNode;
    }

    function findNodesForJob(ex_id, slicer_only) {
        var nodes = [];

        _.forOwn(cluster_state, function(node) {
            var hasJob = node.active.filter(function(worker) {
                if (slicer_only) {
                    return worker.ex_id === ex_id && worker.assignment === 'slicer';
                }
                else {
                    return worker.ex_id === ex_id;
                }
            });

            if (hasJob.length >= 1) {
                nodes.push({node_id: node.node_id, ex_id: ex_id, hostname: node.hostname, workers: hasJob})
            }
        });

        return nodes
    }

    function availableWorkers(all_workers, forceCheck) {
        var num = 0;

        if (pendingWorkerRequests.size() === 0 || forceCheck) {

            var key = all_workers ? 'total' : 'available';

            _.forOwn(cluster_state, function(node) {
                if (node.state === 'connected') {
                    num += node[key];
                }
            });
        }

        return num;
    }

    function allWorkers() {
        //total number of workers function
        return availableWorkers(true)
    }

    function allNodes() {
        return Object.keys(cluster_state);
    }

    function findPort(node_id) {
        return notifyNode(node_id, 'cluster:node:get_port', {});
    }

    function removeFromQueue(id) {
        pendingWorkerRequests.remove(id)
    }

    function addToQueue(data) {
        pendingWorkerRequests.enqueue(data)
    }

    function makeDispatch() {
        var methods = {};
        var dispatch = {};

        methods.set = function(node_id, numOfWorkers) {
            if (dispatch[node_id]) {
                dispatch[node_id] += numOfWorkers;
            }
            else {
                dispatch[node_id] = numOfWorkers;
            }
        };
        methods.getDispatch = function() {
            return dispatch;
        };

        return methods;
    }

    function notifyNode(node_id, msg, msgData) {
        return new Promise(function(resolve, reject) {
            //setting an unique id to know which message belongs to which
            msgData._msgID = shortid.generate();

            //set up the listener, since there is no clean way to have a dynamically named function or variable to
            //identify the correct function to remove on cleanup, we are listening on and emitting the unique id as key
            event.on(msgData._msgID, function(nodeMasterData) {
                //remove listener to prevent memory leaks
                event.removeAllListeners(msgData._msgID);

                if (nodeMasterData.error) {
                    reject(`Error: ${nodeMasterData.error} occured on node: ${nodeMasterData.node_id}`)
                }
                else {
                    logger.trace(`cluster_master completed message transaction with node: ${node_id} for msg: ${msg} , msgData:`, msgData);
                    resolve(nodeMasterData)
                }
            });
            //send message
            logger.debug(`cluster_master communicating with node: ${node_id}`);
            logger.trace(`cluster_master communicating with node: ${node_id}, msg: ${msg}, msgData:`, msgData);
            messaging.send(node_id, msg, msgData);

            //reject if timeout has been reached
            setTimeout(function() {
                //remove listener to prevent memory leaks
                event.removeAllListeners(msgData._msgID);
                reject(`Error communicating with node: ${node_id}, Could not send msg: ${msg}, data: ${JSON.stringify(msgData)}`)
            }, configTimeout)
        })
    }

    function allocateWorker(job) {
        var ex_id = job.ex_id;
        var jobStr = JSON.stringify(job);
        var sortedNodes = _.sortByOrder(cluster_state, 'available', 'desc');

        //since its sorted each time, the first should always have the most available
        var workerNodeID = sortedNodes[0].node_id;

        var data = {job: jobStr, ex_id: ex_id, workers: 1, node_id: workerNodeID, assignment: 'worker'};

        return notifyNode(workerNodeID, 'cluster:workers:create', data);
    }

    //designed to allocate additional workers, not any future slicers
    function allocateWorkers(job, numOfWorkersRequested) {
        var ex_id = job.ex_id;
        var jobStr = JSON.stringify(job);
        var sortedNodes = _.orderBy(cluster_state, 'available', 'desc');

        var availWorkers = availableWorkers(false, true);

        var dispatch = makeDispatch();

        while (numOfWorkersRequested > 0 && availWorkers > 0) {

            for (var i = 0; i < sortedNodes.length; i++) {
                //each iteration check if it can allocate
                if (numOfWorkersRequested > 0 && availWorkers > 0) {
                    if (sortedNodes[i].available >= 1) {
                        dispatch.set(sortedNodes[i].node_id, 1);
                        availWorkers -= 1;
                        numOfWorkersRequested -= 1;
                    }
                }
                else {
                    break;
                }
            }
        }
        //if left over worker requests, enqueue them, queue works based off of id, so it redundantly references ex_id
        var workerData = {job: jobStr, id: ex_id, ex_id: ex_id, workers: 1, assignment: 'worker'};

        while (numOfWorkersRequested > 0) {
            logger.trace(`adding worker to pending queue for ex: ${ex_id}`);
            pendingWorkerRequests.enqueue(workerData);
            numOfWorkersRequested -= 1;
        }
        var results = [];

        _.forOwn(dispatch.getDispatch(), function(workerRequested, node_id) {
            var requestedWorkersData = {
                job: jobStr,
                id: ex_id,
                ex_id: ex_id,
                node_id: node_id,
                workers: workerRequested,
                assignment: 'worker'
            };

            results.push(
                notifyNode(node_id, 'cluster:workers:create', requestedWorkersData)
                    .catch(function(ev) {
                        logger.error(`An error has occurred in allocating : ${workerRequested} workers to node : ${node_id} , the worker request has been enqueued`);
                        pendingWorkerRequests.enqueue(requestedWorkersData);
                    })
            )
        });

        //this will resolve successfully if one worker was actually allocated
        return Promise.all(results);
    }

    function createSlicer(job, recover_execution, errorNodes) {
        var sortedNodes = _.orderBy(cluster_state, 'available', 'desc');
        var slicerNodeID = findNodeForSlicer(sortedNodes, errorNodes);

        //need to mutate job so that workers will know the specific port and hostname of the created slicer
        return findPort(slicerNodeID).then(function(portObj) {
            job.slicer_port = portObj.port;
            job.slicer_hostname = cluster_state[slicerNodeID].hostname;

            logger.debug(`node ${cluster_state[slicerNodeID].hostname} has been elected for slicer, listening on port: ${portObj.port}`);

            var ex_id = job.ex_id;
            var jobStr = JSON.stringify(job);

            var data = {
                job: jobStr,
                ex_id: ex_id,
                workers: 1,
                slicer_port: portObj.port,
                node_id: slicerNodeID,
                assignment: 'slicer',
                recover_execution: recover_execution
            };

            return notifyNode(slicerNodeID, 'cluster:slicer:create', data);
        })
    }


    function allocateSlicer(job, recover_execution) {
        var retryCount = 0;
        var errorObj = {};
        return new Promise(function(resolve, reject) {

            function retry(errorNodes) {
                createSlicer(job, recover_execution, errorNodes)
                    .then(function(results) {
                        resolve(results)
                    }).catch(function(err) {
                    retryCount += 1;

                    var nodeErr = err.split(':');
                    var nodeID = nodeErr[nodeErr.length - 1].trim();
                    errorNodes[nodeID] = nodeID;

                    if (retryCount >= 3) {
                        reject(err);
                    }
                    else {
                        retry(errorNodes)
                    }
                })
            }

            retry(errorObj);
        })
    }

    var schedulePendingRequests = _.debounce(function() {
        if (pendingWorkerRequests.size() && availableWorkers(false, true) >= 1) {
            var requestedWorker = pendingWorkerRequests.dequeue();
            var job = JSON.parse(requestedWorker.job);

            allocateWorkers(job, requestedWorker.workers)
                .catch(function(err) {
                    logger.error(`Error processing pending requests. ${err.stack}`);
                })

        }
    }, 500, {leading: false, trailing: true});

    event.on('cluster:available_workers', schedulePendingRequests);


    function shutdown() {
        logger.info("shutting down.");
        return Promise.resolve(true);
    }

    function iterate_state(cb) {
        return _.chain(cluster_state)
            .filter(function(node) {
                return node.state === 'connected'
            })
            .map(function(node) {
                var workers = node.active.filter(cb);

                return workers.map(function(worker) {
                    worker.node_id = node.node_id;
                    worker.hostname = node.hostname;
                    return worker;
                })
            })
            .flatten()
            .value();
    }

    function findAllWorkers() {
        return iterate_state(_.identity);
    }

    function findAllSlicers() {
        var allSlicers = function(worker) {
            return worker.assignment === 'slicer';
        };

        return iterate_state(allSlicers)
    }

    function findAllByExecutionID(ex_id) {
        var allByID = function(worker) {
            return worker.ex_id === ex_id;
        };

        return iterate_state(allByID)
    }

    function findWorkersByExecutionID(ex_id) {
        var workersByID = function(worker) {
            return worker.assignment === 'worker' && worker.ex_id === ex_id;
        };

        return iterate_state(workersByID)
    }

    function findSlicersByExecutionID(ex_id) {
        var slicerByID = function(worker) {
            return worker.assignment === 'slicer' && worker.ex_id === ex_id;
        };

        return iterate_state(slicerByID)
    }

    function removeWorkers(res, ex_id, workerNum) {
        var dispatch = makeDispatch();
        var workers = findWorkersByExecutionID(ex_id);
        var workerCount = workerNum;
        var workersData = workers.reduce(function(prev, curr) {
            if (!prev[curr.node_id]) {
                prev[curr.node_id] = 1;
            }
            else {
                prev[curr.node_id]++
            }
            prev._total++;

            return prev;
        }, {_total: 0});

        if (workerNum >= workersData._total && msg === 'remove') {
            res.status(400).json({
                error: `workers to be removed: ${workerNum} cannot be >= to current workers: ${workersData._total}`,
                message: error
            });
            return
        }

        while (workerCount) {
            _.forOwn(workersData, function(value, key) {
                if (key !== '_total') {
                    if (workersData[key] >= 1 && workerCount > 0) {
                        dispatch.set(key, 1);
                        workersData[key]--;
                        workerCount -= 1;
                    }
                }
            });
        }

        var nodes = dispatch.getDispatch();
        var results = _.map(nodes, function(val, key) {
            return notifyNode(key, 'cluster:workers:remove', {workers: val, ex_id: ex_id})
        });

        Promise.all(results)
            .then(function() {
                res.status(200).send(`${workerNum} workers have been released from job: ${ex_id}`)
            })
            .catch(function(err) {
                res.status(500).json({
                    error: JSON.stringify(err),
                    message: err
                });
            })
    }

    var api = {
        getClusterState: getClusterState,
        availableWorkers: availableWorkers,
        allWorkers: allWorkers,
        allNodes: allNodes,
        allocateWorker: allocateWorker,
        allocateWorkers: allocateWorkers,
        allocateSlicer: allocateSlicer,
        findNodesForJob: findNodesForJob,
        notifyNode: notifyNode,
        findAllSlicers: findAllSlicers,
        findAllWorkers: findAllWorkers,
        findAllByExecutionID: findAllByExecutionID,
        findWorkersByExecutionID: findWorkersByExecutionID,
        findSlicersByExecutionID: findSlicersByExecutionID,
        removeFromQueue: removeFromQueue,
        addToQueue: addToQueue,
        removeWorkers: removeWorkers,
        shutdown: shutdown
    };

    function _initialize() {
        // TODO: handle the initialization of the cluster and only
        // actually resolve the promise once everything is up and running.
        // Should be delays here as we wait for nodes to join and share their
        // state.
        logger.info("Initializing");
        return Promise.resolve(api);
    }

    return _initialize();
};

