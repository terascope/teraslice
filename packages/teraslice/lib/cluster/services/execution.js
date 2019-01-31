'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const Queue = require('@terascope/queue');
const { TSError, parseError } = require('@terascope/utils');

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a execution is rejected prior to scheduling
 failed - when there is an error while the execution is running
 aborted - when a execution was running at the point when the cluster shutsdown
 */

module.exports = function module(context, { clusterMasterServer }) {
    const logger = context.apis.foundation.makeLogger({ module: 'execution_service' });
    const pendingExecutionQueue = new Queue();
    const isNative = context.sysconfig.teraslice.cluster_manager_type === 'native';

    let exStore;
    let clusterService;

    function getClusterState() {
        return clusterService.getClusterState();
    }

    function getClusterStats() {
        return clusterMasterServer.getClusterAnalytics();
    }

    // designed to allocate additional workers, not any future slicers
    function allocateWorkers(execution, numOfWorkersRequested) {
        return clusterService.allocateWorkers(execution, numOfWorkersRequested);
    }

    function allocateSlicer(execution) {
        return clusterService.allocateSlicer(execution);
    }

    function executionHasStopped(exId, _status) {
        const status = _status || 'stopped';

        return new Promise((resolve) => {
            function checkCluster() {
                const state = getClusterState();
                const dict = {};
                _.each(
                    state,
                    node => _.each(node.active, (worker) => {
                        dict[worker.ex_id] = true;
                    }),
                );
                // if found, do not resolve
                if (dict[exId]) {
                    setTimeout(checkCluster, 3000);
                    return;
                }
                Promise.resolve()
                    .then(() => exStore.verifyStatusUpdate(exId, status))
                    .then(() => setExecutionStatus(exId, status))
                    .catch((err) => {
                        logger.error(err);
                    })
                    .finally(() => resolve(true));
            }
            checkCluster();
        });
    }

    function shutdown() {
        logger.info('shutting down');
        const query = exStore.getLivingStatuses().map(str => `_status:${str}`).join(' OR ');
        return searchExecutionContexts(query)
            .map((execution) => {
                if (isNative) {
                    logger.warn(`marking execution ex_id: ${execution.ex_id}, job_id: ${execution.job_id} as terminated`);
                    const exId = execution.ex_id;
                    const { hostname } = context.sysconfig.teraslice;

                    // need to exclude sending a stop to cluster master host, the shutdown event
                    // has already been propagated this can cause a condition of it waiting for
                    // stop to return but it already has which pauses this service shutdown
                    return stopExecution(exId, null, hostname)
                        .then(() => executionHasStopped(exId, 'terminated'));
                }
                return true;
            })
            .then(() => clusterService.shutdown())
            .then(() => exStore.shutdown())
            .catch((err) => {
                const error = new TSError(err, {
                    reason: 'Error while shutting down execution stores'
                });
                logger.error(error);
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

    function _isTerminalStatus(execution) {
        const terminalList = terminalStatusList();
        return terminalList.find(tStat => tStat === execution._status) != null;
    }

    // safely stop the execution without setting the ex status to stopping or stopped
    function finishExecution(exId, err) {
        if (err) {
            const error = new TSError(err, {
                reason: `terminal error for execution: ${exId}, shutting down execution`,
                context: {
                    ex_id: exId,
                }
            });
            logger.error(error);
        }
        return getExecutionContext(exId)
            .then((execution) => {
                const status = execution._status;
                if (['stopping', 'stopped'].includes(status)) {
                    logger.debug(`execution ${exId} is already stopping which means there is no need to stop the execution`);
                    return true;
                }

                logger.debug(`execution ${exId} finished, shutting down execution`);
                return clusterService.stopExecution(exId).catch((stopErr) => {
                    const stopError = new TSError(stopErr, {
                        reason: 'error finishing the execution',
                        context: {
                            ex_id: exId,
                        }
                    });
                    logger.error(stopError);
                });
            });
    }

    function stopExecution(exId, timeout, excludeNode) {
        return getExecutionContext(exId)
            .then((execution) => {
                const isTerminal = _isTerminalStatus(execution._status);
                if (isTerminal) {
                    logger.info(`execution ${exId} is in terminal status "${execution._status}", it cannot be stopped`);
                    return true;
                }

                if (execution._status === 'stopping') {
                    logger.info('execution is already stopping...');
                    // we are kicking this off in the background, not part of the promise chain
                    executionHasStopped(exId);
                    return true;
                }

                logger.debug(`stopping execution ${exId}...`, _.pickBy({ timeout, excludeNode }));
                return setExecutionStatus(exId, 'stopping')
                    .then(() => clusterService.stopExecution(exId, timeout, excludeNode))
                    .then(() => {
                        // we are kicking this off in the background, not part of the promise chain
                        executionHasStopped(exId);
                        return true;
                    });
            });
    }

    function pauseExecution(exId) {
        const status = 'paused';
        if (!clusterMasterServer.isClientReady(exId)) {
            return Promise.reject(new Error(`Execution ${exId} is not available to pause`));
        }
        return clusterMasterServer.sendExecutionPause(exId)
            .then(() => setExecutionStatus(exId, status))
            .then(() => ({ status }));
    }

    function resumeExecution(exId) {
        const status = 'running';
        if (!clusterMasterServer.isClientReady(exId)) {
            return Promise.reject(new Error(`Execution ${exId} is not available to resume`));
        }
        return clusterMasterServer.sendExecutionResume(exId)
            .then(() => setExecutionStatus(exId, status))
            .then(() => ({ status }));
    }

    function getControllerStats(exId) {
        // if no exId is provided it returns all running executions
        const specificId = exId || false;
        return getRunningExecutions(exId)
            .then((exIds) => {
                const clients = _.filter(clusterMasterServer.onlineClients, ({ clientId }) => {
                    if (specificId && clientId === specificId) return true;
                    return _.includes(exIds, clientId);
                });

                function formatResponse(msg) {
                    const payload = _.get(msg, 'payload', {});
                    const identifiers = {
                        ex_id: payload.ex_id,
                        job_id: payload.job_id,
                        name: payload.name
                    };
                    return Object.assign(identifiers, payload.stats);
                }

                if (_.isEmpty(clients)) {
                    if (specificId) {
                        const error = new Error(`Could not find active slicer for ex_id: ${specificId}`);
                        error.code = 404;
                        return Promise.reject(error);
                    }
                    return Promise.resolve([]);
                }

                const promises = _.map(clients, (client) => {
                    const { clientId } = client;
                    return clusterMasterServer
                        .sendExecutionAnalyticsRequest(clientId)
                        .then(formatResponse);
                });

                return Promise.all(promises);
            }).then((results) => {
                const sortedData = _.sortBy(results, ['name', 'started']);
                return _.reverse(sortedData);
            });
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
                    const error = new TSError(err, {
                        reason: 'Failure to set job to pending'
                    });
                    return Promise.reject(error);
                }))
            .catch((err) => {
                const error = new TSError(err, {
                    reason: 'Failure to create execution context'
                });
                return Promise.reject(error);
            });
    }

    function getExecutionContext(exId) {
        return exStore.get(exId)
            .catch(err => logger.error(err, `error getting execution context for ex: ${exId}`));
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
                    const error = new Error(`no active execution context was found for ex_id: ${exId}`);
                    error.code = 404;
                    return Promise.reject(error);
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
            });
    }

    const api = {
        getClusterState,
        getClusterStats,
        getControllerStats,
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
        executionMetaData,
        executionHasStopped
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
                                const error = new TSError(err, {
                                    reason: `Failure to allocateWorkers ${execution.ex_id}`
                                });
                                return Promise.reject(error);
                            })))
                    .catch((err) => {
                        const error = new TSError(err, {
                            reason: `Failured to provision execution ${execution.ex_id}`
                        });
                        const errMetaData = executionMetaData(null, error.stack);
                        return setExecutionStatus(execution.ex_id, 'failed', errMetaData);
                    })
                    .finally(() => {
                        allocatingExecution = false;
                        allocator();
                    });
            }
        };
    }

    function _initialize() {
        // listen for an execution finished events
        clusterMasterServer.onExecutionFinished(finishExecution);

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
                if (parseError(err).includes('no such index')) {
                    logger.error(err, 'initialization failed loading state from Elasticsearch');
                }

                const error = new TSError(err, {
                    reason: 'Error initializing'
                });
                return Promise.reject(error);
            });
    }


    return require('../storage/execution')(context)
        .then((ex) => {
            logger.info('execution service is initializing...');
            exStore = ex;
            return require('./cluster')(context, clusterMasterServer, api);
        })
        .then((cluster) => {
            clusterService = cluster;
            return _initialize();
        });
};
