import sortBy from 'lodash/sortBy';
import {
    Queue, TSError, getFullErrorStack,
    logError, get, withoutNil, isEmpty,
    isString, flatten, includes,
    cloneDeep,
} from '@terascope/utils';
import { setInterval } from 'timers';
import { makeLogger } from '../../workers/helpers/terafoundation.js';

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

export default function executionService(context, { clusterMasterServer }) {
    const logger = makeLogger(context, 'execution_service');
    const pendingExecutionQueue = new Queue();
    const isNative = context.sysconfig.teraslice.cluster_manager_type === 'native';

    let exStore;
    let stateStore;
    let clusterService;
    let allocateInterval;
    let reapInterval;

    function enqueue(ex) {
        const size = pendingExecutionQueue.size();
        logger.debug(ex, `enqueueing execution to be processed (queue size ${size})`);
        pendingExecutionQueue.enqueue(cloneDeep(ex));
    }

    function getClusterAnalytics() {
        return clusterMasterServer.getClusterAnalytics();
    }

    async function waitForExecutionStatus(exId, _status) {
        const status = _status || 'stopped';

        return new Promise((resolve) => {
            async function checkCluster() {
                const state = clusterService.getClusterState();
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
                    await exStore.setStatus(exId, status);
                } catch (err) {
                    logError(logger, err, `failure setting execution, ${exId}, to ${status}`);
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
        clearInterval(reapInterval);
        allocateInterval = null;
        reapInterval = null;

        const query = exStore.getLivingStatuses().map((str) => `_status:${str}`).join(' OR ');
        const executions = await exStore.search(query);
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
    }

    function findAllWorkers() {
        return flatten(Object.values(clusterService.getClusterState())
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
        return exStore.getActiveExecution(exId)
            .then((execution) => clusterService.addWorkers(execution, workerNum));
    }

    async function setWorkers(exId, workerNum) {
        return exStore.getActiveExecution(exId)
            .then((execution) => clusterService.setWorkers(execution, workerNum));
    }

    async function removeWorkers(exId, workerNum) {
        return exStore.getActiveExecution(exId)
            .then((execution) => clusterService.removeWorkers(execution.ex_id, workerNum));
    }

    /**
     * Check if the execution is in a terminal status
     *
     * @param {import('@terascope/job-components').ExecutionConfig} execution
     * @returns {boolean}
    */
    function isExecutionTerminal(execution) {
        const terminalList = exStore.getTerminalStatuses();
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
        const isTerminal = isExecutionTerminal(execution._status);
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
        await exStore.setStatus(exId, 'stopping');
        await clusterService.stopExecution(exId, timeout, excludeNode);
        // we are kicking this off in the background, not part of the promise chain
        waitForExecutionStatus(exId);
    }

    async function pauseExecution(exId) {
        const status = 'paused';
        const execution = await exStore.getActiveExecution(exId);
        if (!clusterMasterServer.isClientReady(execution.ex_id)) {
            throw new Error(`Execution ${execution.ex_id} is not available to pause`);
        }
        await clusterMasterServer.sendExecutionPause(exId);
        await exStore.setStatus(exId, status);
        return { status };
    }

    async function resumeExecution(exId) {
        const status = 'running';
        const execution = await exStore.getActiveExecution(exId);
        if (!clusterMasterServer.isClientReady(execution.ex_id)) {
            throw new Error(`Execution ${execution.ex_id} is not available to resume`);
        }
        await clusterMasterServer.sendExecutionResume(execution.ex_id);
        await exStore.setStatus(execution.ex_id, status);
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
        return { job_id: ex.job_id, ex_id: ex.ex_id };
    }

    async function getExecutionContext(exId) {
        return exStore.get(exId)
            .catch((err) => logError(logger, err, `error getting execution context for ex: ${exId}`));
    }

    async function getRunningExecutions(exId) {
        let query = exStore.getRunningStatuses().map((state) => ` _status:${state} `).join('OR');
        if (exId) query = `ex_id:"${exId}" AND (${query.trim()})`;
        const exs = await exStore.search(query, null, null, '_created:desc');
        return exs.map((ex) => ex.ex_id);
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
            : cloneDeep(exIdOrEx);

        const ex = await exStore.createRecoveredExecution(recoverFromEx, cleanupType);
        enqueue(ex);
        return { job_id: ex.job_id, ex_id: ex.ex_id };
    }

    function _executionAllocator() {
        let allocatingExecution = false;
        const { readyForAllocation } = clusterService;
        return async function allocator() {
            const canAllocate = !allocatingExecution
                && pendingExecutionQueue.size() > 0
                && readyForAllocation();
            if (!canAllocate) return;

            allocatingExecution = true;
            let execution = pendingExecutionQueue.dequeue();

            logger.info(`Scheduling execution: ${execution.ex_id}`);

            try {
                execution = await exStore.setStatus(execution.ex_id, 'scheduling');

                execution = await clusterService.allocateSlicer(execution);

                execution = await exStore.setStatus(execution.ex_id, 'initializing', {
                    slicer_port: execution.slicer_port,
                    slicer_hostname: execution.slicer_hostname
                });

                try {
                    await clusterService.allocateWorkers(execution, execution.workers);
                } catch (err) {
                    throw new TSError(err, {
                        reason: `Failure to allocateWorkers ${execution.ex_id}`
                    });
                }
            } catch (err) {
                const msg = `Failed to provision execution ${execution.ex_id}`;
                const error = new TSError(err, {
                    reason: msg
                });
                logger.warn(msg);

                try {
                    await exStore.setStatus(
                        execution.ex_id,
                        'failed',
                        exStore.executionMetaData(null, getFullErrorStack(error))
                    );
                } catch (failedErr) {
                    logger.error(new TSError(err, {
                        reason: 'Failure to set execution status to failed after provision failed'
                    }));
                }

                if (context.sysconfig.teraslice.cluster_manager_type === 'kubernetes') {
                    // Since this condition is only hit in cases where the pods
                    // are never scheduled, all this call to stopExecution
                    // accomplishes is to delete the k8s resources, which is
                    // probably just the k8s job for the execution controller.
                    // Calling delete on the worker deployment that doesn't
                    // exist is OK.
                    logger.warn(`Calling stopExecution on execution: ${execution.ex_id} to clean up k8s resources.`);
                    await clusterService.stopExecution(execution.ex_id);
                }
            } finally {
                allocatingExecution = false;
                allocator();
            }
        };
    }

    async function reapExecutions() {
        // make sure to capture the error avoid throwing an
        // unhandled rejection
        try {
            // sometimes in development an execution gets stuck in stopping
            // status since the process gets force killed in before it
            // can be updated to stopped.
            const stopping = await exStore.search('_status:stopping');
            for (const execution of stopping) {
                const updatedAt = new Date(execution._updated).getTime();
                const updatedWithTimeout = updatedAt + context.sysconfig.teraslice.shutdown_timeout;
                // Since we don't want to break executions that actually are "stopping"
                // we need to verify that the job has exceeded the shutdown timeout
                if (Date.now() > updatedWithTimeout) {
                    logger.info(`stopping stuck executing ${execution._status} execution: ${execution.ex_id}`);
                    await exStore.setStatus(execution.ex_id, 'stopped');
                }
            }
        } catch (err) {
            logger.error(err, 'failure reaping executions');
        }
    }

    async function initialize() {
        exStore = context.stores.execution;
        stateStore = context.stores.state;
        if (exStore == null || stateStore == null) {
            throw new Error('Missing required stores');
        }

        clusterService = context.services.cluster;
        if (clusterService == null) {
            throw new Error('Missing required services');
        }

        logger.info('execution service is initializing...');

        // listen for an execution finished events
        clusterMasterServer.onExecutionFinished(finishExecution);

        // lets call this before calling it
        // in the background
        await reapExecutions();

        const pending = await exStore.search('_status:pending', null, 10000, '_created:asc');
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
        reapInterval = setInterval(
            reapExecutions,
            context.sysconfig.teraslice.shutdown_timeout || 30000
        );
    }

    return {
        getClusterAnalytics,
        getControllerStats,
        findAllWorkers,
        shutdown,
        initialize,
        stopExecution,
        pauseExecution,
        resumeExecution,
        recoverExecution,
        removeWorkers,
        addWorkers,
        setWorkers,
        createExecutionContext,
        getExecutionContext,
        isExecutionTerminal,
        waitForExecutionStatus
    };
};
