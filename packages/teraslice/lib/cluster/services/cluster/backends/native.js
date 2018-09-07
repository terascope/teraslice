'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const Queue = require('@terascope/queue');
const parseError = require('@terascope/error-parser');
const stateUtils = require('./state-utils');
const Messaging = require('../../messaging');

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */

module.exports = function module(context, clusterMasterServer, executionService) {
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'native_cluster_service' });
    const pendingWorkerRequests = new Queue();
    const nodeDisconnectTimeout = context.sysconfig.teraslice.node_disconnect_timeout;
    const nodeStateInterval = context.sysconfig.teraslice.node_state_interval;
    const slicerAllocationAttempts = context.sysconfig.teraslice.slicer_allocation_attempts;
    const clusterState = {};
    const messaging = Messaging(context, logger);

    // temporary holding spot used to attach nodes that are non responsive or
    // disconnect before final cleanup
    const droppedNodes = {};

    messaging.register({
        event: 'node:online',
        identifier: 'node_id',
        callback: (data, nodeId) => {
            logger.info(`node ${nodeId} has connected`);
            // if a reconnect happens stop timer
            if (droppedNodes[nodeId]) {
                clearTimeout(droppedNodes[nodeId]);
                delete droppedNodes[nodeId];
            }
            logger.trace(`node ${nodeId} has state:`, data.payload);
            clusterState[nodeId] = data.payload;
            // if new node comes online, check if jobs need more workers
            events.emit('cluster:available_workers');
        }
    });

    messaging.register({
        event: 'node:state',
        callback: (stateMsg) => {
            const data = stateMsg.payload;
            clusterState[data.node_id] = data;
            logger.trace(`node ${data.node_id} state is being updated`, data);
            // check to see if we can provision any additional workers
            events.emit('cluster:available_workers');
        }
    });

    messaging.register({
        event: 'node:workers:over_allocated',
        callback: (requestData) => {
            logger.debug('over-allocated workers, returning them to pending worker request queue');
            pendingWorkerRequests.enqueue(requestData.payload);
        }
    });

    clusterMasterServer.onExecutionFinished((exId, err) => {
        if (err) {
            logger.error(`terminal error for execution: ${exId}, shutting down execution`, err);
        }
        pendingWorkerRequests.remove(exId);
        messaging.broadcast('cluster:execution:stop', { ex_id: exId });
    });

    messaging.register({
        event: 'network:error',
        callback: err => logger.error(`Error : cluster_master had an error with one of its connections, error: ${parseError(err)}`)
    });

    messaging.register({
        event: 'network:disconnect',
        identifier: 'node_id',
        callback: (msg, nodeId) => {
            if (clusterState[nodeId].active.length === 0) {
                logger.warn(`node ${nodeId} has disconnected`);
                delete clusterState[nodeId];
            } else {
                clusterState[nodeId].state = 'disconnected';
                const timer = setTimeout(() => {
                    _cleanUpNode(nodeId);
                }, nodeDisconnectTimeout);

                droppedNodes[nodeId] = timer;
            }
        }
    });

    setInterval(() => {
        logger.trace('cluster_master requesting state update for all nodes');
        messaging.broadcast('cluster:node:state');
    }, nodeStateInterval);

    function _cleanUpNode(nodeId) {
        // check workers and slicers
        const node = _checkNode(clusterState[nodeId]);
        // if disconnected node had a slicer, we stop the execution of each slicer on it
        // and mark it as failed
        if (node.hasSlicer) {
            _.forIn(node.slicerExecutions, (exId) => {
                const errMsg = `node ${nodeId} has been disconnected from cluster_master past the allowed timeout, it has an active slicer for execution: ${exId} which will be marked as terminated and shut down`;
                logger.error(errMsg);
                const metaData = executionService.executionMetaData(null, errMsg);
                pendingWorkerRequests.remove(exId);
                executionService.setExecutionStatus(exId, 'terminated', metaData);
                messaging.broadcast('cluster:execution:stop', { ex_id: exId });
            });
        }
        // for any other worker not part of what is being shutdown, we attempt to reallocate
        _.forIn(node.workerExecutions, (__, exId) => {
            // looking for unique ex_id's not in slicerJobID
            if (!node.slicerExecutions[exId]) {
                const activeWorkers = clusterState[nodeId].active;
                const numOfWorkers = activeWorkers.filter(worker => worker.ex_id === exId).length;
                executionService.getActiveExecution(exId)
                    .then(execution => addWorkers(execution, numOfWorkers));
            }
        });

        // cleanup key so we don't get ever growing obj
        delete droppedNodes[nodeId];
        delete clusterState[nodeId];
    }

    function getClusterState() {
        return _.cloneDeep(clusterState);
    }

    function _checkNode(node) {
        const obj = {
            hasSlicer: false,
            numOfSlicers: 0,
            slicerExecutions: {},
            workerExecutions: {},
            numOfWorkers: 0,
            id: node.id,
            available: node.available
        };

        return node.active.reduce((prev, curr) => {
            if (curr.assignment === 'execution_controller') {
                prev.hasSlicer = true;
                prev.numOfSlicers += 1;
                prev.slicerExecutions[curr.ex_id] = curr.ex_id;
            }

            if (curr.assignment === 'worker') {
                prev.numOfWorkers += 1;
                // if not resgistered, set it to one, if so then increment it
                if (!prev.workerExecutions[curr.ex_id]) {
                    prev.workerExecutions[curr.ex_id] = 1;
                } else {
                    prev.workerExecutions[curr.ex_id] += 1;
                }
            }

            return prev;
        }, obj);
    }

    function _findNodeForSlicer(stateArray, errorNodes) {
        let slicerNode = null;
        for (let i = 0; i < stateArray.length; i += 1) {
            if (stateArray[i].state === 'connected' && stateArray[i].available > 0 && !errorNodes[stateArray[i].node_id]) {
                const node = _checkNode(stateArray[i]);

                if (!node.hasSlicer) {
                    slicerNode = stateArray[i].node_id;
                    break;
                }
            }
        }

        // if all nodes have a slicer
        if (!slicerNode) {
            // list is already sorted by num available since stateArray is sorted
            slicerNode = stateArray[0].node_id;
        }

        return slicerNode;
    }

    function _findNodesForExecution(exId, slicerOnly) {
        const nodes = [];
        _.forOwn(clusterState, (node) => {
            if (node.state !== 'disconnected') {
                const hasJob = node.active.filter((worker) => {
                    if (slicerOnly) {
                        return worker.ex_id === exId && worker.assignment === 'execution_controller';
                    }

                    return worker.ex_id === exId;
                });

                if (hasJob.length >= 1) {
                    nodes.push({
                        node_id: node.node_id,
                        ex_id: exId,
                        hostname: node.hostname,
                        workers: hasJob
                    });
                }
            }
        });

        return nodes;
    }

    function _availableWorkers(all, forceCheck) {
        let num = 0;
        // determine which key to search for in cluster state
        if (pendingWorkerRequests.size() === 0 || forceCheck) {
            const key = all ? 'total' : 'available';

            _.forOwn(clusterState, (node) => {
                if (node.state === 'connected') {
                    num += node[key];
                }
            });
        }

        return num;
    }

    function _findPort(nodeId) {
        return messaging.send({
            to: 'node_master',
            address: nodeId,
            message: 'cluster:node:get_port',
            response: true
        });
    }

    function _makeDispatch() {
        const methods = {};
        const dispatch = {};

        methods.set = (nodeId, numOfWorkers) => {
            if (dispatch[nodeId]) {
                dispatch[nodeId] += numOfWorkers;
            } else {
                dispatch[nodeId] = numOfWorkers;
            }
        };
        methods.getDispatch = () => dispatch;

        return methods;
    }

    // designed to allocate additional workers, not any future slicers
    function allocateWorkers(execution, numOfWorkersRequested) {
        const exId = execution.ex_id;
        const jobId = execution.job_id;
        const jobStr = JSON.stringify(execution);
        const sortedNodes = _.orderBy(clusterState, 'available', 'desc');
        let workersRequested = numOfWorkersRequested;
        let availWorkers = _availableWorkers(false, true);

        const dispatch = _makeDispatch();

        while (workersRequested > 0 && availWorkers > 0) {
            for (let i = 0; i < sortedNodes.length; i += 1) {
                // each iteration check if it can allocate
                if (workersRequested > 0 && availWorkers > 0) {
                    if (sortedNodes[i].available >= 1) {
                        dispatch.set(sortedNodes[i].node_id, 1);
                        availWorkers -= 1;
                        workersRequested -= 1;
                    }
                } else {
                    break;
                }
            }
        }
        // if left over worker requests, enqueue them, queue works based off of id
        // so it redundantly references ex_id

        const workerData = {
            job: jobStr,
            id: exId,
            ex_id: exId,
            job_id: jobId,
            workers: 1,
            assignment: 'worker'
        };

        while (workersRequested > 0) {
            logger.trace(`adding worker to pending queue for ex: ${exId}`);
            pendingWorkerRequests.enqueue(workerData);
            workersRequested -= 1;
        }
        const results = [];

        _.forOwn(dispatch.getDispatch(), (workerCount, nodeId) => {
            const requestedWorkersData = {
                job: jobStr,
                id: exId,
                ex_id: exId,
                job_id: jobId,
                workers: workerCount,
                assignment: 'worker'
            };

            results.push(messaging.send({
                to: 'node_master',
                address: nodeId,
                message: 'cluster:workers:create',
                payload: requestedWorkersData,
                response: true
            })
                .catch(() => {
                    logger.error(`An error has occurred in allocating : ${workerCount} workers to node : ${nodeId} , the worker request has been enqueued`);
                    pendingWorkerRequests.enqueue(requestedWorkersData);
                }));
        });

        // this will resolve successfully if one worker was actually allocated
        return Promise.all(results);
    }

    function _createSlicer(job, errorNodes) {
        const sortedNodes = _.orderBy(clusterState, 'available', 'desc');
        const slicerNodeID = _findNodeForSlicer(sortedNodes, errorNodes);

        // need to mutate job so that workers will know the specific port and
        // hostname of the created slicer
        return _findPort(slicerNodeID)
            .then((portObj) => {
                job.slicer_port = portObj.port;
                job.slicer_hostname = clusterState[slicerNodeID].hostname;

                logger.debug(`node ${clusterState[slicerNodeID].hostname} has been elected for slicer, listening on port: ${portObj.port}`);
                const exId = job.ex_id;
                const jobId = job.job_id;
                const jobStr = JSON.stringify(job);
                const data = {
                    job: jobStr,
                    ex_id: exId,
                    job_id: jobId,
                    workers: 1,
                    slicer_port: portObj.port,
                    node_id: slicerNodeID,
                    assignment: 'execution_controller'
                };

                return messaging.send({
                    to: 'node_master',
                    address: slicerNodeID,
                    message: 'cluster:execution_controller:create',
                    payload: data,
                    response: true
                })
                    .catch((err) => {
                        const errMsg = parseError(err);
                        logger.error(`failed to allocate execution_controller to ${slicerNodeID}, error: ${errMsg}`);
                        errorNodes[slicerNodeID] = errMsg;
                        return Promise.reject(errMsg);
                    });
            });
    }


    function allocateSlicer(job) {
        let retryCount = 0;
        const errorNodes = {};
        return new Promise(((resolve, reject) => {
            function retry() {
                _createSlicer(job, errorNodes)
                    .then((results) => {
                        resolve(results);
                    })
                    .catch(() => {
                        retryCount += 1;
                        if (retryCount >= slicerAllocationAttempts) {
                            reject(`failed to allocate execution_controller to nodes: ${JSON.stringify(errorNodes)}`);
                        } else {
                            retry(errorNodes);
                        }
                    });
            }

            retry();
        }));
    }

    const schedulePendingRequests = _.debounce(() => {
        if (pendingWorkerRequests.size() && _availableWorkers(false, true) >= 1) {
            const requestedWorker = pendingWorkerRequests.dequeue();
            const job = JSON.parse(requestedWorker.job);

            allocateWorkers(job, requestedWorker.workers)
                .catch((err) => {
                    logger.error(`Error processing pending requests. ${err.stack}`);
                });
        }
    }, 500, { leading: false, trailing: true });

    events.on('cluster:available_workers', schedulePendingRequests);

    function shutdown() {
        logger.info('shutting down');
        return Promise.resolve(true);
    }

    function addWorkers(execution, workerNum) {
        const workerData = {
            job: JSON.stringify(execution),
            id: execution.ex_id,
            ex_id: execution.ex_id,
            job_id: execution.job_id,
            workers: workerNum,
            assignment: 'worker'
        };
        pendingWorkerRequests.enqueue(workerData);
        return { action: 'enqueued', ex_id: execution.ex_id, workerNum };
    }

    function setWorkers(execution, workerNum) {
        const totalWorker = stateUtils.findWorkersByExecutionID(
            clusterState,
            execution.ex_id
        ).length;
        if (totalWorker > workerNum) {
            const removedWorkersCount = totalWorker - workerNum;
            return removeWorkers(execution.ex_id, removedWorkersCount);
        }
        if (totalWorker < workerNum) {
            const addWorkersCount = workerNum - totalWorker;
            return addWorkers(execution, addWorkersCount);
        }
        // if they are equal then no work needs to be done
        return { action: 'set', ex_id: execution.ex_id, workerNum };
    }

    function removeWorkers(exId, workerNum) {
        const dispatch = _makeDispatch();
        const workers = stateUtils.findWorkersByExecutionID(clusterState, exId);
        let workerCount = workerNum;
        const workersData = workers.reduce((prev, curr) => {
            if (!prev[curr.node_id]) {
                prev[curr.node_id] = 1;
            } else {
                prev[curr.node_id] += 1;
            }
            prev._total += 1;

            return prev;
        }, { _total: 0 });

        if (workerNum >= workersData._total) {
            const errMsg = `workers to be removed: ${workerNum} cannot be >= to current workers: ${workersData._total}`;
            logger.error(errMsg);
            const errReponse = { code: 400, message: errMsg, error: errMsg };
            return Promise.reject(errReponse);
        }

        function stateForDispatch(__, key) {
            if (key !== '_total') {
                if (workersData[key] >= 1 && workerCount > 0) {
                    dispatch.set(key, 1);
                    workersData[key] -= 1;
                    workerCount -= 1;
                }
            }
        }

        while (workerCount) {
            _.forOwn(workersData, stateForDispatch);
        }

        const nodes = dispatch.getDispatch();
        const results = _.map(nodes, (val, key) => messaging.send({
            to: 'node_master',
            address: key,
            message: 'cluster:workers:remove',
            ex_id: exId,
            payload: { workers: val },
            response: true
        }));

        return Promise.all(results)
            .then(() => ({ action: 'remove', ex_id: exId, workerNum }))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error while releasing workers from job ${exId}, error: ${errMsg}`);
                return Promise.reject(errMsg);
            });
    }

    function _notifyNodesWithExecution(exId, messageData, excludeNode, response) {
        return new Promise(((resolve, reject) => {
            let nodes = _findNodesForExecution(exId);
            if (excludeNode) {
                nodes = nodes.filter(node => node.hostname !== excludeNode);
            } else if (messageData.message !== 'cluster:execution:stop' && nodes.length === 0) {
                // exclude node is only in regards to a shutdown on the cluster_master, which
                // already receives the shutdown notice so it can be empty, in all other
                // circumstances if the node list length is zero then reject
                reject({ message: `Could not find active execution processes for ex_id: ${exId}`, code: 404 });
                return;
            }

            Promise.map(nodes, (node) => {
                const sendingMsg = Object.assign({}, messageData, {
                    to: 'node_master',
                    address: node.node_id,
                    ex_id: exId,
                    response
                });

                return messaging.send(sendingMsg);
            })
                .then(() => {
                    resolve(true);
                })
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error('could not notify cluster', errMsg);
                    reject(errMsg);
                });
        }));
    }

    function readyForAllocation() {
        return _availableWorkers() >= 2;
    }

    function clusterAvailable() {}

    function stopExecution(exId, timeout, exclude) {
        // we are allowing stopExecution to be non blocking, we block at api level
        const response = false;
        const excludeNode = exclude || null;
        pendingWorkerRequests.remove(exId);
        const sendingMessage = { message: 'cluster:execution:stop' };
        if (timeout) {
            sendingMessage.timeout = timeout;
        }
        return _notifyNodesWithExecution(exId, sendingMessage, excludeNode, response);
    }

    const api = {
        getClusterState,
        allocateWorkers,
        allocateSlicer,
        shutdown,
        stopExecution,
        removeWorkers,
        addWorkers,
        setWorkers,
        readyForAllocation,
        clusterAvailable
    };

    function _initialize() {
        logger.info('Native clustering initializing');
        const server = clusterMasterServer.httpServer;
        return Promise.resolve()
            .then(() => messaging.listen({ server }))
            .then(() => Promise.resolve(api));
    }

    return _initialize();
};
