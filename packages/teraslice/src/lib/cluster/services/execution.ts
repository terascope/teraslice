import {
    TSError, getFullErrorStack, get,
    logError, withoutNil, isEmpty,
    multiFieldSort, isString, flatten,
    includes, cloneDeep, Logger
} from '@terascope/core-utils';
import { Queue } from '@terascope/entity-utils';
import type { RecoveryCleanupType } from '@terascope/job-components';
import { ClusterMaster } from '@terascope/teraslice-messaging';
import { ExecutionConfig, JobConfig } from '@terascope/types';
import type { ExecutionStorage, StateStorage } from '../../storage/index.js';
import type {
    ClusterMasterContext, NodeState, ExecutionNodeWorker,
    ControllerStats
} from '../../../interfaces.js';
import { makeLogger } from '../../workers/helpers/terafoundation.js';
import type { ClusterServiceType } from './cluster/index.js';
import { StopExecutionOptions } from './interfaces.js';
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

export class ExecutionService {
    logger: Logger;
    pendingExecutionQueue = new Queue<ExecutionConfig>();
    isNative: boolean;
    context: ClusterMasterContext;
    clusterMasterServer: ClusterMaster.Server;
    executionStorage!: ExecutionStorage;
    stateStorage!: StateStorage;
    clusterService!: ClusterServiceType;
    allocateInterval!: NodeJS.Timeout | undefined;
    reapInterval!: NodeJS.Timeout | undefined;

    constructor(
        context: ClusterMasterContext,
        { clusterMasterServer }: { clusterMasterServer: ClusterMaster.Server }
    ) {
        this.context = context;
        this.logger = makeLogger(context, 'execution_service');
        this.isNative = context.sysconfig.teraslice.cluster_manager_type === 'native';
        this.clusterMasterServer = clusterMasterServer;
    }

    async initialize() {
        const { executionStorage, stateStorage } = this.context.stores;

        if (executionStorage == null || stateStorage == null) {
            throw new Error('Missing required stores');
        }

        const { clusterService } = this.context.services;

        if (clusterService == null) {
            throw new Error('Missing required services');
        }

        this.executionStorage = executionStorage;
        this.stateStorage = stateStorage;
        this.clusterService = clusterService;

        this.logger.info('execution service is initializing...');

        // listen for an execution finished events
        // TODO: look closer at the types of the callback
        this.clusterMasterServer.onExecutionFinished(this._finishExecution.bind(this) as any);

        // lets call this before calling it
        // in the background
        await this.reapExecutions();

        const pending = await executionStorage.search('_status:pending', undefined, 10000, '_created:asc') as ExecutionConfig[];
        for (const execution of pending) {
            this.logger.info(`enqueuing ${execution._status} execution: ${execution.ex_id}`);
            this.enqueue(execution);
        }

        const queueSize = this.pendingExecutionQueue.size();

        if (queueSize > 0) {
            this.logger.info(`execution queue initialization complete, ${this.pendingExecutionQueue.size()} pending executions have been enqueued`);
        } else {
            this.logger.debug('execution queue initialization complete');
        }
        const executionAllocator = this._executionAllocator().bind(this);

        this.allocateInterval = setInterval(executionAllocator, 1000);
        this.reapInterval = setInterval(
            this.reapExecutions.bind(this),
            this.context.sysconfig.teraslice.shutdown_timeout || 30000
        );
    }

    enqueue(ex: ExecutionConfig) {
        const size = this.pendingExecutionQueue.size();
        this.logger.debug(ex, `enqueueing execution to be processed (queue size ${size})`);
        this.pendingExecutionQueue.enqueue(cloneDeep(ex));
    }

    getClusterAnalytics() {
        return this.clusterMasterServer.getClusterAnalytics();
    }

