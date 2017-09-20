'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const shortid = require('shortid');
const Queue = require('queue');
const parseError = require('../../utils/error_utils').parseError;
const sendError = require('../../utils/api_utils').sendError;

module.exports = function module(context, server) {
    const messaging = context.messaging;
    const events = context.foundation.getEventEmitter();
    const logger = context.foundation.makeLogger({ module: 'cluster_service' });
    const configTimeout = context.sysconfig.teraslice.network_timeout;
    const pendingWorkerRequests = new Queue();
    let moderator = null;
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

    // events can be fired from anything that instantiates a client, such as stores
    events.on('getClient:config_error', terminalShutdown);
    events.on('jobs_service:verify_assets', verifyAssets);
    // to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    function terminalShutdown(errEV) {
        logger.error(`Terminal error: ${errEV.err}`);
        messaging.send({ message: 'cluster:error:terminal' });
    }

    function verifyAssets(assets) {
        const msgObj = _.assign({ message: 'jobs_service:verify_assets' }, assets);
        messaging.send(msgObj);
    }

    /*
     * Should take note that since job_service is instantiated after cluster service,
     * the mode to interact with job_service is through events emitters
     */

    messaging.register('process:SIGTERM', noOP);
    messaging.register('process:SIGINT', noOP);

    messaging.register('worker:shutdown', () => {
        events.emit('cluster_master:shutdown');
    });

    messaging.register('assets:preloaded', (msg) => {
        events.emit(msg.identifier, msg);
    });

    messaging.register('moderator:online', 'moderator', (modMessage) => {
        if (!moderator) {
            moderator = {};
        }
        const type = modMessage.moderator.split(':')[1];
        moderator[type] = true;
        // registers moderator to socket behind the scenes
        logger.info(`moderator for ${type} has connected to cluster_master`);
    });

    messaging.register('moderator:pause_jobs', (connectionList) => {
        logger.error('cluster master getting the pause job event');
        logger.debug('cluster_master receiving pause job events from moderator', connectionList);
        events.emit('moderate_jobs:pause', connectionList);
    });

    messaging.register('moderator:resume_jobs', (connectionList) => {
        logger.debug('cluster_master receiving resume job events from moderator', connectionList);
        events.emit('moderate_jobs:resume', connectionList);
    });

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
        pendingWorkerRequests.remove(data.ex_id);
        messaging.send('cluster:job:stop', { ex_id: data.ex_id });
        if (!data.markedJob) {
            events.emit('cluster:job_failure', data);
        }
    });

    messaging.register('network:error', (err) => {
        const errMsg = parseError(err);
        logger.error('Error : cluster_master had an error with one of its connections', errMsg);
    });

    messaging.register('network:disconnect', ['node_id', 'moderator'], (msg, id, identifier) => {
        if (identifier) {
            // is a node_id
            if (identifier === 'node_id' && clusterState[id]) {
                const nodeId = id;
                if (clusterState[nodeId].active.length === 0) {
                    logger.warn(`node ${nodeId} has disconnected`);
                    delete clusterState[nodeId];
                } else {
                    clusterState[nodeId].state = 'disconnected';
                    // FIXME: the timer should be configurable
                    const timer = setTimeout(() => {
                        cleanUpNode(nodeId);
                    }, 5000);

                    droppedNodes[nodeId] = timer;
                }
            }

            if (identifier === 'moderator') {
                logger.warn(`Moderator ${id} has disconnected from cluster_master`);
                delete moderator[id];
                if (Object.keys(moderator).length === 0) {
                    moderator = null;
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

    messaging.initialize({ server });

    setInterval(() => {
        logger.trace('cluster_master requesting state update for all nodes');
        messaging.send('cluster:node:state');
    }, 5000);


    function cleanUpNode(nodeId) {
        // check workers and slicers
        const node = checkNode(clusterState[nodeId]);

        if (node.hasSlicer) {
            _.forIn(node.slicerJobID, (exId) => {
                logger.error(`node ${nodeId} has disconnected with active slicer for job: ${exId}, marking as failed and shutting down job`);

                const data = { ex_id: exId, error: 'node_master where slicer resided has disconnected' };
                pendingWorkerRequests.remove(exId);
                events.emit('cluster:job_failure', data);
                messaging.send('cluster:job:stop', { ex_id: exId });
            });
        }

        _.forIn(node.workerJobID, (__, exId) => {
            // looking for unique ex_id's not in slicerJobID
            if (!node.slicerJobID[exId]) {
                // emitting to job service, since cluster is instantiated before
                // job service is ready
                const numOfWorkers = clusterState[nodeId]
                    .active.filter(worker => worker.ex_id === exId).length;
                // TODO: investigate the need for id
                events.emit('cluster_service:cleanup_job', {
                    ex_id: exId,
                    id: exId,
                    node_id: nodeId,
                    workers: numOfWorkers,
                    assignment: 'worker'
                });
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

    function checkNode(node) {
        const obj = {
            hasSlicer: false,
            numOfSlicers: 0,
            slicerJobID: {},
            workerJobID: {},
            numOfWorkers: 0,
            id: node.id,
            available: node.available
        };

        return node.active.reduce((prev, curr) => {
            if (curr.assignment === 'slicer') {
                prev.hasSlicer = true;
                prev.numOfSlicers += 1;
                prev.slicerJobID[curr.ex_id] = curr.ex_id;
            }

            if (curr.assignment === 'worker') {
                prev.numOfWorkers += 1;
                // if not resgistered, set it to one, if so then increment it
                if (!prev.workerJobID[curr.ex_id]) {
                    prev.workerJobID[curr.ex_id] = 1;
                } else {
                    prev.workerJobID[curr.ex_id] += 1;
                }
            }

            return prev;
        }, obj);
    }

    function findNodeForSlicer(stateArray, errorNodes) {
        let slicerNode = null;
        for (let i = 0; i < stateArray.length; i += 1) {
            if (stateArray[i].state === 'connected' && stateArray[i].available > 0 && !errorNodes[stateArray[i].node_id]) {
                const node = checkNode(stateArray[i]);

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

    function findNodesForJob(exId, slicerOnly) {
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

    function availableWorkers(all, forceCheck) {
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

    function allWorkers() {
        // total number of workers function
        return availableWorkers(true);
    }

    function allNodes() {
        return Object.keys(clusterState);
    }

    function findPort(nodeId) {
        return notifyNode(nodeId, 'cluster:node:get_port', {});
    }

    function removeFromQueue(id, key) {
        pendingWorkerRequests.remove(id, key);
    }

    function addToQueue(data) {
        pendingWorkerRequests.enqueue(data);
    }

    function makeDispatch() {
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

    function notifyNode(nodeId, msg, msgData) {
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

    function allocateWorker(job) {
        const exId = job.ex_id;
        const jobId = job.job_id;
        const jobStr = JSON.stringify(job);
        const sortedNodes = _.sortByOrder(clusterState, 'available', 'desc');

        // since its sorted each time, the first should always have the most available
        const workerNodeID = sortedNodes[0].node_id;

        const data = {
            job: jobStr,
            ex_id: exId,
            job_id: jobId,
            workers: 1,
            node_id: workerNodeID,
            assignment: 'worker'
        };

        return notifyNode(workerNodeID, 'cluster:workers:create', data);
    }

    // designed to allocate additional workers, not any future slicers
    function allocateWorkers(job, numOfWorkersRequested) {
        const exId = job.ex_id;
        const jobId = job.job_id;
        const jobStr = JSON.stringify(job);
        const sortedNodes = _.orderBy(clusterState, 'available', 'desc');
        let workersRequested = numOfWorkersRequested;
        let availWorkers = availableWorkers(false, true);

        const dispatch = makeDispatch();

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
                node_id: nodeId,
                workers: workerCount,
                assignment: 'worker'
            };

            results.push(
                notifyNode(nodeId, 'cluster:workers:create', requestedWorkersData)
                    .catch(() => {
                        logger.error(`An error has occurred in allocating : ${workerCount} workers to node : ${nodeId} , the worker request has been enqueued`);
                        pendingWorkerRequests.enqueue(requestedWorkersData);
                    })
            );
        });

        // this will resolve successfully if one worker was actually allocated
        return Promise.all(results);
    }

    function createSlicer(job, recoverExecution, errorNodes) {
        const sortedNodes = _.orderBy(clusterState, 'available', 'desc');
        const slicerNodeID = findNodeForSlicer(sortedNodes, errorNodes);

        // need to mutate job so that workers will know the specific port and
        // hostname of the created slicer
        return findPort(slicerNodeID).then((portObj) => {
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

            return notifyNode(slicerNodeID, 'cluster:slicer:create', data);
        });
    }


    function allocateSlicer(job, recoverExecution) {
        let retryCount = 0;
        const errorObj = {};
        return new Promise(((resolve, reject) => {
            function retry(errorNodes) {
                createSlicer(job, recoverExecution, errorNodes)
                    .then((results) => {
                        resolve(results);
                    })
                    .catch((err) => {
                        retryCount += 1;

                        const nodeErr = err.split(':');
                        const nodeID = nodeErr[nodeErr.length - 1].trim();
                        errorNodes[nodeID] = nodeID;

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
        if (pendingWorkerRequests.size() && availableWorkers(false, true) >= 1) {
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
        logger.info('shutting down.');
        return Promise.resolve(true);
    }

    function iterateState(cb) {
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

    function findAllWorkers() {
        return iterateState(_.identity);
    }

    function findAllSlicers() {
        return iterateState(worker => worker.assignment === 'slicer');
    }

    function findAllByExecutionID(exId) {
        return iterateState(worker => worker.ex_id === exId);
    }

    function findWorkersByExecutionID(exId) {
        return iterateState(worker => worker.assignment === 'worker' && worker.ex_id === exId);
    }

    function findSlicersByExecutionID(exId) {
        return iterateState(worker => worker.assignment === 'slicer' && worker.ex_id === exId);
    }

    // currently if job is submitted before moderator comes online
    // job will be made but paused later
    function checkModerator(connectionList) {
        if (!moderator) {
            return Promise.resolve(true);
        }

        // connectionList is array of arrays =>
        // [['elasticsearch', [default, conn2], ['otherDB', [default, conn2]]]
        return Promise.map(connectionList, (conn) => {
            // only check if right moderator is online
            if (!moderator[conn[0]]) {
                return Promise.resolve(true);
            }
            return notifyNode(`moderator:${conn[0]}`, 'cluster:moderator:connection_ok', { data: conn[1] });
        });
    }
    // FIXME: remove res from function, it should not be using http
    function removeWorkers(res, exId, workerNum) {
        const dispatch = makeDispatch();
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
        // FIXME: msg does not exist, it should throw and api service should respond
        if (workerNum >= workersData._total && msg === 'remove') {
            sendError(res, 400, `workers to be removed: ${workerNum} cannot be >= to current workers: ${workersData._total}`);
            return;
        }
        // FIXME: pull out function from loop
        while (workerCount) {
            _.forOwn(workersData, (value, key) => {
                if (key !== '_total') {
                    if (workersData[key] >= 1 && workerCount > 0) {
                        dispatch.set(key, 1);
                        workersData[key] -= 1;
                        workerCount -= 1;
                    }
                }
            });
        }

        const nodes = dispatch.getDispatch();
        const results = _.map(nodes, (val, key) => notifyNode(key, 'cluster:workers:remove', { workers: val, ex_id: exId }));

        Promise.all(results)
            .then(() => {
                res.status(200).send(`${workerNum} workers have been released from job: ${exId}`);
            })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error while releasing workers from job ${exId}, error: ${errMsg}`);
                sendError(res, 500, errMsg);
            });
    }

    function broadcast(msg, data) {
        messaging.send(msg, data);
    }
    // TODO verify if we still need notifyNode
    function notifyNodesForEx(exId, slicerOnly) {}

    function getSlicerStats() {}

    const api = {
        getClusterState,
        getClusterStats,
        getSlicerStats,
        availableWorkers,
        allWorkers,
        allNodes,
        allocateWorker,
        allocateWorkers,
        allocateSlicer,
        findNodesForJob,
        notifyNode,
        notifyNodesForEx,
        findAllSlicers,
        findAllWorkers,
        findAllByExecutionID,
        findWorkersByExecutionID,
        findSlicersByExecutionID,
        removeFromQueue, // remove
        addToQueue, // remove
        removeWorkers,
        shutdown,
        checkModerator, // remove
        broadcast // remove
    };

    function _initialize() {
        // TODO: handle the initialization of the cluster and only
        // actually resolve the promise once everything is up and running.
        // Should be delays here as we wait for nodes to join and share their
        // state.
        logger.info('Initializing');
        return Promise.resolve(api);
    }

    return _initialize();
};
