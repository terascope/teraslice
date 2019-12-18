'use strict';

const sortBy = require('lodash/sortBy');
const Queue = require('@terascope/queue');
const {
    TSError,
    getFullErrorStack,
    logError,
    get,
    withoutNil,
    isEmpty,
    isString,
    flatten,
    includes,
    cloneDeep,
} = require('@terascope/utils');
const clusterModule = require('./cluster');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const makeExStore = require('../storage/execution');

/**
 * New execution result
 * @typedef NewExecutionResult
 * @property {string} job_id
 * @property {string} ex_id
 */

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a execution is rejected prior to scheduling
 failed - when there is an error while the execution is running
 aborted - when a execution was running at the point when the cluster shutsdown
 */

module.exports = async function executionService(context, { clusterMasterServer }) {
    const logger = makeLogger(context, 'execution_service');
    const pendingExecutionQueue = new Queue();
    const isNative = context.sysconfig.teraslice.cluster_manager_type === 'native';

    let exStore;
    let clusterService;
    let allocateInterval;

    function enqueue(ex) {
        const size = pendingExecutionQueue.size();
        logger.debug(ex, `enqueueing execution to be processed (queue size ${size})`);
        pendingExecutionQueue.enqueue(cloneDeep(ex));
    }

    function getClusterState() {
        return clusterService.getClusterState();
    }

    function getClusterStats() {
        return clusterMasterServer.getClusterAnalytics();
    }

    // designed to allocate additional workers, not any future slicers
    async function allocateWorkers(execution, numOfWorkersRequested) {
        return clusterService.allocateWorkers(execution, numOfWorkersRequested);
    }

    async function allocateSlicer(execution) {
        return clusterService.allocateSlicer(execution);
    }

    async function waitForExecutionStatus(exId, _status) {
        const status = _status || 'stopped';

        return new Promise((resolve) => {
            async function checkCluster() {
                const state = getClusterState();
                const dict = Object.create(null);

                Object.values(state).forEach((node) => node.active.forEach((worker) => {
                    dict[worker.ex_id] = true;
                }));

                // if found, do not resolve
                if (dict[exId]) {
                    setTimeout(checkCluster, 3000);
                    return;
                }

                try {
                    await exStore.verifyStatusUpdate(exId, status);
                    await setExecutionStatus(exId, status);
                } catch (err) {
                    logError(logger, err, 'failure setting execution to stopped');
                } finally {
                    resolve(true);
                }
            }
            checkCluster();
        });
    }

    async function shutdown() {
        logger.info('shutting down');

        clearInterval(allocateInterval);
        allocateInterval = null;

        const query = exStore.getLivingStatuses().map((str) => `_status:${str}`).join(' OR ');
        const executions = await searchExecutionContexts(query);
        await Promise.all(executions.map(async (execution) => {
            if (!isNative) return;
            logger.warn(`marking execution ex_id: ${execution.ex_id}, job_id: ${execution.job_id} as terminated`);
            const exId = execution.ex_id;
            const { hostname } = context.sysconfig.teraslice;

            // need to exclude sending a stop to cluster master host, the shutdown event
            // has already been propagated this can cause a condition of it waiting for
            // stop to return but it already has which pauses this service shutdown
            await stopExecution(exId, null, hostname);
            await waitForExecutionStatus(exId, 'terminated');
        }));

        await clusterService.shutdown()
            .catch((err) => logError(logger, err, 'Error while shutting down cluster service'));
        await exStore.shutdown()
            .catch((err) => logError(logger, err, 'Error while shutting down execution stores'));
    }

    function findAllWorkers() {
        return flatten(getClusterState()
            .filter((node) => node.state === 'connected')
            .map((node) => {
                const workers = node.active.filter(Boolean);

                return workers.map((worker) => {
                    worker.node_id = node.node_id;
                    worker.hostname = node.hostname;
                    return worker;
                });
            }))
            .filter(Boolean);
    }

    async function addWorkers(exId, workerNum) {
        return getActiveExecution(exId)
            .then((execution) => clusterService.addWorkers(execution, workerNum));
    }

    async function setWorkers(exId, workerNum) {
        return getActiveExecution(exId)
            .then((execution) => clusterService.setWorkers(execution, workerNum));
    }

    async function removeWorkers(exId, workerNum) {
        return clusterService.removeWorkers(exId, workerNum);
    }

    function _isTerminalStatus(execution) {
        const terminalList = terminalStatusList();
        return terminalList.find((tStat) => tStat === execution._status) != null;
    }

    // safely stop the execution without setting the ex status to stopping or stopped
    async function finishExecution(exId, err) {
        if (err) {
            const error = new TSError(err, {
                reason: `terminal error for execution: ${exId}, shutting down execution`,
                context: {
                    ex_id: exId,
                }
            });
            logger.error(error);
        }
        const execution = await getExecutionContext(exId);
        const status = execution._status;
        if (['stopping', 'stopped'].includes(status)) {
            logger.debug(`execution ${exId} is already stopping which means there is no need to stop the execution`);
            return;
        }

        logger.debug(`execution ${exId} finished, shutting down execution`);
        try {
            await clusterService.stopExecution(exId);
        } catch (stopErr) {
            const stopError = new TSError(stopErr, {
                reason: 'error finishing the execution',
                context: {
                    ex_id: exId,
                }
            });
            logError(logger, stopError);
        }
    }

    async function stopExecution(exId, timeout, excludeNode) {
        const execution = await getExecutionContext(exId);
        const isTerminal = _isTerminalStatus(execution._status);
        if (isTerminal) {
            logger.info(`execution ${exId} is in terminal status "${execution._status}", it cannot be stopped`);
            return;
        }

        if (execution._status === 'stopping') {
            logger.info('execution is already stopping...');
            // we are kicking this off in the background, not part of the promise chain
            waitForExecutionStatus(exId);
            return;
        }

        logger.debug(`stopping execution ${exId}...`, withoutNil({ timeout, excludeNode }));
        await setExecutionStatus(exId, 'stopping');
        await clusterService.stopExecution(exId, timeout, excludeNode);
        // we are kicking this off in the background, not part of the promise chain
        waitForExecutionStatus(exId);
    }

    async function pauseExecution(exId) {
        const status = 'paused';
        const execution = await getActiveExecution(exId);
        if (!clusterMasterServer.isClientReady(execution.ex_id)) {
            throw new Error(`Execution ${execution.ex_id} is not available to pause`);
        }
        await setExecutionStatus(exId, status);
        return { status };
    }

    async function resumeExecution(exId) {
        const status = 'running';
        const execution = await getActiveExecution(exId);
        if (!clusterMasterServer.isClientReady(execution.ex_id)) {
            throw new Error(`Execution ${execution.ex_id} is not available to resume`);
        }
        await clusterMasterServer.sendExecutionResume(execution.ex_id);
        await setExecutionStatus(execution.ex_id, status);
        return { status };
    }

    async function getControllerStats(exId) {
        // if no exId is provided it returns all running executions
        const specificId = exId || false;
        const exIds = await getRunningExecutions(exId);
        const clients = clusterMasterServer.onlineClients.filter(({ clientId }) => {
            if (specificId && clientId === specificId) return true;
            return includes(exIds, clientId);
        });

        function formatResponse(msg) {
            const payload = get(msg, 'payload', {});
            const identifiers = {
                ex_id: payload.ex_id,
                job_id: payload.job_id,
                name: payload.name
            };
            return Object.assign(identifiers, payload.stats);
        }

        if (isEmpty(clients)) {
            if (specificId) {
                throw new TSError(`Could not find active slicer for ex_id: ${specificId}`, {
                    statusCode: 404
                });
            }
            return [];
        }

        const promises = clients.map((client) => {
            const { clientId } = client;
            return clusterMasterServer
                .sendExecutionAnalyticsRequest(clientId)
                .then(formatResponse);
        });

        const results = await Promise.all(promises);
        return sortBy(results, ['name', 'started']).reverse();
    }

    /**
     * Create a new execution context
     *
     * @param {string|import('@terascope/job-components').JobConfig} job
     * @return {Promise<NewExecutionResult>}
    */
    async function createExecutionContext(job) {
        const ex = await exStore.create(job);
        enqueue(ex);
        return { job_id: ex.job_id, ex_id: job.ex_id };
    }

    async function getExecutionContext(exId) {
        return exStore.get(exId)
            .catch((err) => logError(logger, err, `error getting execution context for ex: ${exId}`));
    }

    async function getRunningExecutions(exId) {
        let query = exStore.getRunningStatuses().map((state) => ` _status:${state} `).join('OR');
        if (exId) query = `ex_id:"${exId}" AND (${query.trim()})`;
        const exs = await searchExecutionContexts(query, null, null, '_created:desc');
        return exs.map((ex) => ex.ex_id);
    }

    // encompasses all executions in either initialization or running statuses
    async function getActiveExecution(exId) {
        const str = terminalStatusList().map((state) => ` _status:${state} `).join('OR');
        const query = `ex_id:"${exId}" NOT (${str.trim()})`;
        const executions = await searchExecutionContexts(query, null, 1, '_created:desc');
        if (!executions.length) {
            throw new Error(`no active execution context was found for ex_id: ${exId}`, {
                statusCode: 404
            });
        }
        return executions[0];
    }

    async function searchExecutionContexts(query, from, _size, sort) {
        let size = 10000;
        if (_size) size = _size;
        return exStore.search(query, from, size, sort);
    }

    function terminalStatusList() {
        return exStore.getTerminalStatuses();
    }

    async function setExecutionStatus(exId, status, metaData) {
        return exStore.setStatus(exId, status, metaData);
    }

    async function executionMetaData(stats, errMsg) {
        return exStore.executionMetaData(stats, errMsg);
    }

    /**
     * Recover the execution
     *
     * @param {string|import('@terascope/job-components').ExecutionConfig} exIdOrEx
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @return {Promise<NewExecutionResult>}
    */
    async function recoverExecution(exIdOrEx, cleanupType) {
        const recoverFromEx = isString(exIdOrEx)
            ? await getExecutionContext(exIdOrEx)
            : exIdOrEx;

        const ex = await exStore.createRecoveredExecution(recoverFromEx, cleanupType);
        enqueue(ex);
        return { job_id: ex.job_id, ex_id: ex.ex_id };
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
        waitForExecutionStatus
    };

    function _executionAllocator() {
        let allocatingExecution = false;
        const { readyForAllocation } = clusterService;
        return async function allocator() {
            const canAllocate = !allocatingExecution
                && pendingExecutionQueue.size() > 0
                && readyForAllocation();
            if (!canAllocate) return;

            allocatingExecution = true;
            const execution = pendingExecutionQueue.dequeue();

            logger.info(`Scheduling execution: ${execution.ex_id}`);

            try {
                await setExecutionStatus(execution.ex_id, 'scheduling');
                await allocateSlicer(execution);
                await setExecutionStatus(execution.ex_id, 'initializing', {
                    slicer_port: execution.slicer_port,
                    slicer_hostname: execution.slicer_hostname
                });
                try {
                    await allocateWorkers(execution, execution.workers);
                } catch (err) {
                    throw new TSError(err, {
                        reason: `Failure to allocateWorkers ${execution.ex_id}`
                    });
                }
            } catch (err) {
                const error = new TSError(err, {
                    reason: `Failured to provision execution ${execution.ex_id}`
                });

                try {
                    const errMetaData = executionMetaData(null, getFullErrorStack(error));
                    await setExecutionStatus(execution.ex_id, 'failed', errMetaData);
                } catch (failedErr) {
                    logger.error(new TSError(err, {
                        reason: 'Failure to set execution status to failed after provision failed'
                    }));
                }
            } finally {
                allocatingExecution = false;
                allocator();
            }
        };
    }

    async function _initialize() {
        // listen for an execution finished events
        clusterMasterServer.onExecutionFinished(finishExecution);

        const pending = await searchExecutionContexts('_status:pending', null, 10000, '_created:asc');
        for (const execution of pending) {
            logger.info(`enqueuing ${execution._status} execution: ${execution.ex_id}`);
            enqueue(execution);
        }

        const queueSize = pendingExecutionQueue.size();

        if (queueSize > 0) {
            logger.info(`execution queue initialization complete, ${pendingExecutionQueue.size()} pending executions have been enqueued`);
        } else {
            logger.debug('execution queue initialization complete');
        }

        allocateInterval = setInterval(_executionAllocator(), 1000);
    }

    exStore = await makeExStore(context);
    logger.info('execution service is initializing...');
    clusterService = await clusterModule(context, clusterMasterServer, api);
    await _initialize();
    return api;
};
