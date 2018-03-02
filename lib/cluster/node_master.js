'use strict';

const Queue = require('queue');

const _ = require('lodash');
const messageModule = require('./services/messaging');
const parseError = require('error_parser');
const deleteDir = require('../utils/file_utils').deleteDir;
const existsSync = require('../utils/file_utils').existsSync;

const nodeVersion = process.version;
const terasliceVersion = require('../../package.json').version;

// setting assignment
process.env.assignment = 'node_master';


module.exports = function module(context) {
    const logger = context.apis.foundation.makeLogger({ module: 'node_master' });
    const configWorkerLimit = context.sysconfig.teraslice.workers;
    const systemPorts = portAllocator();
    const config = context.sysconfig.teraslice;
    const assetsPath = config.assets_directory;
    const events = context.apis.foundation.getSystemEvents();
    const assetsDir = context.sysconfig.teraslice.assets_directory;
    const pendingWorkerRequests = {};

    const messaging = messageModule(context, logger);
    const host = messaging.getHostUrl();

    const sendNodeState = _.debounce(() => {
        const state = getNodeState();
        messaging.send({
            to: 'cluster_master',
            message: 'node:state',
            node_id: state.node_id,
            payload: state
        });
    }, 500, { leading: false, trailing: true });

    messaging.registerChildOnlineHook(sendNodeState);
    logger.info(`node ${context.sysconfig._nodeName} is attempting to connect to cluster_master: ${host}`);

    function messageWorkers(clusterMsg, processMsg, filterFn) {
        // sharing the unique msg id for each message sent
        processMsg.__msgId = clusterMsg.__msgId;

        const allWorkersForJob = filterFn();
        _.each(allWorkersForJob, (worker) => {
            logger.trace(`sending message to worker ${worker.id}, ex_id: ${worker.ex_id}, msg:`, processMsg);
            worker.send(processMsg);
        });
    }

    messaging.register({
        event: 'network:connect',
        callback: () => {
            logger.info(`node has successfully connected to: ${host}`);
            const state = getNodeState();
            messaging.send({ to: 'cluster_master', message: 'node:online', node_id: state.node_id, payload: state });
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
        event: 'assets:delete',
        callback: (deleteMsg) => {
            const assetId = deleteMsg.payload;
            deleteDir(`${assetsPath}/${assetId}`)
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error(errMsg);
                });
        }
    });

    messaging.register({
        event: 'execution_service:verify_assets',
        callback: (loadMsg) => {
            context.foundation.startWorkers(1, {
                assignment: 'assets_loader',
                node_id: context.sysconfig._nodeName,
                preload: true,
                __msgId: loadMsg.__msgId,
                job: JSON.stringify(loadMsg.payload)
            });
        }
    });

    messaging.register({
        event: 'cluster:execution_controller:create',
        callback: (createSlicerRequest) => {
            const createSlicerMsg = createSlicerRequest.payload;

            const request = {
                assignment: 'execution_controller',
                job: createSlicerMsg.job,
                node_id: context.sysconfig._nodeName,
                ex_id: createSlicerMsg.ex_id,
                job_id: createSlicerMsg.job_id,
                slicer_port: createSlicerMsg.slicer_port
            };
            // used to retry a job on startup after a stop command
            if (createSlicerMsg.recover_execution) {
                request.recover_execution = createSlicerMsg.recover_execution;
            }

            _setupExecutionProcesses(request, createSlicerRequest);
        }
    });

    messaging.register({
        event: 'cluster:workers:create',
        callback: (createWorkerRequest) => {
            const createWorkerMsg = createWorkerRequest.payload;
            const request = {
                assignment: 'worker',
                node_id: context.sysconfig._nodeName,
                job: createWorkerMsg.job,
                ex_id: createWorkerMsg.ex_id,
                job_id: createWorkerMsg.job_id
            };

            _setupExecutionProcesses(request, createWorkerRequest);
        }
    });

    messaging.register({ event: 'cluster:node:state', callback: () => sendNodeState() });

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
                context.cluster.workers,
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
                .then(() => process.exit());
        }
    });

    messaging.register({
        event: 'child:exit',
        callback: () => sendNodeState()
    });

    messaging.register({
        event: 'assets:loaded',
        callback: (ipcMessage) => {
            if (ipcMessage.error) {
                if (pendingWorkerRequests[ipcMessage.payload.ex_id]) {
                    pendingWorkerRequests[ipcMessage.payload.ex_id].assets_loading = false;
                }
                logger.error(`Error while loading assets, error: ${ipcMessage.error}`);
            } else {
                const exId = ipcMessage.payload.ex_id;

                if (!pendingWorkerRequests[exId]) {
                    logger.error('Error while loading assets, no pending worker requests for exId');
                } else {
                    pendingWorkerRequests[exId].assets_loading = false;
                    const pending = pendingWorkerRequests[exId].pending;
                    // Clear this before processing just in case another request
                    // arrives before all workers allocate.
                    delete pendingWorkerRequests[exId];
                    pending.forEach((pendingContext) => {
                        _provisionProcesses(pendingContext.request, pendingContext.originalMessage);
                    });
                }
            }
        }
    });

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

    function _assetsExistForJob(jobStr) {
        const job = typeof jobStr === 'string' ? JSON.parse(jobStr) : jobStr;

        if (job.assets && job.assets.length > 0) {
            // if not all assets are loaded, return false
            if (!_.every(job.assets, assetId => existsSync(`${assetsDir}/${assetId}`))) {
                return false;
            }
        }
        return true;
    }

    function _provisionProcesses(request, originalMessage) {
        if (request.assignment === 'execution_controller') {
            context.foundation.startWorkers(1, request);
            // need to update cluster_master immediately so it can balance workers correctly
            // and prevent wrong allocations
            const state = getNodeState();
            messaging.send({ to: 'cluster_master', message: 'node:state', node_id: state.node_id, payload: state });
        } else {
            const numOfCurrentWorkers = Object.keys(context.cluster.workers).length;
            let workerCount = originalMessage.payload.workers;
            const type = request.assignment === 'worker' ? 'workers' : request.assignment;
            logger.info(`Attempting to allocate ${workerCount} ${type}.`);

            // if there is an over allocation, send back rest to be enqueued
            if (configWorkerLimit < numOfCurrentWorkers + workerCount) {
                workerCount = configWorkerLimit - numOfCurrentWorkers;

                // mutative
                originalMessage.workers = workerCount;
                messaging.send({ to: 'cluster_master', message: 'node:workers:over_allocated', payload: originalMessage });
                logger.warn(`Worker allocation request would exceed maximum number of workers - ${configWorkerLimit}`);
                logger.warn(`Reducing allocation to ${workerCount} workers.`);
            }

            context.foundation.startWorkers(workerCount, request);
        }
        // respond that child processes where made
        messaging.respond(originalMessage);
    }

    function _setupExecutionProcesses(request, originalMessage) {
        // assets already exist, provision workers/execution_controllers
        if (_assetsExistForJob(request.job)) {
            _provisionProcesses(request, originalMessage);
        } else {
            // Queue the worker request until after assets have completed loading.
            const sourceMsg = originalMessage.payload;
            _queueWorkerRequest(originalMessage, request);
            _loadAssets(sourceMsg.job, sourceMsg.ex_id);
        }
    }

    function _queueWorkerRequest(originalMessage, request) {
        if (!pendingWorkerRequests[request.ex_id]) {
            _.set(pendingWorkerRequests, `${request.ex_id}.pending`, []);
            _.set(pendingWorkerRequests, `${request.ex_id}.assets_loading`, false);
        }

        pendingWorkerRequests[request.ex_id].pending.push({
            request,
            originalMessage
        });
    }

    function killWorkers(filterFn) {
        const allWorkersForJob = filterFn();
        _.each(allWorkersForJob, (worker) => {
            logger.warn(`sending SIGKILL to process ${worker.process.pid}, assignment: ${worker.assignment}, ex_id: ${worker.ex_id}`);
            worker.process.kill('SIGKILL');
        });
    }

    function shutdownProcesses(message, stoppingTime, filterFn, isActionCompleteFn, alreadySent) {
        const intervalTime = 200;
        const needsResponse = message.response && message.to;
        let stopTime = stoppingTime;

        if (!alreadySent) messageWorkers(message, { message: 'worker:shutdown' }, filterFn);
        const stop = setInterval(() => {
            if (isActionCompleteFn()) {
                clearInterval(stop);
                if (needsResponse) messaging.respond(message);
            }
            if (stopTime <= 0) {
                clearInterval(stop);
                killWorkers(filterFn);
                if (needsResponse) messaging.respond(message);
            }

            stopTime -= intervalTime;
        }, intervalTime);
    }

    function portAllocator() {
        const portConfig = context.sysconfig.teraslice.slicer_port_range;
        const dataArray = portConfig.split(':');
        const start = Number(dataArray[0]);
        const end = Number(dataArray[1]) + 1; // range end is non-inclusive, so we need to add one
        const portQueue = new Queue();

        for (let i = start; i < end; i += 1) {
            portQueue.enqueue(i);
        }

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
        const state = {
            node_id: context.sysconfig._nodeName,
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

    function _loadAssets(job, exId) {
        // for workers on nodes that don't have the asset loading process already going
        if (!pendingWorkerRequests[exId].assets_loading) {
            pendingWorkerRequests[exId].assets_loading = true;

            logger.info(`node ${context.sysconfig._nodeName} is checking assets for job ${exId}`);
            context.foundation.startWorkers(1, {
                assignment: 'assets_loader',
                node_id: context.sysconfig._nodeName,
                job,
                ex_id: exId
            });
        }
    }

    messaging.listen();

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

    if (context.sysconfig.teraslice.cluster_manager_type === 'kubernetes') {
        const workerType = process.env.node_type;
        const jobStr = process.env.EX;
        let ex;

        try {
            ex = JSON.parse(jobStr);
        } catch (err) {
            const errMsg = parseError(err);
            logger.error(`error while loading EX from enviroment, error: ${errMsg}`);
            // give it time to log before exiting
            setTimeout(() => process.exit(), 100);
        }

        const request = {
            assignment: workerType,
            job: jobStr,
            node_id: context.sysconfig._nodeName,
            ex_id: ex.ex_id,
            job_id: ex.job_id,
            slicer_port: ex.slicer_port
        };
        // TODO need to set recover_execution somehow
        // used to retry a job on startup after a stop command
        if (ex.recover_execution && workerType === 'execution_controller') {
            request.recover_execution = ex.recover_execution;
        }
        const kubernetesCreationMsg = { payload: { job: jobStr, ex_id: ex.ex_id } };
        // Queue the worker request until after assets have completed loading.
        _setupExecutionProcesses(request, kubernetesCreationMsg);
    }
};
