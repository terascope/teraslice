'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const shortid = require('shortid');
const Queue = require('queue');
const parseError = require('../../utils/error_utils').parseError;

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a execution is rejected prior to scheduling
 failed - when there is an error while the execution is running
 aborted - when a execution was running at the point when the cluster shutsdown
 */

module.exports = function module(context) {
    const messaging = context.messaging;
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'execution_service' });
    const configTimeout = context.sysconfig.teraslice.network_timeout;
    const masterNodeId = _parseNodeId(context.sysconfig._nodeName);
    const pendingExecutionQueue = new Queue();

    let exStore;
    let clusterService;

    function getClusterState() {
        return clusterService.getClusterState();
    }

    function getClusterStats() {
        return clusterService.getClusterStats();
    }

    function _parseNodeId(str) {
        const parsed = str.match(/\.\d+/);
        const length = str.length - parsed[0].length;
        return str.slice(0, length);
    }
    // TODO: this should go away in message refactor, jobs service should call in directly
    function verifyAssets(assetNames) {
        return _notifyNode(masterNodeId, 'jobs_service:verify_assets', { assets: assetNames });
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
                    reject(`Error: ${nodeMasterData.error} occurred on node: ${nodeMasterData.node_id}`);
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
        return clusterService.allocateWorkers(execution, numOfWorkersRequested);
    }

    function allocateSlicer(execution, recoverExecution) {
        return clusterService.allocateSlicer(execution, recoverExecution);
    }

    function shutdown() {
        logger.info('shutting down');
        const query = exStore.getRunningStatuses().map(str => `_status:${str}`).join(' OR ');
        return searchExecutionContexts(query)
            .map((execution) => {
                if (context.sysconfig.teraslice.cluster_manager_type === 'native') {
                    logger.warn(`marking execution ex_id: ${execution.ex_id}, job_id: ${execution.job_id} as terminated`);
                    // need to exclude sending a stop to cluster master host, the shutdown event
                    // has already been propagated this can cause a condition of it waiting for
                    // stop to return but it already has which pauses this service shutdown
                    return stopExecution(execution.ex_id, 'terminated');
                }
                return true;
            })
            .then(() => exStore.shutdown())
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error(`Error while shutting down execution stores, error: ${errMsg}`);
                // no matter what we need to shutdown
                return true;
            });
    }


    function _iterateState(cb) {
        return _.chain(getClusterState())
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
        return _iterateState(_.identity);
    }

    function addWorkers(execution, workerNum) {
        return clusterService.addWorkers(execution, workerNum);
    }

    function setWorkers(execution, workerNum) {
        return clusterService.setWorkers(execution, workerNum);
    }

    function removeWorkers(exId, workerNum) {
        return clusterService.removeWorkers(exId, workerNum);
    }

    function stopExecution(exId, _status) {
        const status = _status || 'stopped';
        return clusterService.stopExecution(exId)
            .then(() => setExecutionStatus(exId, status))
            .then(() => ({ status }));
    }

    function pauseExecution(exId) {
        const status = 'paused';
        return clusterService.pauseExecution(exId)
            .then(() => setExecutionStatus(exId, status))
            .then(() => ({ status }));
    }

    function resumeExecution(exId) {
        const status = 'running';
        return clusterService.resumeExecution(exId)
            .then(() => setExecutionStatus(exId, status))
            .then(() => ({ status }));
    }

    function getSlicerStats(exId) {
        return clusterService.getSlicerStats(exId);
    }

    function createExecutionContext(job) {
        return exStore.create(job, 'ex')
            .then(ex => setExecutionStatus(ex.ex_id, 'pending')
                .then(() => {
                    logger.debug('enqueueing execution to be processed', ex);
                    pendingExecutionQueue.enqueue(ex);
                    return { job_id: ex.job_id };
                })
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error('could not set to pending', errMsg);
                    return Promise.reject(errMsg);
                }))
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not create execution context', errMsg);
                return Promise.reject(errMsg);
            });
    }

    function getExecutionContext(exId) {
        return exStore.get(exId)
            .then(ex => ex)
            .catch(err => logger.error(`error getting execution context for ex: ${exId}`, err));
    }

    function getActiveExecution(exId) {
        const str = terminalStatusList().map(state => ` _status:${state} `).join('OR');
        const query = `ex_id: ${exId} NOT (${str.trim()})`;
        return searchExecutionContexts(query, null, 1, '_created:desc')
            .then((ex) => {
                if (ex.length === 0) {
                    return Promise.reject(`no execution context was found for ex_id: ${exId}`);
                }
                return ex[0];
            });
    }

    function searchExecutionContexts(query, from, _size, sort) {
        let size = 10000;
        if (_size) size = _size;
        return exStore.search(query, from, size, sort);
    }

    function terminalStatusList() {
        return exStore.getTerminalStatuses();
    }

    function setExecutionStatus(exId, status, metaData) {
        return exStore.setStatus(exId, status, metaData);
    }

    const api = {
        getClusterState,
        getClusterStats,
        getSlicerStats,
        getActiveExecution,
        allocateWorkers,
        allocateSlicer,
        findAllWorkers,
        shutdown,
        stopExecution,
        pauseExecution,
        resumeExecution,
        removeWorkers,
        addWorkers,
        setWorkers,
        createExecutionContext,
        getExecutionContext,
        searchExecutionContexts,
        setExecutionStatus,
        terminalStatusList,
        verifyAssets
    };

    function _executionAllocator() {
        let allocatingExecution = false;
        const readyForAllocation = clusterService.readyForAllocation;
        return function allocator() {
            const pendingQueueSize = pendingExecutionQueue.size();
            if (!allocatingExecution && pendingQueueSize > 0 && readyForAllocation()) {
                allocatingExecution = true;
                const execution = pendingExecutionQueue.dequeue();
                const recoverExecution = execution._recover_execution;

                logger.info(`Scheduling execution: ${execution.ex_id}`);

                setExecutionStatus(execution.ex_id, 'scheduling')
                    .then(() => {
                        allocateSlicer(execution, recoverExecution)
                            .then(() => {
                                setExecutionStatus(execution.ex_id, 'initializing', {
                                    slicer_port: execution.slicer_port,
                                    slicer_hostname: execution.slicer_hostname
                                });
                            })
                            .then(() => allocateWorkers(execution, execution.workers))
                            .catch((err) => {
                                // this is to catch errors of allocateWorkers
                                // if allocation fails, they are enqueued
                                logger.error(`Workers failed to be allocated, they will be enqueued, error: ${parseError(err)}`);
                            });
                    })
                    .catch((err) => {
                        logger.error(`Failured to provision execution ${execution.ex_id}, error: ${parseError(err)}`);
                        setExecutionStatus(execution.ex_id, 'failed');
                    })
                    .finally(() => {
                        allocatingExecution = false;
                        allocator();
                    });
            }
        };
    }

    function _initialize() {
        // Reschedule any persistent jobs that were running.
        // There may be some additional subtlety required here.
        return searchExecutionContexts('running').each((execution) => {
            // For this restarting to work correctly we need to check the job on the running
            // cluster to make sure it's not still running after a cluster_master restart.
            if (execution.lifecycle === 'persistent') {
                // pendingExecutionQueue.enqueue(job);
            } else {
                // _setExecutionStatus(job.ex_id, 'aborted');
            }
        })
            .then(() =>
                // Loads the initial pending jobs queue from storage.
                // the limit for retrieving pending jobs is 10000
                searchExecutionContexts('pending', null, 10000, '_created:asc')
                    .each((executionSpec) => {
                        logger.debug('enqueuing pending execution:', executionSpec);
                        pendingExecutionQueue.enqueue(executionSpec);
                    })
                    .then(() => {
                        const queueSize = pendingExecutionQueue.size();

                        if (queueSize > 0) {
                            logger.info(`execution queue initialization complete, ${pendingExecutionQueue.size()} pending executions have been enqueued`);
                        } else {
                            logger.info('execution queue initialization complete');
                        }

                        const executionAllocator = _executionAllocator();
                        setInterval(() => {
                            executionAllocator();
                        }, 1000);

                        return api;
                    })
            )
            .error((err) => {
            // TODO: verify whats coming here
                if (_.get(err, 'body.error.reason') !== 'no such index') {
                    logger.error(`initialization failed loading state from Elasticsearch: ${err}`);
                }
                const errMsg = parseError(err);
                logger.error('Error initializing, ', errMsg);
                return Promise.reject(errMsg);
            });
    }


    return require('../storage/execution')(context)
        .then((ex) => {
            logger.info('Initializing');
            exStore = ex;
            return require('./cluster')(context, messaging, api);
        })
        .then((cluster) => {
            clusterService = cluster;
            return _initialize();
        });
};
