'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const shortid = require('shortid');
const Queue = require('queue');
const parseError = require('../../../../utils/error_utils').parseError;
const sendError = require('../../../../utils/api_utils').sendError;

module.exports = function module(context) {
    const messaging = context.messaging;
    const events = context.foundation.getEventEmitter();
    const logger = context.foundation.makeLogger({ module: 'cluster_service' });
    // FIXME: this setting is for notifyNode
    const configTimeout = context.sysconfig.teraslice.network_timeout;
    const pendingWorkerRequests = new Queue();
    const clusterState = {};

    // temporary holding spot used to attach nodes that are non responsive or
    // disconnect before final cleanup
    const droppedNodes = {};

    // events can be fired from anything that instantiates a client, such as stores
    events.on('getClient:config_error', _terminalShutdown);
    events.on('jobs_service:verify_assets', _verifyAssets);

    // to catch signal propagation, but cleanup through msg sent from master
    function _noOP() {
    }

    function _terminalShutdown(errEV) {
        logger.error(`Terminal error: ${errEV.err}`);
        messaging.send({ message: 'cluster:error:terminal' });
    }

    // TODO: see what this does
    function _verifyAssets(assets) {
        const msgObj = _.assign({ message: 'jobs_service:verify_assets' }, assets);
        messaging.send(msgObj);
    }

    /*
     * Should take note that since job_service is instantiated after cluster service,
     * the mode to interact with job_service is through events emitters
     */
    // TODO: see if this is needed
    messaging.register('process:SIGTERM', _noOP);
    messaging.register('process:SIGINT', _noOP);

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

                    const timer = setTimeout(() => {
                        _cleanUpNode(nodeId);
                    }, 5000);

                    droppedNodes[nodeId] = timer;
                }
            }

            // if (identifier === 'moderator') {
            /* logger.warn(`Moderator ${id} has disconnected from cluster_master`);
            delete moderator[id];
            if (Object.keys(moderator).length === 0) {
                moderator = null;
            } */
            // }
        } else {
            logger.error(`cluster_master got a disconnect event on a unidentified connection. might be a network/service communication issue, msg: ${msg}`);
        }
    });


    setInterval(() => {
        logger.trace('cluster_master requesting state update for all nodes');
        messaging.send('cluster:node:state');
    }, 5000);


    function _cleanUpNode(nodeId) {
        // check workers and slicers
        const node = _checkNode(clusterState[nodeId]);

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

    function __checkNode(node) {
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

    function _findNodeForSlicer(stateArray, errorNodes) {
        let slicerNode = null;
        for (let i = 0; i < stateArray.length; i += 1) {
            if (stateArray[i].state === 'connected' && stateArray[i].available > 0 && !errorNodes[stateArray[i].node_id]) {
                const node = __checkNode(stateArray[i]);

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

    // TODO: needReadyForAllocation => bool >= 2
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
        return notifyNode(nodeId, 'cluster:node:get_port', {});
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
    function allocateWorkers(job, numOfWorkersRequested) {
        const exId = job.ex_id;
        const jobId = job.job_id;
        const jobStr = JSON.stringify(job);
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

            return notifyNode(slicerNodeID, 'cluster:slicer:create', data);
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
        logger.info('shutting down.');
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

    // TODO: verify if this can stay
    function findWorkersByExecutionID(exId) {
        return _iterateState(worker => worker.assignment === 'worker' && worker.ex_id === exId);
    }

    // FIXME: remove res from function, it should not be using http
    function removeWorkers(res, exId, workerNum) {
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
        const results = _.map(nodes, (val, key) => notifyNode(key, 'cluster:workers:remove', {
            workers: val,
            ex_id: exId
        }));

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

    const api = {
        getClusterState,
        getSlicerStats,
        readyForAllocation,
        clusterAvailable,
        allocateWorkers,
        allocateSlicer,
        addWorkers,
        removeWorkers,
        shutdown,
        stopJob,
        pauseJob,
        resumeJob
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