    async waitForExecutionStatus(exId: string, _status?: string) {
        const status = _status || 'stopped';

        return new Promise((resolve) => {
            const checkCluster = async () => {
                const state = this.clusterService.getClusterState();
                const dict = Object.create(null);

                Object.values(state).forEach(
                    (node: NodeState) => node.active.forEach((worker: any) => {
                        if (worker.ex_id) {
                            dict[worker.ex_id] = true;
                        }
                    })
                );

                // if found, do not resolve
                if (dict[exId]) {
                    setTimeout(checkCluster, 3000);
                    return;
                }

                try {
                    await this.executionStorage.verifyStatusUpdate(exId, status);
                    await this.executionStorage.setStatus(exId, status);
                } catch (err) {
                    logError(this.logger, err, `failure setting execution, ${exId}, to ${status}`);
                } finally {
                    resolve(true);
                }
            };

            checkCluster();
        });
    }

    async shutdown() {
        this.logger.info('shutting down');

        clearInterval(this.allocateInterval);
        clearInterval(this.reapInterval);
        this.allocateInterval = undefined;
        this.reapInterval = undefined;

        const query = this.executionStorage.getLivingStatuses().map((str) => `_status:${str}`)
            .join(' OR ');
        const executions = await this.executionStorage.search(query) as ExecutionConfig[];

        await Promise.all(executions.map(async (execution) => {
            if (!this.isNative) return;
            this.logger.warn(`marking execution ex_id: ${execution.ex_id}, job_id: ${execution.job_id} as terminated`);
            const exId = execution.ex_id;
            const { hostname } = this.context.sysconfig.teraslice;

            // need to exclude sending a stop to cluster master host, the shutdown event
            // has already been propagated this can cause a condition of it waiting for
            // stop to return but it already has which pauses this service shutdown
            await this.stopExecution(exId, { excludeNode: hostname });
            await this.waitForExecutionStatus(exId, 'terminated');
        }));
    }

    findAllWorkers(): ExecutionNodeWorker[] {
        return flatten(Object.values(this.clusterService.getClusterState())
            .filter((node: NodeState) => node.state === 'connected')
            .map((node: NodeState) => {
                const workers = node.active.filter(Boolean);

                return workers.map((worker: any) => {
                    worker.node_id = node.node_id;
                    worker.hostname = node.hostname;
                    return worker;
                });
            }))
            .filter(Boolean);
    }

    async addWorkers(exId: string, workerNum: number) {
        return this.executionStorage.getActiveExecution(exId)
            .then((execution) => this.clusterService.addWorkers(execution, workerNum));
    }

    async setWorkers(exId: string, workerNum: number) {
        return this.executionStorage.getActiveExecution(exId)
            .then((execution) => this.clusterService.setWorkers(execution, workerNum));
    }

    async removeWorkers(exId: string, workerNum: number) {
        return this.executionStorage.getActiveExecution(exId)
            .then((execution) => this.clusterService.removeWorkers(execution.ex_id, workerNum));
    }

    /**
     * Check if the execution is in a terminal status
     *
     * @param {import('@terascope/job-components').ExecutionConfig} execution
     * @returns {boolean}
    */
    isExecutionTerminal(execution: ExecutionConfig) {
        const terminalList = this.executionStorage.getTerminalStatuses();
        return terminalList.find((tStat) => tStat === execution._status) != null;
    }

    // safely stop the execution without setting the ex status to stopping or stopped
    private async _finishExecution(exId: string, err?: Error) {
        if (err) {
            const error = new TSError(err, {
                reason: `terminal error for execution: ${exId}, shutting down execution`,
                context: {
                    ex_id: exId,
                }
            });
            this.logger.error(error);
        }

        const execution = await this.getExecutionContext(exId);

        if (!execution) {
            throw new Error(`Execution: ${exId} was not found to finish execution`);
        }

        const status = execution._status;

        if (['stopping', 'stopped'].includes(status)) {
            this.logger.debug(`execution ${exId} is already stopping which means there is no need to stop the execution`);
            return;
        }

        const runningStatuses = this.executionStorage.getRunningStatuses();

        if (runningStatuses.includes(status)) {
            // This should never happen. If we get here with a running status
            // something has gone wrong. Mark execution as failed before shutdown.
            this.logger.warn(`Cluster_master is changing status of execution ${exId} from ${status} to failed`);
            await this.executionStorage.setStatus(
                exId,
                'failed',
                this.executionStorage.executionMetaData(null, getFullErrorStack(err))
            );
        }

        this.logger.debug(`execution ${exId} finished, shutting down execution`);

        try {
            await this.clusterService.stopExecution(exId);
        } catch (stopErr) {
            const stopError = new TSError(stopErr, {
                reason: 'error finishing the execution',
                context: {
                    ex_id: exId,
                }
            });
            logError(this.logger, stopError);
        }
    }

