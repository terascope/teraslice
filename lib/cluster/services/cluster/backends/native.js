'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const shortid = require('shortid');
const Queue = require('queue');
const parseError = require('../../../../utils/error_utils').parseError;

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */

module.exports = function module(context, messaging, executionService) {
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'native_cluster_service' });
    const configTimeout = context.sysconfig.teraslice.network_timeout;
    const pendingWorkerRequests = new Queue();
    const nodeDisconnectTimeout = context.sysconfig.teraslice.node_disconnect_timeout;
    const nodeStateInterval = context.sysconfig.teraslice.node_state_interval;
    const clusterState = {};
    const clusterStats = {
        slicer: {
            processed: 0,
            failed: 0,
            queued: 0,
            job_duration: 0,
            workers_joined: 0,
            workers_disconnected: 0,
            workers_reconnected: 0
        }
    };

    // temporary holding spot used to attach nodes that are non responsive or
    // disconnect before final cleanup
    const droppedNodes = {};

    messaging.register('node:online', 'node_id', (data, nodeId) => {
        logger.info(`node ${nodeId} has connected`);
        // messaging module will join connection

        // if a reconnect happens stop timer
        if (droppedNodes[nodeId]) {
            clearTimeout(droppedNodes[nodeId]);
            delete droppedNodes[nodeId];
        }
        logger.trace(`node ${nodeId} has state:`, data);
        clusterState[nodeId] = data;
        // if new node comes online, check if jobs need more workers
        events.emit('cluster:available_workers');
    });

    messaging.register('node:state', (data) => {
        clusterState[data.node_id] = data;
        logger.debug(`node ${data.node_id} state is being updated`);
        logger.trace(`node ${data.node_id} has updated state:`, data);
        events.emit('cluster:available_workers');
    });

    // TODO this will become unneeded in message refactor
    messaging.register('node:message:processed', (data) => {
        // emitting the unique msg id to allow easier listener cleanup
        logger.debug(`node message ${data._msgID} has been processed`);
        events.emit(data._msgID, data);
    });

    messaging.register('node:workers:over_allocated', (requestData) => {
        logger.debug('over-allocated workers, returning them to pending worker request queue');
        pendingWorkerRequests.enqueue(requestData);
    });

    messaging.register('slicer:job:finished', (data) => {
        // remove any pending worker request on completed jobs
        logger.debug(`job for ex_id: ${data.ex_id} has finished, removing any from pending queue`);
        logger.trace(`job ex_id: ${data.ex_id} has finished,  message:`, data);
        pendingWorkerRequests.remove(data.ex_id);
        messaging.send('cluster:job:stop', data);
    });

    messaging.register('slicer:recovery:failed', (data) => {
        // remove any pending worker request
        logger.debug(`slicer for execution: ${data.ex_id} has failed on recovery`);
        pendingWorkerRequests.remove(data.ex_id);
        messaging.send('cluster:job:stop', { ex_id: data.ex_id });
    });

    messaging.register('job:error:terminal', (data) => {
        logger.debug(`terminal job error for execution: ${data.ex_id}, canceling job`);
        const metaData = _errorMetaData(data);
        pendingWorkerRequests.remove(data.ex_id);
        messaging.send('cluster:job:stop', { ex_id: data.ex_id });
        executionService.setExecutionStatus(data.ex_id, 'failed', metaData);
    });

    messaging.register('network:error', (err) => {
        const errMsg = parseError(err);
        logger.error('Error : cluster_master had an error with one of its connections', errMsg);
    });

    messaging.register('network:disconnect', ['node_id'], (msg, id, identifier) => {
        if (identifier) {
            // is a node_id
            if (identifier === 'node_id' && clusterState[id]) {
                const nodeId = id;
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
        } else {
            logger.error(`cluster_master got a disconnect event on a unidentified connection. might be a network/service communication issue, msg: ${msg}`);
        }
    });

    messaging.register('cluster:analytics', (msg) => {
        if (!clusterStats[msg.kind]) {
            logger.warn(`unrecognized cluster stats: ${msg.kind}`);
            return;
        }
        _.forOwn(msg.stats, (value, field) => {
            if (clusterStats[msg.kind][field] !== undefined) {
                clusterStats[msg.kind][field] += value;
            }
        });
    });

    setInterval(() => {
        logger.trace('cluster_master requesting state update for all nodes');
        messaging.send('cluster:node:state');
    }, nodeStateInterval);

    function _cleanUpNode(nodeId) {
        // check workers and slicers
        const node = _checkNode(clusterState[nodeId]);
        // if disconnected node had a slicer, we stop the execution of each slicer on it
        // and mark it as failed
        if (node.hasSlicer) {
            _.forIn(node.slicerExecutions, (exId) => {
                logger.error(`node ${nodeId} has disconnected with active slicer for job: ${exId}, marking as failed and shutting down job`);
                const data = { ex_id: exId, error: 'node_master where slicer resided has disconnected' };
                const metaData = _errorMetaData(data);
                pendingWorkerRequests.remove(exId);
                executionService.setExecutionStatus(data.ex_id, 'failed', metaData);
                messaging.send('cluster:job:stop', { ex_id: exId });
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

    function getClusterStats() {
        return _.cloneDeep(clusterStats);
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
            if (curr.assignment === 'slicer') {
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
        // TODO but what about disconnected nodes?
        _.forOwn(clusterState, (node) => {
            const hasJob = node.active.filter((worker) => {
                if (slicerOnly) {
                    return worker.ex_id === exId && worker.assignment === 'slicer';
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
        return _notifyNode(nodeId, 'cluster:node:get_port', {});
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

    function _notifyNode(nodeId, msg, msgData) {
        return new Promise(((resolve, reject) => {
            // setting an unique id to know which message belongs to which
            msgData._msgID = shortid.generate();
            // set up the listener, since there is no clean way to have a
            // dynamically named function or variable to identify the
            // correct function to remove on cleanup, we are listening
            // on and emitting the unique id as key
            events.on(msgData._msgID, (nodeMasterData) => {
                // remove listener to prevent memory leaks
                events.removeAllListeners(msgData._msgID);
                if (nodeMasterData.error) {
                    reject(`Error: ${nodeMasterData.error} occured on node: ${nodeMasterData.node_id}`);
                } else {
                    logger.trace(`cluster_master completed message transaction with node: ${nodeId} for msg: ${msg} , msgData:`, msgData);
                    resolve(nodeMasterData);
                }
            });
            // send message
            logger.debug(`cluster_master communicating with node: ${nodeId}`);
            logger.trace(`cluster_master communicating with node: ${nodeId}, msg: ${msg}, msgData:`, msgData);
            messaging.send(nodeId, msg, msgData);

            // reject if timeout has been reached
            setTimeout(() => {
                // remove listener to prevent memory leaks
                events.removeAllListeners(msgData._msgID);
                reject(`timeout error while communicating with node: ${nodeId}, msg: ${msg}, data: ${JSON.stringify(msgData)}`);
            }, configTimeout);
        }));
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

            results.push(
                _notifyNode(nodeId, 'cluster:workers:create', requestedWorkersData)
                    .catch(() => {
                        logger.error(`An error has occurred in allocating : ${workerCount} workers to node : ${nodeId} , the worker request has been enqueued`);
                        pendingWorkerRequests.enqueue(requestedWorkersData);
                    })
            );
        });

        // this will resolve successfully if one worker was actually allocated
        return Promise.all(results);
    }

    function _createSlicer(job, recoverExecution, errorNodes) {
        const sortedNodes = _.orderBy(clusterState, 'available', 'desc');
        const slicerNodeID = _findNodeForSlicer(sortedNodes, errorNodes);

        // need to mutate job so that workers will know the specific port and
        // hostname of the created slicer
        return _findPort(slicerNodeID).then((portObj) => {
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
                assignment: 'slicer',
                recover_execution: recoverExecution
            };

            return _notifyNode(slicerNodeID, 'cluster:slicer:create', data);
        });
    }


    function allocateSlicer(job, recoverExecution) {
        let retryCount = 0;
        const errorObj = {};
        return new Promise(((resolve, reject) => {
            function retry(errorNodes) {
                _createSlicer(job, recoverExecution, errorNodes)
                    .then((results) => {
                        resolve(results);
                    })
                    .catch((err) => {
                        retryCount += 1;

                        const nodeErr = err.split(':');
                        const nodeID = nodeErr[nodeErr.length - 1].trim();
                        errorNodes[nodeID] = nodeID;
                        // TODO: make this configurable
                        if (retryCount >= 3) {
                            reject(err);
                        } else {
                            retry(errorNodes);
                        }
                    });
            }

            retry(errorObj);
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


    function _iterateState(cb) {
        return _.chain(clusterState)
            .filter(node => node.state === 'connected')
            .map((node) => {
                const workers = node.active.filter(cb);

                return workers.map((worker) => {
                    worker.node_id = node.node_id;
                    worker.hostname = node.hostname;
                    return worker;
                });
            })
            .flatten()
            .value();
    }

    function findAllSlicers() {
        return _iterateState(worker => worker.assignment === 'slicer');
    }

    function findWorkersByExecutionID(exId) {
        return _iterateState(worker => worker.assignment === 'worker' && worker.ex_id === exId);
    }

    function findSlicersByExecutionID(exId) {
        return _iterateState(worker => worker.assignment === 'slicer' && worker.ex_id === exId);
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
        const totalWorker = findWorkersByExecutionID(execution.ex_id).length;
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
        const workers = findWorkersByExecutionID(exId);
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
        const results = _.map(nodes, (val, key) => _notifyNode(key, 'cluster:workers:remove', { workers: val, ex_id: exId }));

        return Promise.all(results)
            .then(() => ({ action: 'remove', ex_id: exId, workerNum }))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error while releasing workers from job ${exId}, error: ${errMsg}`);
                return Promise.reject(errMsg);
            });
    }

    function _notifyNodesWithExecution(exId, message, slicerOnly, excludeNode) {
        return new Promise(((resolve, reject) => {
            const requests = [];
            let nodes = _findNodesForExecution(exId, slicerOnly);
            if (excludeNode) {
                nodes = nodes.filter(node => node.hostname !== excludeNode);
            }
            nodes.forEach((node) => {
                const messageNode = _notifyNode(node.node_id, message, {
                    ex_id: exId
                });

                requests.push(messageNode);
            });

            return Promise.all(requests)
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

    function getSlicerStats(exId) {
        return new Promise(((resolve, reject) => {
            let list;
            let timer;
            const nodeQueries = [];

            if (exId) {
                list = findSlicersByExecutionID(exId);
            } else {
                list = findAllSlicers();
            }
            const numberOfCalls = list.length;

            if (numberOfCalls === 0) {
                if (exId) {
                    reject({ message: `Could not find active slicer for ex_id: ${exId}`, code: 404 });
                } else {
                    // for the general slicer stats query, just return a empty array
                    resolve([]);
                }
            }

            _.each(list, (slicer) => {
                const msg = { ex_id: slicer.ex_id };
                nodeQueries.push(_notifyNode(slicer.node_id, 'cluster:slicer:analytics', msg));
            });

            Promise.all(nodeQueries)
                .then((results) => {
                    clearTimeout(timer);
                    resolve(results.map(slicer => slicer.data));
                })
                .catch(err => reject({ message: parseError(err), code: 500 }));

            timer = setTimeout(() => {
                reject({ message: 'Timeout has occurred for query', code: 500 });
            }, context.sysconfig.teraslice.network_timeout);
        }));
    }

    function readyForAllocation() {
        return _availableWorkers() >= 2;
    }
    // TODO: when and where should this be used?
    function clusterAvailable() {}

    function _errorMetaData(data) {
        const metaData = { _has_errors: 'true', _slicer_stats: data.slicer_stats };
        logger.error(`job ${data.ex_id} has failed to complete`);

        if (data.error) {
            metaData._failureReason = data.error;
        }
        return metaData;
    }

    function stopExecution(exId) {
        pendingWorkerRequests.remove(exId);
        return _notifyNodesWithExecution(exId, 'cluster:job:stop', false, null);
    }

    function pauseExecution(exId) {
        return _notifyNodesWithExecution(exId, 'cluster:job:pause', true, null);
    }

    function resumeExecution(exId) {
        return _notifyNodesWithExecution(exId, 'cluster:job:resume', true, null);
    }

    const api = {
        getClusterState,
        getClusterStats,
        getSlicerStats,
        allocateWorkers,
        allocateSlicer,
        shutdown,
        stopExecution,
        pauseExecution,
        resumeExecution,
        removeWorkers,
        addWorkers,
        setWorkers,
        readyForAllocation,
        clusterAvailable
    };

    function _initialize() {
        logger.info('Initializing');
        return Promise.resolve(api);
    }

    return _initialize();
};

