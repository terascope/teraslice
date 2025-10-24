/* eslint-disable @typescript-eslint/prefer-for-of */
import {
    TSError, getFullErrorStack, debounce,
    pDelay, cloneDeep, Logger,
    pMap, orderBy, isInteger, get
} from '@terascope/core-utils';
import { Queue } from '@terascope/entity-utils';
import type { EventEmitter } from 'node:events';
import { ExecutionConfig } from '@terascope/types';
import { Dispatch } from './dispatch.js';
import type { ClusterMasterContext, NodeState } from '../../../../../../interfaces.js';
import { makeLogger } from '../../../../../workers/helpers/terafoundation.js';
import { findWorkersByExecutionID } from '../state-utils.js';
import { Messaging } from './messaging.js';
import { ExecutionStorage } from '../../../../../storage/index.js';
import { StopExecutionOptions } from '../../../interfaces.js';

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */

interface StateMessage {
    to: string;
    message: string;
    node_id: string;
    payload: Record<string, any>;
    __source: string;
}
interface CheckNodeState {
    hasSlicer: boolean;
    numOfSlicers: number;
    slicerExecutions: Record<string, string>;
    workerExecutions: Record<string, number>;
    numOfWorkers: number;
    available: number;
}

type Message = StateMessage;

export class NativeClustering {
    context: ClusterMasterContext;
    logger: Logger;
    events: EventEmitter;
    executionStore!: ExecutionStorage;
    pendingWorkerRequests = new Queue<any>();
    nodeStateInterval: number;
    slicerAllocationAttempts: number;
    clusterState: Record<string, NodeState> = {};
    clusterStateInterval!: NodeJS.Timeout | undefined;
    messaging: Messaging;
    droppedNodes: Record<string, any> = {};
    clusterMasterServer: any;

    constructor(context: ClusterMasterContext, clusterMasterServer: any) {
        this.context = context;
        this.events = context.apis.foundation.getSystemEvents();
        this.logger = makeLogger(context, 'native_cluster_service');
        const nodeDisconnectTimeout = context.sysconfig.teraslice.node_disconnect_timeout;
        this.nodeStateInterval = context.sysconfig.teraslice.node_state_interval;
        this.slicerAllocationAttempts = context.sysconfig.teraslice.slicer_allocation_attempts;
        this.messaging = new Messaging(context, this.logger);
        this.clusterMasterServer = clusterMasterServer;

        // temporary holding spot used to attach nodes that are non responsive or
        // disconnect before final cleanup

        this.messaging.register({
            event: 'node:online',
            identifier: 'node_id',
            callback: (data: Message, nodeId: string) => {
                this.logger.info(`node ${nodeId} has connected`);
                // if a reconnect happens stop timer
                if (this.droppedNodes[nodeId]) {
                    clearTimeout(this.droppedNodes[nodeId]);
                    delete this.droppedNodes[nodeId];
                }
                this.logger.trace(`node ${nodeId} has state:`, data.payload);
                this.clusterState[nodeId] = data.payload as NodeState;
                // if new node comes online, check if jobs need more workers
                this.events.emit('cluster:available_workers');
            }
        });

        this.messaging.register({
            event: 'node:state',
            callback: (stateMsg: Message) => {
                const data = stateMsg.payload;
                this.clusterState[data.node_id] = data as NodeState;
                this.logger.trace(`node ${data.node_id} state is being updated`, data);
                // check to see if we can provision any additional workers
                this.events.emit('cluster:available_workers');
            }
        });

        this.messaging.register({
            event: 'network:error',
            callback: (err: Error) => this.logger.error(err, 'cluster_master had an error with one of its connections')
        });

        this.messaging.register({
            event: 'network:disconnect',
            identifier: 'node_id',
            callback: (msg: StateMessage, nodeId: string) => {
                if (!this.clusterState[nodeId]) return;

                if (this.clusterState[nodeId].active.length === 0) {
                    this.logger.warn(`node ${nodeId} has disconnected`);
                    delete this.clusterState[nodeId];
                } else {
                    this.clusterState[nodeId].state = 'disconnected';
                    const timer = setTimeout(async () => {
                        await this._cleanUpNode(nodeId);
                    }, nodeDisconnectTimeout);

                    this.droppedNodes[nodeId] = timer;
                }
            }
        });
        // TODO: should this be in initialize?
        const schedulePendingRequests = debounce(() => {
            if (this.pendingWorkerRequests.size() && this._availableWorkers(false, true) >= 1) {
                const requestedWorker = this.pendingWorkerRequests.dequeue();
                const job = JSON.parse(requestedWorker.job);

                this.allocateWorkers(job, requestedWorker.workers)
                    .catch((err) => {
                        const error = new TSError(err, {
                            reason: 'Error processing pending requests'
                        });
                        this.logger.error(error);
                    });
            }
        }, 500, { leading: false, trailing: true });

        this.events.on('cluster:available_workers', schedulePendingRequests);
    }

