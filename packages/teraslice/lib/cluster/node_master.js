'use strict';

const Promise = require('bluebird');
const Queue = require('@terascope/queue');
const _ = require('lodash');
const parseError = require('@terascope/error-parser');
const messageModule = require('./services/messaging');
const spawnAssetsLoader = require('./assets/spawn');
const { safeEncode } = require('../utils/encoding_utils');

const nodeVersion = process.version;
const terasliceVersion = require('../../package.json').version;

// setting assignment
process.env.assignment = 'node_master';

module.exports = function module(context) {
    const logger = context.apis.foundation.makeLogger({ module: 'node_master' });
    const configWorkerLimit = context.sysconfig.teraslice.workers;
    const config = context.sysconfig.teraslice;
    const events = context.apis.foundation.getSystemEvents();
    const systemPorts = portAllocator();

    const messaging = messageModule(context, logger);
    const host = messaging.getHostUrl();

    logger.info(`node ${context.sysconfig._nodeName} is attempting to connect to cluster_master: ${host}`);

    const sendNodeState = _.debounce(() => {
        const state = getNodeState();
        messaging.send({
            to: 'cluster_master', message: 'node:state', node_id: state.node_id, payload: state
        });
    }, 500, { leading: false, trailing: true });

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
        callback: err => logger.warn(`Attempting to connect to cluster_master: ${host}`, err)
    });

    messaging.register({
        event: 'cluster:execution_controller:create',
        callback: (createSlicerRequest) => {
            const createSlicerMsg = createSlicerRequest.payload;

            const controllerContext = {
                assignment: 'execution_controller',
                NODE_TYPE: 'execution_controller',
                EX: safeEncode(createSlicerMsg.job),
                job: createSlicerMsg.job,
                node_id: context.sysconfig._nodeName,
                ex_id: createSlicerMsg.ex_id,
                job_id: createSlicerMsg.job_id,
                slicer_port: createSlicerMsg.slicer_port
            };

            preloadAssetsIfNeeded(createSlicerMsg.job, createSlicerMsg.ex_id)
                .then(() => {
                    logger.trace('starting a execution controller', controllerContext);
                    context.foundation.startWorkers(1, controllerContext);
                    return messaging.respond(createSlicerRequest);
                })
                .catch((err) => {
                    logger.error('error loading assets', err);
                    return messaging.respond(createSlicerRequest, {
                        error: parseError(err),
                    });
                }).finally(() => {
                    // need to update cluster_master immediately so it can balance workers correctly
                    // and prevent wrong allocations
                    const state = getNodeState();
                    messaging.send({
                        to: 'cluster_master',
                        message: 'node:state',
                        node_id: state.node_id,
                        payload: state
                    });
                });
        }
    });

    messaging.register({
        event: 'cluster:workers:create',
        callback: (createWorkerRequest) => {
            const createWorkerMsg = createWorkerRequest.payload;
            const numOfCurrentWorkers = Object.keys(context.cluster.workers).length;
            let newWorkers = createWorkerMsg.workers;
            logger.info(`Attempting to allocate ${newWorkers} workers.`);

            // if there is an over allocation, send back rest to be enqueued
            if (configWorkerLimit < numOfCurrentWorkers + newWorkers) {
                newWorkers = configWorkerLimit - numOfCurrentWorkers;

                // mutative
                createWorkerMsg.workers -= newWorkers;
                messaging.send({ to: 'cluster_master', message: 'node:workers:over_allocated', payload: createWorkerMsg });
                logger.warn(`Worker allocation request would exceed maximum number of workers - ${configWorkerLimit}`);
                logger.warn(`Reducing allocation to ${newWorkers} workers.`);
                return;
            }

            logger.trace(`starting ${newWorkers} workers`, createWorkerMsg.ex_id);

            preloadAssetsIfNeeded(createWorkerMsg.job, createWorkerMsg.ex_id)
                .then(() => {
                    context.foundation.startWorkers(newWorkers, {
                        NODE_TYPE: 'worker',
                        EX: safeEncode(createWorkerMsg.job),
                        assignment: 'worker',
                        node_id: context.sysconfig._nodeName,
                        job: createWorkerMsg.job,
                        ex_id: createWorkerMsg.ex_id,
                        job_id: createWorkerMsg.job_id
                    });
                    return messaging.respond(createWorkerRequest);
                })
                .catch((err) => {
                    logger.error('error loading assets', err);
                    return messaging.respond(createWorkerRequest, {
                        error: parseError(err),
                    });
                });
        }
    });

    messaging.register({ event: 'cluster:node:state', callback: () => sendNodeState() });

    // this fires when entire server will be shutdown
    events.once('terafoundation:shutdown', () => {
        const filterFn = () => context.cluster.workers;
        const alreadySentShutdownMessage = true;
        function actionCompleteFn() {
            return getNodeState().active.length === 0;
        }
        const stopTime = config.shutdown_timeout;

        shutdownProcesses({}, stopTime, filterFn, actionCompleteFn, alreadySentShutdownMessage);
    });

    messaging.register({
        event: 'cluster:execution:stop',
        callback: (networkMsg) => {
            const filterFn = () => _.filter(
                context.cluster.workers,
                worker => worker.ex_id === networkMsg.ex_id
            );
            function actionCompleteFn() {
                const children = getNodeState().active;
                const workers = _.filter(children, worker => worker.ex_id === networkMsg.ex_id);
                logger.debug(`waiting for ${workers.length} to stop for ex: ${networkMsg.ex_id}`);
                return workers.length === 0;
            }
            const stopTime = networkMsg.timeout || config.action_timeout;

            shutdownProcesses(networkMsg, stopTime, filterFn, actionCompleteFn);
        }
    });

    messaging.register({
        event: 'cluster:workers:remove',
        callback: (networkMsg) => {
            const numberToRemove = networkMsg.payload.workers;
            const children = getNodeState().active;
            const startingWorkerCount = _.filter(children, worker => worker.ex_id === networkMsg.ex_id && worker.assignment === 'worker').length;
            const stopTime = config.shutdown_timeout;
            const filterFn = () => _.filter(
                children,
                worker => worker.ex_id === networkMsg.ex_id && worker.assignment === 'worker'
            ).slice(0, numberToRemove);

            function actionCompleteFn() {
                const childWorkers = getNodeState().active;
                const currentWorkersForJob = _.filter(childWorkers, worker => worker.ex_id === networkMsg.ex_id && worker.assignment === 'worker').length;
                return currentWorkersForJob + numberToRemove <= startingWorkerCount;
            }

            shutdownProcesses(networkMsg, stopTime, filterFn, actionCompleteFn);
        }
    });

    // used to find an open port for slicer
    messaging.register({
        event: 'cluster:node:get_port',
        callback: (msg) => {
            logger.debug(`assigning port ${msg.port} for new job`);
            messaging.respond(msg, { port: systemPorts.getPort() });
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

    function getAssetsFromJob(jobStr) {
        const job = typeof jobStr === 'string' ? JSON.parse(jobStr) : jobStr;
        return job.assets || [];
    }

    function preloadAssetsIfNeeded(job, exId) {
        const assets = getAssetsFromJob(job);
        if (assets.length > 0) {
            logger.info(`node ${context.sysconfig._nodeName} is checking assets for job, exId: ${exId}`);
            return Promise.resolve(spawnAssetsLoader(assets));
        }
        return Promise.resolve();
    }

    function sendSignalToWorkers(signal, filterFn) {
        const allWorkersForJob = filterFn();
        _.each(allWorkersForJob, (worker) => {
            const workerID = worker.worker_id || worker.id;
            if (context.cluster.workers[workerID]) {
                logger.warn(`sending ${signal} to process ${worker.id}, assignment: ${worker.assignment}, ex_id: ${worker.ex_id}`);
                context.cluster.workers[workerID].process.kill(signal);
            }
        });
    }

    function shutdownProcesses(message, stoppingTime, filterFn, isActionCompleteFn, alreadySent) {
        const intervalTime = 200;
        const needsResponse = message.response && message.to;
        let stopTime = stoppingTime;

        if (!alreadySent) {
            sendSignalToWorkers('SIGTERM', filterFn);
        }
        const stop = setInterval(() => {
            if (isActionCompleteFn()) {
                clearInterval(stop);
                if (needsResponse) messaging.respond(message);
            }
            if (stopTime <= 0) {
                clearInterval(stop);
                sendSignalToWorkers('SIGKILL', filterFn);
                if (needsResponse) messaging.respond(message);
            }

            stopTime -= intervalTime;
        }, intervalTime);
    }

    function portAllocator() {
        const portConfig = config.slicer_port_range;
        const dataArray = _.split(portConfig, ':');
        const start = _.toInteger(dataArray[0]);
        // range end is non-inclusive, so we need to add one
        const end = _.toInteger(dataArray[1]) + 1;
        const portQueue = new Queue();

        // shuffle all of the ports at random
        const ports = _.shuffle(_.range(start, end));
        _.forEach(ports, (i) => {
            portQueue.enqueue(i);
        });

        function getPort(preventEnqueing) {
            const port = portQueue.dequeue();
            if (!preventEnqueing) {
                portQueue.enqueue(port);
            }
            return port;
        }

        return {
            getPort
        };
    }

    function getNodeState() {
        let nodeId;

        if (context.sysconfig.teraslice.cluster_manager_type === 'kubernetes') {
            if (process.env.POD_IP === undefined) {
                nodeId = context.sysconfig._nodeName;
            } else {
                // this enviroment variable needs to be set by the deployment
                nodeId = process.env.POD_IP;
            }
        } else {
            nodeId = context.sysconfig._nodeName;
        }

        const state = {
            node_id: nodeId,
            hostname: context.sysconfig.teraslice.hostname,
            pid: process.pid,
            node_version: nodeVersion,
            teraslice_version: terasliceVersion,
            total: context.sysconfig.teraslice.workers,
            state: 'connected'
        };
        const clusterWorkers = context.cluster.workers;
        const active = [];

        _.forOwn(clusterWorkers, (worker) => {
            const child = {
                worker_id: worker.id,
                assignment: worker.assignment,
                pid: worker.process.pid
            };

            if (worker.ex_id) {
                child.ex_id = worker.ex_id;
            }

            if (worker.job_id) {
                child.job_id = worker.job_id;
            }

            if (worker.assets) {
                child.assets = worker.assets.map(asset => asset.id);
            }

            active.push(child);
        });

        state.available = state.total - active.length;
        state.active = active;

        return state;
    }

    messaging.listen({
        query: {
            node_id: context.sysconfig._nodeName
        }
    });

    if (context.sysconfig.teraslice.master) {
        const assetsPort = systemPorts.getPort(true);

        logger.debug(`node ${context.sysconfig._nodeName} is creating the cluster_master`);
        context.foundation.startWorkers(1, {
            assignment: 'cluster_master',
            assets_port: assetsPort,
            node_id: context.sysconfig._nodeName
        });

        logger.debug(`node ${context.sysconfig._nodeName} is creating assets endpoint on port ${assetsPort}`);
        context.foundation.startWorkers(1, {
            assignment: 'assets_service',
            // key needs to be called port to bypass cluster port sharing
            port: assetsPort,
            node_id: context.sysconfig._nodeName
        });
    }
};