    async stopExecution(exId: string, options: StopExecutionOptions) {
        const execution = await this.getExecutionContext(exId);

        if (!execution) {
            throw new Error(`Execution: ${exId} was not found`);
        }

        const isTerminal = this.isExecutionTerminal(execution);

        if (!options.force) {
            if (isTerminal) {
                this.logger.info(`execution ${exId} is in terminal status "${execution._status}", it cannot be stopped`);
                return;
            }

            if (execution._status === 'stopping') {
                this.logger.info('execution is already stopping...');
                // we are kicking this off in the background, not part of the promise chain
                this.waitForExecutionStatus(exId);
                return;
            }

            this.logger.debug(`stopping execution ${exId}...`, withoutNil(options));
            await this.executionStorage.setStatus(exId, 'stopping');
        } else {
            this.logger.info(`force stopping execution ${exId}...`, withoutNil(options));
        }

        await this.clusterService.stopExecution(exId, options);
        // we are kicking this off in the background, not part of the promise chain
        this.waitForExecutionStatus(exId);
    }

    async pauseExecution(exId: string) {
        const status = 'paused';
        const execution = await this.executionStorage.getActiveExecution(exId);

        if (!this.clusterMasterServer.isClientReady(execution.ex_id)) {
            throw new Error(`Execution ${execution.ex_id} is not available to pause`);
        }

        await this.clusterMasterServer.sendExecutionPause(exId);
        await this.executionStorage.setStatus(exId, status);

        return { status };
    }

    async resumeExecution(exId: string) {
        const status = 'running';
        const execution = await this.executionStorage.getActiveExecution(exId);

        if (!this.clusterMasterServer.isClientReady(execution.ex_id)) {
            throw new Error(`Execution ${execution.ex_id} is not available to resume`);
        }

        await this.clusterMasterServer.sendExecutionResume(execution.ex_id);
        await this.executionStorage.setStatus(execution.ex_id, status);

        return { status };
    }

    async getControllerStats(exId?: string): Promise<ControllerStats[]> {
        // if no exId is provided it returns all running executions
        const specificId = exId ?? false;
        const exIds = await this.getRunningExecutions(exId);

        const clients = this.clusterMasterServer.onlineClients.filter(({ clientId }) => {
            if (specificId && clientId === specificId) return true;
            return includes(exIds, clientId);
        });

        function formatResponse(msg: any) {
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
            return this.clusterMasterServer
                .sendExecutionAnalyticsRequest(clientId)
                .then(formatResponse);
        });