    private async _cleanUpNode(nodeId: string) {
        // check workers and slicers
        const node = this._checkNode(this.clusterState[nodeId]);
        // if disconnected node had a slicer, we stop the execution of each slicer on it
        // and mark it as failed
        if (node.hasSlicer) {
            await pMap(Object.values(node.slicerExecutions), async (exId) => {
                const errMsg = `node ${nodeId} has been disconnected from cluster_master past the allowed timeout, it has an active slicer for execution: ${exId} which will be marked as terminated and shut down`;
                this.logger.error(errMsg);
                const metaData = this.executionStore.executionMetaData(null, errMsg);
                this.pendingWorkerRequests.remove(exId, 'ex_id');

                try {
                    await this.executionStore.setStatus(exId, 'terminated', metaData);
                } catch (err) {
                    this.logger.error(err, `failure to set execution ${exId} status to terminated`);
                } finally {
                    this.messaging.broadcast('cluster:execution:stop', { ex_id: exId });
                }
            });
        }
        // for any other worker not part of what is being shutdown, we attempt to reallocate
        await pMap(Object.keys(node.workerExecutions), async (exId) => {
            // looking for unique ex_id's not in slicerJobID
            if (!node.slicerExecutions[exId]) {
                const activeWorkers = this.clusterState[nodeId].active;

                const numOfWorkers = activeWorkers.filter(
                    (worker: any) => worker.ex_id === exId
                ).length;

                try {
                    const execution = await this.executionStore.getActiveExecution(exId);
                    this.addWorkers(execution, numOfWorkers);
                } catch (err) {
                    this.logger.error(err, `failure to add workers to execution ${exId}`);
                }
            }
        });

        // cleanup key so we don't get ever growing obj
        delete this.droppedNodes[nodeId];
        delete this.clusterState[nodeId];
    }

    async initialize() {
        this.logger.info('native clustering initializing');
        this.executionStore = this.context.stores.executionStorage;

        if (!this.executionStore) {
            throw new Error('Missing required stores');
        }
        const server = this.clusterMasterServer.httpServer;

        await this.messaging.listen({ server });

        this.clusterStateInterval = setInterval(() => {
            this.logger.trace('cluster_master requesting state update for all nodes');
            this.messaging.broadcast('cluster:node:state');
        }, this.nodeStateInterval);
    }

    getClusterState() {
        return cloneDeep(this.clusterState);
    }

