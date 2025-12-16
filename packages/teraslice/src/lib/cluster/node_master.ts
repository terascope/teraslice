import ms from 'ms';
import { Mutex } from 'async-mutex';
import {
    getFullErrorStack, debounce, isEmpty, has
} from '@terascope/core-utils';
import {
    AssetsServiceEnv, ClusterMasterEnv, Terafoundation,
    TSExecutionControllerEnv, TSWorkerEnv
} from '@terascope/types';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import { Messaging } from './services/cluster/backends/native/messaging.js';
import { spawnAssetLoader } from '../workers/assets/spawn.js';
import { safeEncode } from '../utils/encoding_utils.js';
import { findPort, getPorts } from '../utils/port_utils.js';
import { getPackageJSON } from '../utils/file_utils.js';
import { ClusterMasterContext, NodeState, WorkerNode } from '../../interfaces.js';

const nodeVersion = process.version;
const terasliceVersion = getPackageJSON().version;

export async function nodeMaster(context: ClusterMasterContext) {
    const logger = makeLogger(context, 'node_master');
    const configWorkerLimit = context.sysconfig.teraslice.workers;
    const config = context.sysconfig.teraslice;
    const events = context.apis.foundation.getSystemEvents();
    const mutex = new Mutex();

    const messaging = new Messaging(context, logger);
    const host = messaging.getHostUrl();
    const isShuttingDown = false;
    const ports = getPorts(context);

    logger.info(`node ${context.sysconfig._nodeName} is attempting to connect to cluster_master: ${host}`);

    function sendNodeStateNow() {
        if (isShuttingDown) return;
        const state = getNodeState();
        messaging.send({
            to: 'cluster_master',
            message: 'node:state',
            node_id: state.node_id,
            payload: state
        });
    }

    const sendNodeState = debounce(sendNodeStateNow, 500, { leading: false, trailing: true });

    let pendingAllocations = 0;

    function allocateWorkers(
        count: number,
        exConfig: Record<string, any>,
        fn: () => Promise<any>
    ) {
        const startTime = Date.now();
        pendingAllocations += count;
        sendNodeStateNow();
        const locked = mutex.isLocked() ? ' (locked)' : '';
        logger.info(`allocating ${count} workers...${locked}`);

        return mutex.runExclusive(async () => {
            try {
                await loadAssetsIfNeeded(exConfig.job, exConfig.ex_id);
            } catch (err) {
                logger.error(`Failure to allocated assets for execution ${exConfig.ex_id}`);
                throw err;
            } finally {
                pendingAllocations -= count;
            }

            try {
                const workers = await fn();
                const elapsed = Date.now() - startTime;
                if (workers.length === count) {
                    logger.info(`allocated ${workers.length} workers, took ${ms(elapsed)}`);
                } else {
                    logger.info(`allocated ${workers.length} out of the requested ${count} workers, took ${ms(elapsed)}`);
                }
                return workers.length;
            } catch (err) {
                logger.error(`Failure to allocate workers for execution ${exConfig.ex_id}`);
                throw err;
            }
        });
    }

    function canAllocateWorkers(requestedWorkers: number) {
        const numOfCurrentWorkers = Object.keys(context.cluster.workers).length;
        // if there is an over allocation, send back rest to be enqueued
        if (configWorkerLimit < numOfCurrentWorkers + requestedWorkers) {
            return configWorkerLimit - numOfCurrentWorkers > 0;
        }
        return true;
    }

    messaging.registerChildOnlineHook(sendNodeState);

    messaging.register({
        event: 'network:connect',
        callback: () => {
            logger.info(`node has successfully connected to: ${host}`);
            const state = getNodeState();
            messaging.send({
                to: 'cluster_master', message: 'node:online', node_id: state.node_id, payload: state
            });
        }
    });

    messaging.register({
        event: 'network:disconnect',
        callback: () => logger.info(`node has disconnected from: ${host}`)
    });

    messaging.register({
        event: 'network:error',
        callback: (err: Error) => logger.warn(err, `Attempting to connect to cluster_master: ${host}`)
    });

    messaging.register({
        event: 'cluster:execution_controller:create',
        // TODO: type this
        callback: (createSlicerRequest: Record<string, any>) => {
            const createSlicerMsg = createSlicerRequest.payload;
            logger.info(`starting execution_controller for execution ${createSlicerMsg.ex_id}...`);

            allocateWorkers(1, createSlicerMsg, async () => {
                const controllerContext = {
                    assignment: 'execution_controller',
                    NODE_TYPE: 'execution_controller',
                    EX: safeEncode(createSlicerMsg.job),
                    job: createSlicerMsg.job,
                    node_id: context.sysconfig._nodeName,
                    ex_id: createSlicerMsg.ex_id,
                    job_id: createSlicerMsg.job_id,
                    slicer_port: createSlicerMsg.slicer_port
                } satisfies TSExecutionControllerEnv;
                logger.trace('starting a execution controller', controllerContext);

                return context.apis.foundation.startWorkers(1, controllerContext);
            })
                .then(() => messaging.respond(createSlicerRequest))
                .catch((error) => {
                    messaging.respond(createSlicerRequest, {
                        error: getFullErrorStack(error),
                    });
                });
        }
    });

    messaging.register({
        event: 'cluster:workers:create',
        callback: (createWorkerRequest: Record<string, any>) => {
            const createWorkerMsg = createWorkerRequest.payload;
            const requestedWorkers = createWorkerMsg.workers;
            logger.info(`starting ${requestedWorkers} workers for execution ${createWorkerMsg.ex_id}...`);

            if (!canAllocateWorkers(requestedWorkers)) {
                logger.warn(`worker is overallocated, maximum number of workers of ${configWorkerLimit}`);
                messaging.respond(createWorkerRequest, {
                    payload: {
                        createdWorkers: 0,
                    }
                });
                return;
            }

            allocateWorkers(requestedWorkers, createWorkerMsg, async () => {
                let newWorkers = requestedWorkers;

                const numOfCurrentWorkers = Object.keys(context.cluster.workers).length;
                // if there is an over allocation, send back rest to be enqueued
                if (configWorkerLimit < numOfCurrentWorkers + requestedWorkers) {
                    newWorkers = configWorkerLimit - numOfCurrentWorkers;
                    logger.warn(`worker allocation request would exceed maximum number of workers of ${configWorkerLimit}`);
                    logger.warn(`reducing allocation to ${newWorkers} workers.`);
                }

                let workers: Terafoundation.FoundationWorker[] = [];
                if (newWorkers > 0) {
                    logger.trace(`starting ${newWorkers} workers`, createWorkerMsg.ex_id);

                    workers = context.apis.foundation.startWorkers(newWorkers, {
                        NODE_TYPE: 'worker',
                        EX: safeEncode(createWorkerMsg.job),
                        assignment: 'worker',
                        node_id: context.sysconfig._nodeName,
                        job: createWorkerMsg.job,
                        ex_id: createWorkerMsg.ex_id,
                        job_id: createWorkerMsg.job_id
                    } satisfies TSWorkerEnv);
                }

                return workers;
            })
                .then((createdWorkers) => messaging.respond(createWorkerRequest, {
                    payload: {
                        createdWorkers,
                    }
                }))
                .catch(() => messaging.respond(createWorkerRequest, {
                    payload: {
                        createdWorkers: 0,
                    }
                }));
        }
    });

    messaging.register({ event: 'cluster:node:state', callback: () => sendNodeState() });

    // this fires when entire server will be shutdown
    events.once('terafoundation:shutdown', () => {
        logger.debug('received shutdown notice from terafoundation');
        const filterFn = () => context.cluster.workers;
        const isActionCompleteFn = () => isEmpty(getNodeState().active);
        shutdownProcesses({}, filterFn, isActionCompleteFn, true);
    });

    messaging.register({
        event: 'cluster:execution:stop',
        callback: (networkMsg: Record<string, any>) => {
            const exId = networkMsg.ex_id;
            logger.debug(`received cluster execution stop for execution ${exId}`);

            const filterFn = () => {
                return Object.values(context.cluster.workers)
                    .filter((worker: Record<string, any>) => {
                        return worker.ex_id === exId;
                    });
            };

            function actionCompleteFn() {
                const children = getNodeState().active;
                const workers = children.filter(
                    (worker: Record<string, any>) => worker.ex_id === exId
                );

                logger.debug(`waiting for ${workers.length} to stop for ex: ${exId}`);
                return workers.length === 0;
            }

            shutdownProcesses(networkMsg, filterFn, actionCompleteFn);
        }
    });

    messaging.register({
        event: 'cluster:workers:remove',
        callback: (networkMsg: Record<string, any>) => {
            const numberToRemove = networkMsg.payload.workers;
            const children = getNodeState().active;

            const startingWorkerCount = children.filter(
                (worker: Record<string, any>) => worker.ex_id === networkMsg.ex_id && worker.assignment === 'worker'
            ).length;

            const filterFn = () => children.filter(
                (worker: Record<string, any>) => worker.ex_id === networkMsg.ex_id && worker.assignment === 'worker'
            ).slice(0, numberToRemove);

            function actionCompleteFn() {
                const childWorkers = getNodeState().active;
                const currentWorkersForJob = childWorkers.filter(
                    (worker: Record<string, any>) => worker.ex_id === networkMsg.ex_id && worker.assignment === 'worker'
                ).length;

                return currentWorkersForJob + numberToRemove <= startingWorkerCount;
            }

            shutdownProcesses(networkMsg, filterFn, actionCompleteFn);
        }
    });

    // used to find an open port for slicer
    messaging.register({
        event: 'cluster:node:get_port',
        callback: async (msg: Record<string, any>) => {
            const port = await findPort(ports);
            logger.debug(`assigning port ${port} for new job`);
            messaging.respond(msg, { port });
        }
    });

    messaging.register({
        event: 'cluster:error:terminal',
        callback: () => {
            logger.error('terminal error in cluster_master, flushing logs and shutting down');
            logger.flush()
                .then(() => process.exit(0));
        }
    });

    messaging.register({
        event: 'child:exit',
        callback: () => sendNodeState()
    });

    function getAssetsFromJob(jobStr: string | Record<string, any>) {
        const job = typeof jobStr === 'string' ? JSON.parse(jobStr) : jobStr;
        return job.assets || [];
    }

    async function loadAssetsIfNeeded(job: Record<string, any>, exId: string) {
        const assets = getAssetsFromJob(job);
        if (!assets.length) return;

        logger.info(`node ${context.sysconfig._nodeName} is checking assets for job, exId: ${exId}`);
        await spawnAssetLoader(assets, context);
    }

    function shutdownWorkers(signal: string, filterFn: any) {
        const allWorkersForJob = filterFn();

        allWorkersForJob.forEach((worker: Record<string, any>) => {
            const workerID = worker.worker_id || worker.id;
            if (has(context.cluster.workers, workerID)) {
                const clusterWorker = context.cluster.workers[workerID];
                const processId = clusterWorker.process.pid;

                if (clusterWorker.isDead()) return;
                // if the worker has already been sent a SIGTERM signal it should send a SIGKILL
                logger.warn(`sending ${signal} to process ${processId}, assignment: ${worker.assignment}, ex_id: ${worker.ex_id}`);
                clusterWorker.kill(signal);
            }
        });
    }

    function shutdownProcesses(
        message: Record<string, any>,
        filterFn: any,
        isActionCompleteFn: any,
        onlySigKill = false) {
        const intervalTime = 200;
        const needsResponse = message.response && message.to;

        // give a little extra time to finish shutting down
        let stopTime = config.shutdown_timeout + 3000;

        if (!onlySigKill) {
            shutdownWorkers('SIGTERM', filterFn);
        }

        const stop = setInterval(() => {
            if (isActionCompleteFn()) {
                clearInterval(stop);
                if (needsResponse) messaging.respond(message);
            }
            if (stopTime <= 0) {
                clearInterval(stop);
                shutdownWorkers('SIGKILL', filterFn);
                if (needsResponse) messaging.respond(message);
            }

            stopTime -= intervalTime;
        }, intervalTime);
    }

    function getNodeState(): NodeState {
        const nodeId = context.sysconfig._nodeName;

        const state = {
            node_id: nodeId,
            hostname: context.sysconfig.teraslice.hostname,
            pid: process.pid,
            node_version: nodeVersion,
            teraslice_version: terasliceVersion,
            total: context.sysconfig.teraslice.workers,
            state: 'connected'
        } as Partial<NodeState>;

        const clusterWorkers = context.cluster.workers;
        const active: WorkerNode[] = [];

        Object.values(clusterWorkers).forEach((worker: Record<string, any>) => {
            const child = {
                worker_id: worker.id,
                assignment: worker.assignment,
                pid: worker.process.pid
            } as Record<string, any>;

            if (worker.ex_id) {
                child.ex_id = worker.ex_id;
            }

            if (worker.job_id) {
                child.job_id = worker.job_id;
            }

            if (worker.assets) {
                child.assets = worker.assets.map((asset: Record<string, any>) => asset.id);
            }

            active.push(child as WorkerNode);
        });

        const total = state.total as number;
        state.available = total - active.length - pendingAllocations;
        state.active = active;

        return state as NodeState;
    }

    messaging.listen({
        query: {
            node_id: context.sysconfig._nodeName
        }
    });

    if (context.sysconfig.teraslice.master) {
        logger.debug(`node ${context.sysconfig._nodeName} is creating the cluster_master`);

        const [clusterMaster] = context.apis.foundation.startWorkers(1, {
            assignment: 'cluster_master',
            assets_port: ports.assetsPort,
            node_id: context.sysconfig._nodeName
        } satisfies ClusterMasterEnv);

        clusterMaster.on('exit', (code: any) => {
            if (code !== 0) {
                throw Error(`Cluster master has shutdown with exit code ${code}!`);
            }
        });

        logger.debug(`node ${context.sysconfig._nodeName} is creating assets endpoint on port ${ports.assetsPort}`);

        const [assetService] = context.apis.foundation.startWorkers(1, {
            assignment: 'assets_service',
            // key needs to be called port to bypass cluster port sharing
            port: ports.assetsPort,
            node_id: context.sysconfig._nodeName
        } satisfies AssetsServiceEnv);

        assetService.on('exit', (code: any) => {
            if (code !== 0) {
                throw Error(`Asset Service has shutdown with exit code ${code}!`);
            }
        });
    }
}
