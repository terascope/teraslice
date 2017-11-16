'use strict';

const Queue = require('queue');

const newWorkerQueue = new Queue();
const _ = require('lodash');
const messageModule = require('./services/messaging');
const parseError = require('../utils/error_utils').parseError;
const deleteDir = require('../utils/file_utils').deleteDir;

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
    // Need sendNodeState before we instantiate messaging
    const sendNodeState = _.debounce(() => {
        const state = getNodeState();
        messaging.send({ to: 'cluster_master', message: 'node:state', node_id: state.node_id, payload: state });
    }, 500, { leading: false, trailing: true });

    const messaging = messageModule(context, logger, sendNodeState);
    const host = messaging.getHostUrl();

    logger.info(`node ${context.sysconfig._nodeName} is attempting to connect to cluster_master: ${host}`);

    function assetIsLoading(exId) {
        const workers = context.cluster.workers;
        const assetWorker = _.filter(workers, worker => worker.assignment === 'assets_loader' && worker.ex_id === exId);

        return assetWorker.length === 1;
    }

    function messageWorkers(clusterMsg, processMsg, filterFn, resultsFn) {
        const workers = context.cluster.workers;
        // sharing the unique msg id for each message sent
        processMsg.__msgId = clusterMsg.__msgId;

        const allWorkersForJob = _.filter(workers, filterFn);
        _.each(allWorkersForJob, (worker) => {
            if (resultsFn) {
                resultsFn(worker);
            }
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
        event: 'cluster:slicer:create',
        callback: (createSlicerRequest) => {
            const createSlicerMsg = createSlicerRequest.payload;
            const needAssets = jobNeedsAssets(createSlicerMsg.job);

            const slicerContext = {
                assignment: 'slicer',
                job: createSlicerMsg.job,
                node_id: context.sysconfig._nodeName,
                ex_id: createSlicerMsg.ex_id,
                job_id: createSlicerMsg.job_id,
                slicer_port: createSlicerMsg.slicer_port
            };
            // used to retry a job on startup after a stop command
            if (createSlicerMsg.recover_execution) {
                slicerContext.recover_execution = createSlicerMsg.recover_execution;
            }
            logger.trace('starting a slicer', slicerContext);
            context.foundation.startWorkers(1, slicerContext);

            if (needAssets) {
                logger.info(`node ${context.sysconfig._nodeName} is checking assets for job ${createSlicerMsg.ex_id}`);
                context.foundation.startWorkers(1, {
                    assignment: 'assets_loader',
                    node_id: context.sysconfig._nodeName,
                    job: createSlicerMsg.job,
                    ex_id: createSlicerMsg.ex_id
                });
            }

            // need to update cluster_master immediately so it can balance workers correctly
            // and prevent wrong allocations
            const state = getNodeState();
            messaging.send({ to: 'cluster_master', message: 'node:state', node_id: state.node_id, payload: state });
            messaging.respond(createSlicerRequest);
        }
    });

    messaging.register({
        event: 'cluster:workers:create',
        callback: (createWorkerRequest) => {
            const createWorkerMsg = createWorkerRequest.payload;
            const numOfCurrentWorkers = Object.keys(context.cluster.workers).length;
            const needAssets = jobNeedsAssets(createWorkerMsg.job);
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
            }
            logger.trace(`starting ${newWorkers} workers`, createWorkerMsg.ex_id);

            context.foundation.startWorkers(newWorkers, {
                assignment: 'worker',
                node_id: context.sysconfig._nodeName,
                job: createWorkerMsg.job,
                ex_id: createWorkerMsg.ex_id,
                job_id: createWorkerMsg.job_id
            });

            // for workers on nodes that don't have the asset loading process already going
            if (needAssets && !assetIsLoading(createWorkerMsg.ex_id)) {
                logger.info(`node ${context.sysconfig._nodeName} is checking assets for job ${createWorkerMsg.ex_id}`);
                context.foundation.startWorkers(1, {
                    assignment: 'assets_loader',
                    node_id: context.sysconfig._nodeName,
                    job: createWorkerMsg.job,
                    ex_id: createWorkerMsg.ex_id
                });
            }

            messaging.respond(createWorkerRequest);
        }
    });

    messaging.register({ event: 'cluster:node:state', callback: () => sendNodeState() });

    messaging.register({
        event: 'cluster:execution:stop',
        callback: (data) => {
            const intervalTime = 200;
            const filterFn = worker => worker.ex_id === data.ex_id;
            let stopTime = data.timeout || config.action_timeout;

            messageWorkers(data, { message: 'worker:shutdown' }, filterFn);
            // If this is coming from the api, we need to listen for it, else it just a blanket stop
            // and no reply is necessary
            if (data.response && data.to) {
                const stop = setInterval(() => {
                    const children = getNodeState().active;
                    const workersForJob = _.filter(children, worker => worker.ex_id === data.ex_id);
                    logger.debug(`waiting for ${workersForJob.length} to stop for ex: ${data.ex_id}`);
                    if (workersForJob.length === 0) {
                        clearInterval(stop);
                        logger.debug('workers have stopped, relaying process message signal');

                        messaging.respond(data);
                    }
                    // this is here for the sole purpose of cleanup of interval, top level promise
                    // will have rejected by now
                    if (stopTime <= 0) {
                        clearInterval(stop);
                        killWorkers(filterFn);
                        messaging.respond(data);
                    }

                    stopTime -= intervalTime;
                }, intervalTime);
            }
        }
    });

    messaging.register({
        event: 'cluster:workers:remove',
        callback: (networkCall) => {
            const data = networkCall.payload;
            let counter = data.workers;
            let stopTime = config.shutdown_timeout;
            const intervalTime = 200;
            const children = getNodeState();
            const workerCount = _.filter(children.active, worker => worker.ex_id === data.ex_id && worker.assignment === 'worker').length;
            const filterFn = (worker) => {
                if (worker.ex_id === data.ex_id && worker.assignment === 'worker' && counter > 0) {
                    counter -= 1;
                    return worker;
                }
                return false;
            };

            messageWorkers(data, { message: 'worker:shutdown' }, filterFn);

            const workerStop = setInterval(() => {
                const childWorkers = getNodeState().active;
                const workersForJob = _.filter(childWorkers, worker => worker.ex_id === data.ex_id && worker.assignment === 'worker');

                if (workersForJob.length + data.workers <= workerCount) {
                    clearInterval(workerStop);
                    messaging.respond(networkCall);
                }
                // this is here for the sole purpose of cleanup of interval, top level promise will
                // have rejected by now
                if (stopTime <= 0) {
                    clearInterval(workerStop);
                    // resetting counter so filterFn can work
                    counter = data.workers;
                    killWorkers(filterFn);
                    messaging.respond(data);
                }

                stopTime -= intervalTime;
            }, intervalTime);
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
        callback: (worker) => {
            // reclaim ports
            if (worker.slicer_port) {
                logger.debug(`reclaiming port ${worker.slicer_port} from slicer exit`);
                // reclaim port if slicer exits, if slicer tries to restart it will exit and
                // mark the job as failed
                systemPorts.addPort(worker.slicer_port);
            }
            // used to catch slicer shutdown to allow retry, allows to bypass the
            // jobRequest requestedWorkers
            if (worker.assignment === 'slicer' && newWorkerQueue.size()) {
                context.foundation.startWorkers(1, newWorkerQueue.dequeue());
            } else {
                sendNodeState();
            }
        }
    });

    function killWorkers(filterFn) {
        const workers = context.cluster.workers;
        const allWorkersForJob = _.filter(workers, filterFn);

        allWorkersForJob.forEach(worker => worker.kill('SIGKILL'));
    }

    function jobNeedsAssets(jobStr) {
        const job = typeof jobStr === 'string' ? JSON.parse(jobStr) : jobStr;
        return job.assets && job.assets.length > 0;
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

        function getPort() {
            return portQueue.dequeue();
        }

        function addPort(port) {
            portQueue.enqueue(port);
        }

        return {
            getPort,
            addPort
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

    messaging.initialize();

    if (context.sysconfig.teraslice.master) {
        const assetsPort = systemPorts.getPort();

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

        const needAssets = jobNeedsAssets(ex);

        const childContext = {
            assignment: workerType,
            job: jobStr,
            node_id: context.sysconfig._nodeName,
            ex_id: ex.ex_id,
            job_id: ex.job_id,
            slicer_port: ex.slicer_port
        };
        // TODO need to set recover_execution somehow
        // used to retry a job on startup after a stop command
        if (ex.recover_execution && workerType === 'slicer') {
            childContext.recover_execution = ex.recover_execution;
        }

        context.foundation.startWorkers(1, childContext);

        if (needAssets) {
            logger.info(`node ${context.sysconfig._nodeName} is checking assets for job ${ex.ex_id}`);
            context.foundation.startWorkers(1, {
                assignment: 'assets_loader',
                node_id: context.sysconfig._nodeName,
                job: ex.job,
                ex_id: ex.ex_id
            });
        }
    }
};