    private _checkNode(node: NodeState) {
        const obj: CheckNodeState = {
            hasSlicer: false,
            numOfSlicers: 0,
            slicerExecutions: {},
            workerExecutions: {},
            numOfWorkers: 0,
            available: node.available
        };

        return node.active.reduce((prev, curr) => {
            if (curr.assignment === 'execution_controller') {
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

    private _findNodeForSlicer(stateArray: NodeState[], errorNodes: Record<string, any>) {
        let slicerNode = null;

        for (let i = 0; i < stateArray.length; i += 1) {
            if (stateArray[i].state === 'connected' && stateArray[i].available > 0 && !errorNodes[stateArray[i].node_id]) {
                const node = this._checkNode(stateArray[i]);

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

    private _findNodesForExecution(exId: string, slicerOnly?: boolean) {
        const nodes: any[] = [];

        for (const [, node] of Object.entries(this.clusterState)) {
            if (node.state !== 'disconnected') {
                const hasJob = node.active.filter((worker: any) => {
                    if (slicerOnly) {
                        return worker.ex_id === exId && worker.assignment === 'execution_controller';
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
            }
        }

        return nodes;
    }

    private _availableWorkers(all?: boolean, forceCheck?: boolean) {
        let num = 0;
        // determine which key to search for in cluster state
        if (this.pendingWorkerRequests.size() === 0 || forceCheck) {
            const key = all ? 'total' : 'available';

            for (const [,node] of Object.entries(this.clusterState)) {
                if (node.state === 'connected') {
                    num += node[key];
                }
            }
        }

        return num;
    }

    private _findPort(nodeId: string) {
        return this.messaging.send({
            to: 'node_master',
            address: nodeId,
            message: 'cluster:node:get_port',
            response: true
        });
    }

    // designed to allocate additional workers, not any future slicers
    async allocateWorkers(execution: ExecutionConfig, numOfWorkersRequested: number) {
        const exId = execution.ex_id;
        const jobId = execution.job_id;
        const jobStr = JSON.stringify(execution);
        const sortedNodes = orderBy(this.clusterState, 'available', 'desc');
        let workersRequested = numOfWorkersRequested;
        let availWorkers = this._availableWorkers(false, true);

        const dispatch = new Dispatch();

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
            this.logger.trace(`adding worker to pending queue for ex: ${exId}`);
            this.pendingWorkerRequests.enqueue(workerData);
            workersRequested -= 1;
        }
        const results: any[] = [];

        for (const [nodeId, workerCount] of Object.entries(dispatch.getDispatch())) {
            const requestedWorkersData = {
                job: jobStr,
                id: exId,
                ex_id: exId,
                job_id: jobId,
                workers: workerCount,
                assignment: 'worker'
            };

            const createRequest = this.messaging.send({
                to: 'node_master',
                address: nodeId,
                message: 'cluster:workers:create',
                payload: requestedWorkersData,
                response: true
            }).then((msg) => {
                const createdWorkers = get(msg, 'payload.createdWorkers') as unknown as number;
                if (!isInteger(createdWorkers)) {
                    this.logger.error(`malformed response from create workers request to node ${nodeId}`, msg);
                    return;
                }
                if (createdWorkers < workerCount) {
                    this.logger.warn(`node ${nodeId} was only able to allocate ${createdWorkers} the request worker count of ${workerCount}, enqueing the remainder`);
                    const newWorkersRequest = cloneDeep(requestedWorkersData);
                    newWorkersRequest.workers = workerCount - createdWorkers;
                    this.pendingWorkerRequests.enqueue(newWorkersRequest);
                } else {
                    this.logger.debug(`node ${nodeId} allocated ${createdWorkers}`);
                }
            })
                .catch((err) => {
                    this.logger.error(err, `An error has occurred in allocating : ${workerCount} workers to node : ${nodeId}, the worker request has been enqueued`);
                    this.pendingWorkerRequests.enqueue(requestedWorkersData);
                });

            results.push(createRequest);
        }

        // this will resolve successfully if one worker was actually allocated
        return Promise.all(results);
    }

    private async _createSlicer(ex: ExecutionConfig, errorNodes: Record<string, any>) {
        const execution = cloneDeep(ex);
        const sortedNodes = orderBy(this.clusterState, 'available', 'desc');
        const slicerNodeID = this._findNodeForSlicer(sortedNodes, errorNodes);

        // need to mutate job so that workers will know the specific port and
        // hostname of the created slicer
        const portObj = await this._findPort(slicerNodeID) as any;
        execution.slicer_port = portObj.port;
        execution.slicer_hostname = this.clusterState[slicerNodeID].hostname;

        this.logger.debug(`node ${this.clusterState[slicerNodeID].hostname} has been elected for slicer, listening on port: ${portObj.port}`);

        const exId = execution.ex_id;
        const jobId = execution.job_id;
        const jobStr = JSON.stringify(execution);

        const data = {
            job: jobStr,
            ex_id: exId,
            job_id: jobId,
            workers: 1,
            slicer_port: portObj.port,
            node_id: slicerNodeID,
            assignment: 'execution_controller'
        };

        try {
            await this.messaging.send({
                to: 'node_master',
                address: slicerNodeID,
                message: 'cluster:execution_controller:create',
                payload: data,
                response: true
            });
            return execution;
        } catch (err) {
            const error = new TSError(err, {
                reason: `failed to allocate execution_controller to ${slicerNodeID}`
            });
            this.logger.error(error);
            errorNodes[slicerNodeID] = getFullErrorStack(error);
            throw err;
        }
    }

    async allocateSlicer(ex: ExecutionConfig): Promise<ExecutionConfig> {
        let retryCount = 0;
        const errorNodes = {};

        const _allocateSlicer = async () => {
            try {
                return await this._createSlicer(ex, errorNodes);
            } catch (err) {
                retryCount += 1;
                if (retryCount >= this.slicerAllocationAttempts) {
                    throw new Error(`Failed to allocate execution_controller to nodes: ${JSON.stringify(errorNodes)}`);
                } else {
                    await pDelay(100);
                    return _allocateSlicer();
                }
            }
        };
        return _allocateSlicer();
    }

    addWorkers(execution: any, workerNum: number) {
        const workerData = {
            job: JSON.stringify(execution),
            id: execution.ex_id,
            ex_id: execution.ex_id,
            job_id: execution.job_id,
            workers: workerNum,
            assignment: 'worker'
        };
        this.pendingWorkerRequests.enqueue(workerData);
        return { action: 'enqueued', ex_id: execution.ex_id, workerNum };
    }

    setWorkers(execution: any, workerNum: number) {
        const totalWorker = findWorkersByExecutionID(
            this.clusterState,
            execution.ex_id
        ).length;
        if (totalWorker > workerNum) {
            const removedWorkersCount = totalWorker - workerNum;
            return this.removeWorkers(execution.ex_id, removedWorkersCount);
        }
        if (totalWorker < workerNum) {
            const addWorkersCount = workerNum - totalWorker;
            return this.addWorkers(execution, addWorkersCount);
        }
        // if they are equal then no work needs to be done
        return { action: 'set', ex_id: execution.ex_id, workerNum };
    }

    removeWorkers(exId: string, workerNum: number) {
        const dispatch = new Dispatch();
        const workers = findWorkersByExecutionID(this.clusterState, exId);
        let workerCount = workerNum;

        const workersData = workers.reduce((prev: Record<string, any>, curr) => {
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
            const error = new TSError(errMsg, {
                statusCode: 400,
            });
            this.logger.error(error);
            return Promise.reject(error);
        }

        while (workerCount) {
            for (const [key] of Object.entries(workersData)) {
                if (key !== '_total') {
                    if (workersData[key] >= 1 && workerCount > 0) {
                        dispatch.set(key, 1);
                        workersData[key] -= 1;
                        workerCount -= 1;
                    }
                }
            }
        }

        const nodes = dispatch.getDispatch();
        const messagesSent = [];

        for (const [key, val] of Object.entries(nodes)) {
            messagesSent.push(
                this.messaging.send({
                    to: 'node_master',
                    address: key,
                    message: 'cluster:workers:remove',
                    ex_id: exId,
                    payload: { workers: val },
                    response: true
                })
            );
        }

        return Promise.all(messagesSent)
            .then(() => ({ action: 'remove', ex_id: exId, workerNum }))
            .catch((err) => {
                const error = new TSError(err, {
                    reason: `Error while releasing workers from job ${exId}`
                });
                this.logger.error(error);
                return Promise.reject(error);
            });
    }

    private _notifyNodesWithExecution(exId: string, messageData: any, excludeNode?: string) {
        return new Promise((resolve, reject) => {
            let nodes = this._findNodesForExecution(exId);

            if (excludeNode) {
                nodes = nodes.filter((node) => node.hostname !== excludeNode);
            } else if (messageData.message !== 'cluster:execution:stop' && nodes.length === 0) {
                // exclude node is only in regards to a shutdown on the cluster_master, which
                // already receives the shutdown notice so it can be empty, in all other
                // circumstances if the node list length is zero then reject
                const error = new TSError(`Could not find active execution processes for ex_id: ${exId}`);
                error.statusCode = 404;
                reject(error);
                return;
            }

            const promises = nodes.map((node) => {
                const sendingMsg = Object.assign(messageData, {
                    to: 'node_master',
                    address: node.node_id,
                    ex_id: exId,
                    response: false
                });

                this.logger.trace(`notifying node ${node.node_id} to stop execution ${exId}`, sendingMsg);

                return this.messaging.send(sendingMsg);
            });

            Promise.all(promises)
                .then(() => {
                    resolve(true);
                })
                .catch((err) => {
                    const error = new Error(`Failure to notify node with execution ${exId}, caused by ${err.message}`);
                    this.logger.error(error);
                    reject(error);
                });
        });
    }

    readyForAllocation() {
        return this._availableWorkers() >= 2;
    }

    clusterAvailable() {}

    async stopExecution(exId: string, options?: StopExecutionOptions) {
        // we are allowing stopExecution to be non blocking, we block at api level
        this.pendingWorkerRequests.remove(exId, 'ex_id');
        const sendingMessage = { message: 'cluster:execution:stop' } as Record<string, any>;

        if (options?.timeout) {
            sendingMessage.timeout = options.timeout;
        }
        return this._notifyNodesWithExecution(exId, sendingMessage, options?.excludeNode);
    }

    async shutdown() {
        clearInterval(this.clusterStateInterval);

        this.logger.info('native clustering shutting down');
        if (this.messaging) {
            await this.messaging.shutdown();
        } else {
            await pDelay(100);
        }
    }

    async listResourcesForJobId() {
        return [];
    }
}