        const results = await Promise.all(promises);
        return multiFieldSort(results, ['name', 'started']).reverse() as ControllerStats[];
    }

    /**
     * Create a new execution context
     *
     * @param {string|import('@terascope/job-components').JobConfigParams} job
     * @return {Promise<NewExecutionResult>}
    */
    async createExecutionContext(job: JobConfig) {
        const ex = await this.executionStorage.create(job);
        this.enqueue(ex);
        return { job_id: ex.job_id, ex_id: ex.ex_id };
    }

    async getExecutionContext(exId: string): Promise<ExecutionConfig> {
        try {
            const record = this.executionStorage.get(exId);
            if (!record) {
                throw new Error(`Execution ${exId} was not found`);
            }
            return record;
        } catch (err) {
            logError(this.logger, err, `error getting execution context for ex: ${exId}`);
            throw err;
        }
    }

    async softDeleteExecutionContext(exId: string): Promise<ExecutionConfig> {
        const exIds = await this.getRunningExecutions(exId);
        if (exIds.length > 0) {
            throw new TSError(`Execution ${exId} is currently running, cannot delete a running execution.`, {
                statusCode: 409
            });
        }
        return this.executionStorage.softDelete(exId);
    }

    async getRunningExecutions(exId: string | undefined) {
        let query = this.executionStorage.getRunningStatuses().map((state) => ` _status:${state} `)
            .join('OR');

        if (exId) {
            query = `ex_id:"${exId}" AND (${query.trim()})`;
        }

        const exs = await this.executionStorage.search(query, undefined, undefined, '_created:desc') as ExecutionConfig[];
        return exs.map((ex) => ex.ex_id);
    }

    /**
     * Recover the execution
     *
     * @param {string|import('@terascope/job-components').ExecutionConfig} exIdOrEx
     * @param {import('@terascope/job-components').RecoveryCleanupType} [cleanupType]
     * @return {Promise<NewExecutionResult>}
    */
    async recoverExecution(
        exIdOrEx: string | ExecutionConfig,
        cleanupType?: RecoveryCleanupType
    ) {
        const recoverFromEx = isString(exIdOrEx)
            ? await this.getExecutionContext(exIdOrEx)
            : cloneDeep(exIdOrEx) as ExecutionConfig;

        if (!recoverFromEx) {
            throw new Error(`Could not find execution: ${exIdOrEx} to recover from`);
        }

        const ex = await this.executionStorage.createRecoveredExecution(recoverFromEx, cleanupType);
        this.enqueue(ex);
        return { job_id: ex.job_id, ex_id: ex.ex_id };
    }

    private _executionAllocator() {
        let allocatingExecution = false;

        const allocator = async () => {
            const canAllocate = !allocatingExecution
                && this.pendingExecutionQueue.size() > 0
                && this.clusterService.readyForAllocation();
            if (!canAllocate) return;

            allocatingExecution = true;
            let execution = this.pendingExecutionQueue.dequeue() as ExecutionConfig;

            this.logger.info(`Scheduling execution: ${execution.ex_id}`);

            try {
                execution = await this.executionStorage.setStatus(execution.ex_id, 'scheduling');
                execution = await this.clusterService.allocateSlicer(execution);

                execution = await this.executionStorage.setStatus(execution.ex_id, 'initializing', {
                    slicer_port: execution.slicer_port,
                    slicer_hostname: execution.slicer_hostname
                });

                try {
                    await this.clusterService.allocateWorkers(execution, execution.workers);
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
                this.logger.warn(msg);

                try {
                    await this.executionStorage.setStatus(
                        execution.ex_id,
                        'failed',
                        this.executionStorage.executionMetaData(null, getFullErrorStack(error))
                    );
                } catch (failedErr) {
                    this.logger.error(new TSError(err, {
                        reason: 'Failure to set execution status to failed after provision failed'
                    }));
                }

                const clusteringType = this.context.sysconfig.teraslice.cluster_manager_type;
                if (clusteringType === 'kubernetesV2'
                ) {
                    // Since this condition is only hit in cases where the pods
                    // are never scheduled, all this call to stopExecution
                    // accomplishes is to delete the k8s resources, which is
                    // probably just the k8s job for the execution controller.
                    // Calling delete on the worker deployment that doesn't
                    // exist is OK.
                    this.logger.warn(`Calling stopExecution on execution: ${execution.ex_id} to clean up k8s resources.`);
                    await this.clusterService.stopExecution(execution.ex_id);
                }
            } finally {
                allocatingExecution = false;
                allocator();
            }
        };

        return allocator;
    }

    async reapExecutions() {
        // make sure to capture the error avoid throwing an
        // unhandled rejection
        try {
            // sometimes in development an execution gets stuck in stopping
            // status since the process gets force killed in before it
            // can be updated to stopped.
            const stopping = await this.executionStorage.search('_status:stopping') as ExecutionConfig[];

            for (const execution of stopping) {
                const updatedAt = new Date(execution._updated).getTime();
                const timeout = this.context.sysconfig.teraslice.shutdown_timeout;
                const updatedWithTimeout = updatedAt + timeout;
                // Since we don't want to break executions that actually are "stopping"
                // we need to verify that the job has exceeded the shutdown timeout
                if (Date.now() > updatedWithTimeout) {
                    this.logger.info(`stopping stuck executing ${execution._status} execution: ${execution.ex_id}`);
                    await this.executionStorage.setStatus(execution.ex_id, 'stopped');
                }
            }
        } catch (err) {
            this.logger.error(err, 'failure reaping executions');
        }
    }

    async listResourcesForJobId(jobId: string) {
        return this.clusterService.listResourcesForJobId(jobId);
    }
}
