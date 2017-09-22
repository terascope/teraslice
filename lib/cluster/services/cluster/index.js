'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const shortid = require('shortid');
const Queue = require('queue');
const parseError = require('../../../utils/error_utils').parseError;
const sendError = require('../../../utils/api_utils').sendError;

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

    messaging.register('node:message:processed', (data) => {
        // emitting the unique msg id to allow easier listener cleanup
        logger.debug(`node message ${data._msgID} has been processed`);
        events.emit(data._msgID, data);
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


    function getClusterState() {
        return _.cloneDeep(clusterState);
    }

    function getClusterStats() {
        return _.cloneDeep(clusterStats);
    }
    // TODO: candidate for removal
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
    // call down into backends
    function readyForAllocation() {}
    function clusterAvailable() {}

    // TODO: clean these up to use backend
    function allWorkers() {
        // total number of workers function
        return availableWorkers(true);
    }

    function allNodes() {
        return Object.keys(clusterState);
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
    // TODO: delegate to backend
    // designed to allocate additional workers, not any future slicers
    function allocateWorkers(job, numOfWorkersRequested) {

    }

    function allocateSlicer(job, recoverExecution) {

    }
    // TODO: call down into backend
    function shutdown() {
        logger.info('shutting down.');
        return Promise.resolve(true);
    }
    // TODO: rename searchClusterState, delegate
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
    // FIXME: remove res from function, it should not be using http, delegate
    function removeWorkers(res, exId, workerNum) {

    }

    function notifyNodesForEx(exId, slicerOnly){}


    const api = {
        getClusterState,
        getClusterStats,
        getSlicerStats,
        readyForAllocation,
        clusterAvailable,
        allWorkers,
        allNodes,
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
        shutdown,
        checkModerator, // remove
        stopJob,
        pauseJob,
        resumeJob,
        removeWorkers,
        addWorkers
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
