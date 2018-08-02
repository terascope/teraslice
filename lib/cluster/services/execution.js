'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const Queue = require('@terascope/queue');
const parseError = require('@terascope/error-parser');

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a execution is rejected prior to scheduling
 failed - when there is an error while the execution is running
 aborted - when a execution was running at the point when the cluster shutsdown
 */

module.exports = function module(context) {
    const { messaging } = context;
    const logger = context.apis.foundation.makeLogger({ module: 'execution_service' });
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

    function verifyAssets(assetNames) {
        // this is to node_master since asset_loader is not spawned unless asked to
        const message = {
            to: 'node_master',
            address: masterNodeId,
            message: 'execution_service:verify_assets',
            payload: { assets: assetNames },
            response: true
        };

        return messaging.send(message);
    }

    // designed to allocate additional workers, not any future slicers
    function allocateWorkers(execution, numOfWorkersRequested) {
        return clusterService.allocateWorkers(execution, numOfWorkersRequested);
    }

    function allocateSlicer(execution) {
        return clusterService.allocateSlicer(execution);
    }

    function shutdown() {
        logger.info('shutting down');
        const query = exStore.getLivingStatuses().map(str => `_status:${str}`).join(' OR ');
        return searchExecutionContexts(query)
            .map((execution) => {
                if (context.sysconfig.teraslice.cluster_manager_type === 'native') {
                    logger.warn(`marking execution ex_id: ${execution.ex_id}, job_id: ${execution.job_id} as terminated`);
                    // need to exclude sending a stop to cluster master host, the shutdown event
                    // has already been propagated this can cause a condition of it waiting for
                    // stop to return but it already has which pauses this service shutdown
                    return stopExecution(execution.ex_id, null, 'terminated', context.sysconfig.teraslice.hostname);
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

    function addWorkers(exId, workerNum) {
        return getActiveExecution(exId)
            .then(execution => clusterService.addWorkers(execution, workerNum));
    }

    function setWorkers(exId, workerNum) {
        return getActiveExecution(exId)
            .then(execution => clusterService.setWorkers(execution, workerNum));
    }

    function removeWorkers(exId, workerNum) {
        return clusterService.removeWorkers(exId, workerNum);
    }

    function stopExecution(exId, timeout, _status, excludeNode) {
        const status = _status || 'stopped';
        return clusterService.stopExecution(exId, timeout, excludeNode)
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
        // if no exId is provided it returns all running executions
        const specificId = exId || false;
        return getRunningExecutions(exId)
            .then(exIds => clusterService.getSlicerStats(exIds, specificId));
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
            .catch(err => logger.error(`error getting execution context for ex: ${exId}`, err));
    }

    function getRunningExecutions(exId) {
        let query = exStore.getRunningStatuses().map(state => ` _status:${state} `).join('OR');
        if (exId) query = `ex_id: ${exId} AND (${query.trim()})`;
        return searchExecutionContexts(query, null, null, '_created:desc')
            .then(exs => exs.map(ex => ex.ex_id));
    }

    // encompasses all executions in either initialization or running statuses
    function getActiveExecution(exId) {
        const str = terminalStatusList().map(state => ` _status:${state} `).join('OR');
        const query = `ex_id: ${exId} NOT (${str.trim()})`;
        return searchExecutionContexts(query, null, 1, '_created:desc')
            .then((ex) => {
                if (ex.length === 0) {
                    return Promise.reject(`no active execution context was found for ex_id: ${exId}`);
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

    function executionMetaData(stats, errMsg) {
        return exStore.executionMetaData(stats, errMsg);
    }

    function _canRecover(ex) {
        if (!ex) {
            throw new Error('Unable to find execution to recover');
        }
        if (ex._status === 'completed') {
            throw new Error('This job has completed and can not be restarted.');
        }
        if (ex._status === 'scheduling' || ex._status === 'pending') {
            throw new Error('This job is currently being scheduled and can not be restarted.');
        }
        if (ex._status === 'running') {
            throw new Error('This job is currently successfully running and can not be restarted.');
        }
        return ex;
    }

    function _removeMetaData(execution) {
        // we need a better story about what is meta data
        delete execution.ex_id;
        delete execution._created;
        delete execution._updated;
        delete execution._status;
        delete execution.slicer_hostname;
        delete execution.slicer_port;
        delete execution._has_errors;
        delete execution._slicer_stats;
        delete execution._failureReason;
        delete execution.recovered_slice_state;
        delete execution._failureReason;

        execution.operations = execution.operations.map((opConfig) => {
            if (opConfig._op === 'elasticsearch_reader') {
                if (Array.isArray(opConfig.interval)) opConfig.interval = opConfig.interval.join('');
            }
            return opConfig;
        });

        return execution;
    }

    function recoverExecution(exId, cleanup) {
        return getExecutionContext(exId)
            .then(execution => _canRecover(execution))
            .then(execution => _removeMetaData(execution))
            .then((execution) => {
                execution.recovered_execution = exId;
                if (cleanup) execution.recovered_slice_type = cleanup;
                return createExecutionContext(execution);
            })
            .catch(err => Promise.reject(parseError(err)));
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
        recoverExecution,
        removeWorkers,
        addWorkers,
        setWorkers,
        createExecutionContext,
        getExecutionContext,
        searchExecutionContexts,
        setExecutionStatus,
        terminalStatusList,
        verifyAssets,
        executionMetaData
    };

    function _executionAllocator() {
        let allocatingExecution = false;
        const { readyForAllocation } = clusterService;
        return function allocator() {
            const pendingQueueSize = pendingExecutionQueue.size();
            if (!allocatingExecution && pendingQueueSize > 0 && readyForAllocation()) {
                allocatingExecution = true;
                const execution = pendingExecutionQueue.dequeue();

                logger.info(`Scheduling execution: ${execution.ex_id}`);

                setExecutionStatus(execution.ex_id, 'scheduling')
                    .then(() => allocateSlicer(execution)
                        .then(() => setExecutionStatus(execution.ex_id, 'initializing', {
                            slicer_port: execution.slicer_port,
                            slicer_hostname: execution.slicer_hostname
                        }))
                        .then(() => allocateWorkers(execution, execution.workers)
                            .catch((err) => {
                            // this is to catch errors of allocateWorkers
                            // if allocation fails, they are enqueued
                                logger.error(`Workers failed to be allocated, they will be enqueued, error: ${parseError(err)}`);
                            })))
                    .catch((err) => {
                        logger.error(`Failured to provision execution ${execution.ex_id}, error: ${parseError(err)}`);
                        return setExecutionStatus(execution.ex_id, 'failed');
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
            .then(() => searchExecutionContexts('pending', null, 10000, '_created:asc')
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
                }))
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
