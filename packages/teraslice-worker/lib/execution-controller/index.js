'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const castArray = require('lodash/castArray');
const uuidv4 = require('uuid/v4');
const retry = require('bluebird-retry');
const Queue = require('@terascope/queue');
const parseError = require('@terascope/error-parser');
const {
    makeSliceAnalytics,
    newFormattedDate,
    makeExecutionRecovery
} = require('teraslice');
const ClusterMasterClient = require('./cluster-master-client');
const ExecutionAnalytics = require('./analytics');
const ExecutionControllerMessenger = require('./messenger');
const makeEngine = require('../teraslice/engine');
const { makeStateStore, makeExStore } = require('../teraslice/stores');
const WrapError = require('../utils/wrap-error');
const { makeLogger, generateWorkerId } = require('../utils/context');
const { formatURL } = require('../utils');

const immediate = Promise.promisify(setImmediate);

class ExecutionController {
    constructor(context, executionContext) {
        const workerId = generateWorkerId(context);
        const logger = makeLogger(context, executionContext, 'execution_controller');
        const events = context.apis.foundation.getSystemEvents();

        const slicerPort = executionContext.slicer_port;
        const networkLatencyBuffer = _.get(context, 'sysconfig.teraslice.network_latency_buffer');
        const actionTimeout = _.get(context, 'sysconfig.teraslice.action_timeout');

        this.messenger = new ExecutionControllerMessenger({
            port: slicerPort,
            networkLatencyBuffer,
            actionTimeout,
            events,
        });

        const clusterMasterPort = _.get(context, 'sysconfig.teraslice.port');
        const clusterMasterHostname = _.get(context, 'sysconfig.teraslice.master_hostname');

        this.clusterMasterClient = new ClusterMasterClient({
            clusterMasterUrl: formatURL(clusterMasterHostname, clusterMasterPort),
            executionContext,
            networkLatencyBuffer,
            actionTimeout,
        });

        this.executionAnalytics = new ExecutionAnalytics(
            context,
            executionContext,
            this.clusterMasterClient
        );

        this.slicerQueue = new Queue();

        this.workerId = workerId;
        this.logger = logger;
        this.events = events;
        this.context = context;
        this.executionContext = executionContext;
        this.collectAnalytics = this.executionContext.config.analytics;
        this.actionTimeout = actionTimeout;

        this.stores = {};
        this.slicersDoneCount = 0;
        this.isRecovery = false;
        this.isPaused = false;
        this.isShuttingDown = false;
        this.isInitialized = false;

        this._dispatchSlices = this._dispatchSlices.bind(this);
        this.setFailingStatus = this.setFailingStatus.bind(this);
        this.terminalError = this.terminalError.bind(this);
    }

    async initialize() {
        const { context } = this;
        const { ex_id: exId } = this.executionContext;

        this.isInitialized = true;

        const stateStore = makeStateStore(context);
        const exStore = makeExStore(context);

        this.stores.stateStore = await stateStore;
        this.stores.exStore = await exStore;

        await Promise.all([
            this.clusterMasterClient.start(),
            this.messenger.start()
        ]);

        await this._verifyExecution();

        this.messenger.on('worker:online', () => {
            this._adjustSlicerQueueLength();
        });

        this.messenger.on('worker:offline', () => {
            this.executionAnalytics.increment('workers_disconnected');
            this._adjustSlicerQueueLength();
            this._startWorkConnectWatchDog();
        });

        this.messenger.on('worker:reconnect', (response) => {
            this.executionAnalytics.increment('workers_reconnected');

            this.logger.warn(`worker: ${response.worker_id} has rejoined slicer: ${exId}`);
        });

        this.clusterMasterClient.on('cluster:execution:pause', (msg) => {
            this.pause();
            this.clusterMasterClient.respond(msg);
        });

        this.clusterMasterClient.on('cluster:execution:resume', (msg) => {
            this.resume();
            this.clusterMasterClient.respond(msg);
        });

        this.events.on('slice:success', (response) => {
            this.executionAnalytics.increment('processed');

            if (this.collectAnalytics) {
                this.slicerAnalytics.addStats(response.analytics);
            }

            this.logger.debug(`worker ${response.worker_id} has completed its slice,`, response);
        });

        this.events.on('slice:failure', (response) => {
            this.executionAnalytics.increment('processed');
            this.executionAnalytics.increment('failed');

            this.logger.error(`worker: ${response.worker_id} has error on slice: ${JSON.stringify(response)} , slicer: ${exId}`);
        });

        this.events.on('slicer:execution:update', ({ update }) => {
            this.logger.debug('slicer sending a execution update', update);

            // this is updating the opConfig for elasticsearch start and/or end dates for ex,
            // this assumes elasticsearch is first
            this.stores.exStore.update(exId, { operations: update });
        });

        this.engine = makeEngine(this);

        this.logger.debug(`execution ${exId} is initialized`);

        this.isInitialized = true;
    }

    async run() {
        const {
            context,
            executionContext
        } = this;
        const {
            ex_id: exId,
        } = executionContext;

        const { exStore } = this.stores;

        this.startTime = Date.now();

        this.slicerAnalytics = makeSliceAnalytics(context, executionContext);

        this.logger.info(`execution ${exId} is running...`);

        this._startWorkConnectWatchDog();

        return Promise.all([
            this.executionAnalytics.start(),
            exStore.setStatus(exId, 'running'),
            this._initializeSlicer(),
            this._processSlices(),
            this._waitAndFinishedExecution(),
        ]);
    }

    resume() {
        if (!this.isPaused) return;

        const { ex_id: exId } = this.executionContext;

        this.logger.info(`execution ${exId} is resuming...`);
        this.isPaused = false;
    }

    pause() {
        if (this.isPaused) return;

        const { ex_id: exId } = this.executionContext;

        this.logger.info(`execution ${exId} is pausing...`);

        this.isPaused = true;
    }

    async allocateSlice(request, slicerId, startingOrder) {
        let slicerOrder = startingOrder;
        const { logger, slicerQueue } = this;
        const { stateStore } = this.stores;
        const { ex_id: exId } = this.executionContext;

        await Promise.map(castArray(request), async (sliceRequest) => {
            slicerOrder += 1;
            let slice = sliceRequest;

            // recovery slices already have correct meta data
            if (!slice.slice_id) {
                slice = {
                    slice_id: uuidv4(),
                    request: sliceRequest,
                    slicer_id: slicerId,
                    slicer_order: slicerOrder,
                    _created: new Date().toISOString()
                };

                await stateStore.createState(exId, slice, 'start');
                logger.trace('enqueuing slice', slice);
            }

            slicerQueue.enqueue(slice);
        });

        return slicerOrder;
    }

    async setFailingStatus() {
        const { ex_id: exId } = this.executionContext;
        const { exStore } = this.stores;

        const errMsg = `slicer: ${exId} has encountered a processing_error`;
        this.logger.error(errMsg);

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = await exStore.executionMetaData(executionStats, errMsg);
        await exStore.setStatus(exId, 'failing', errorMeta);
    }

    async terminalError(err) {
        const { ex_id: exId } = this.executionContext;
        const { exStore } = this.stores;

        const error = new WrapError(`slicer for ex ${exId} had an error, shutting down execution`, err);
        this.logger.error(error);

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = await exStore.executionMetaData(executionStats, error.toString());

        await exStore.setStatus(exId, 'failed', errorMeta);

        await this.clusterMasterClient.executionTerminal(exId);

        this.slicerFailed = true;
    }

    async slicerCompleted() {
        const { ex_id: exId } = this.executionContext;

        this.slicersDoneCount += 1;

        this.logger.info(`a slicer for execution: ${exId} has completed its range`);

        if (!this.slicersDone) return;

        this.events.emit('slicers:finished');

        this.logger.info(`all slicers for execution: ${exId} have been completed, waiting for slices in slicerQueue to be processed`);
        this.executionAnalytics.set('queuing_complete', newFormattedDate());
    }

    get availableWorkers() {
        return this.messenger.availableWorkers;
    }

    get connectedWorkers() {
        return this.messenger.connectedWorkers;
    }

    get activeWorkers() {
        return this.messenger.activeWorkers;
    }

    get recoveryComplete() {
        if (this.recover == null) return true;
        return this.recover.recoveryComplete();
    }

    get isDoneCreatingSlices() {
        return this.isShuttingDown
            || this.isExecutionFinished
            || this.slicerFailed
            || this.isPaused
            || (this.slicersDone && this.recoveryComplete);
    }

    get isDoneProcessing() {
        if (this.isExecutionFinished) return true;
        if (this.isDoneCreatingSlices) {
            return this.isSlicersComplete;
        }
        return false;
    }

    get isSlicersComplete() {
        const workersCompleted = this.availableWorkers >= this.connectedWorkers;
        const slicesFinished = this.remainingSlices === 0;
        return workersCompleted && slicesFinished && this.slicers != null;
    }

    get slicersDone() {
        const count = this.slicers == null ? -1 : _.size(this.slicers);
        return this.slicersDoneCount === count;
    }

    get isOnce() {
        const { lifecycle } = this.executionContext.config;
        return (lifecycle === 'once') && this.recoveryComplete;
    }

    get remainingSlices() {
        return this.slicerQueue.size();
    }

    async shutdown() {
        if (!this.isInitialized) return;
        if (this.isShuttingDown) return;

        this.isShuttingDown = true;
        this.logger.info('execution controller is shutting down...');
        this.events.emit('worker:shutdown');

        const shutdownErrs = [];

        clearTimeout(this.workerConnectTimeout);
        clearTimeout(this.workerDisconnectTimeout);

        if (!this.isExecutionFinished) {
            try {
                await this._waitForExecutionFinished();
            } catch (err) {
                shutdownErrs.push(err);
            }
        }

        if (this.recover) {
            try {
                await this.recover.shutdown();
            } catch (err) {
                shutdownErrs.push(err);
            }
        }

        try {
            await Promise.map(Object.values(this.stores), (store) => {
                // attempt to shutdown but if it takes longer than shutdown_timeout, cleanup
                const forceShutdown = true;
                return store.shutdown(forceShutdown);
            });
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await this.executionAnalytics.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await this.clusterMasterClient.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await this.messenger.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

        if (shutdownErrs.length) {
            const errMsg = shutdownErrs.map(e => e.stack).join(', and');
            throw new Error(`Failed to shutdown correctly: ${errMsg}`);
        }

        this.logger.debug('execution controller is shutdown');
    }


    async _adjustSlicerQueueLength() {
        const { dynamicQueueLength, queueLength } = this.executionContext;
        if (!dynamicQueueLength) return;

        if (this.connectedWorkers > queueLength) {
            this.executionContext.queueLength = this.connectedWorkers;
            this.logger.info(`adjusted queue length ${this.executionContext.queueLength}`);
        }
    }

    _logFinishedJob() {
        const { ex_id: exId } = this.executionContext;

        const endTime = Date.now();
        const time = (endTime - this.startTime) / 1000;

        this.executionAnalytics.set('job_duration', time);

        if (this.collectAnalytics) {
            this.slicerAnalytics.analyzeStats();
        }

        this.logger.info(`execution ${exId} has finished in ${time} seconds`);
    }

    async _processSlices() {
        if (this.isPaused) {
            await Promise.delay(100);
            await this._processSlices();
            return;
        }

        if (this.isDoneProcessing) return;

        const {
            slicerQueue,
            messenger,
            executionAnalytics
        } = this;

        try {
            await this._createSlices();
            await this._dispatchSlices();
        } catch (err) {
            const error = new WrapError('Run failed but worker is not done processing', err);
            this.logger.warn(error.toString());
        }

        executionAnalytics.set('workers_available', messenger.connectedWorkers);
        executionAnalytics.set('queued', slicerQueue.size());
        executionAnalytics.set('workers_active', messenger.activeWorkers);

        await immediate();

        await this._processSlices();
    }

    async _dispatchSlices() {
        if (this.isDoneProcessing || this.isPaused) return;

        if (!this.availableWorkers) {
            const foundWorker = await this.messenger.onceWithTimeout('worker:enqueue', null, true);
            if (!foundWorker) return;
        }

        const slice = this.slicerQueue.dequeue();
        if (!slice) return;

        const { dispatched, workerId } = await this.messenger.dispatchSlice(slice);

        if (dispatched) {
            this.logger.debug(`dispatched slice ${slice.slice_id} to worker ${workerId}`);
        } else {
            this.slicerQueue.unshift(slice);
            this.logger.debug(`worker ${workerId} is not available to process slice ${slice.slice_id}`);
        }

        await immediate();

        await this._dispatchSlices();
    }

    async _createSlices() {
        if (this.isPaused) return;
        if (this.isDoneCreatingSlices) return;
        if (!this.scheduler) return;

        // If all slicers are not done, the slicer queue is not overflown and the scheduler
        // is set, then attempt to provision more slices
        if (this.remainingSlices < this.executionContext.queueLength) {
            await Promise.map(this.scheduler, slicerFn => slicerFn());
        }
    }

    async _initializeSlicer() {
        const shouldContinue = await this._recoverSlices();
        if (!shouldContinue) {
            this.logger.warn('execution recovery has been marked as completed');
            return;
        }

        await this._slicerInit();
    }

    async _slicerInit() {
        const {
            logger,
            context,
            executionContext,
            startingPoints
        } = this;

        const maxRetries = _.get(executionContext, 'config.max_retries', 3);
        const retryOptions = {
            max_tries: maxRetries,
            throw_original: true,
            interval: 100,
        };

        this.slicers = await retry(() => this.executionContext.slicer.newSlicer(
            context,
            executionContext,
            startingPoints,
            logger
        ), retryOptions);

        logger.debug(`initialized ${this.slicers.length} slices`);
        this.scheduler = await this.engine.registerSlicers(this.slicers);
    }

    async _recoverSlices() {
        const recoverExecution = _.get(this.executionContext.config, 'recovered_execution');
        if (!recoverExecution) return true;
        const { ex_id: exId } = this.executionContext;

        this.recover = makeExecutionRecovery(
            this.context,
            this.terminalError,
            this.stores.stateStore,
            this.executionContext
        );

        await this.recover.initialize();

        this.logger.info(`execution: ${exId} is starting in recovery mode`);

        this.slicers = await this.recover.newSlicer();

        this.scheduler = await this.engine.registerSlicers(this.slicers, true);

        await new Promise((resolve) => {
            this.events.once('execution:recovery:complete', (startingPoints) => {
                this.logger.debug('recovery starting points', startingPoints);
                this.startingPoints = startingPoints;
                resolve();
            });
        });

        if (_.get(this.startingPoints, '_exit') === true) {
            return false;
        }

        return true;
    }

    async _waitForExecutionFinished() {
        if (this.isExecutionFinished) return;
        if (!this.isInitialized) return;

        await new Promise((resolve) => {
            const id = setInterval(() => {
                if (this.isExecutionFinished) {
                    clearInterval(id);
                    resolve();
                }
            }, 100).unref(); // unref so we don't stop the process from shutting down
        });

        this.logger.debug('Exeuction is finished');
    }

    async _waitAndFinishedExecution() {
        const { ex_id: exId } = this.executionContext;

        await new Promise((resolve) => {
            const id = setInterval(() => {
                if (this.isDoneCreatingSlices) {
                    clearInterval(id);
                    resolve();
                }
            }, 100).unref(); // unref so we don't stop the process from shutting down
        });

        await this._waitForSlicesToComplete();

        try {
            await this._markExecutionCompleted();
        } catch (err) {
            /* istanbul ignore next */
            const errMsg = parseError(err);
            this.logger.error(`execution ${exId} has run to completion but the process has failed while updating the execution status, slicer will soon exit, error: ${errMsg}`);
        }

        await this._logFinishedJob();

        await this.messenger.executionFinished(exId);

        this.isExecutionFinished = true;
    }

    async _waitForSlicesToComplete() {
        const { ex_id: exId } = this.executionContext;

        await Promise.delay(100);

        this.logger.trace(`worker queue: ${this.availableWorkers}, connected clients ${this.connectedWorkers}, slicer queue: ${this.remainingSlices}`);

        if (this.isDoneProcessing) {
            this.logger.info(`all work for execution: ${exId} has completed, starting cleanup`);
            return;
        }

        await this._waitForSlicesToComplete();
    }

    async _markExecutionCompleted() {
        // if this.slicerFailed is true, slicer has already been marked as failed
        if (this.slicerFailed) return;

        const { logger } = this;
        const { exStore } = this.stores;
        const { ex_id: exId } = this.executionContext;

        const errCount = await this._checkExecutionState();

        const executionStats = this.executionAnalytics.getAnalytics();

        if (errCount > 0) {
            const message = `execution: ${exId} had ${errCount} slice failures during processing`;
            const errorMeta = exStore.executionMetaData(executionStats, message);
            logger.error(message);
            await exStore.setStatus(exId, 'failed', errorMeta);
            return;
        }

        const metaData = exStore.executionMetaData(executionStats);

        if (!this.isDoneProcessing) {
            logger.info(`execution ${exId} received shutdown before the slicer could complete`);
            await exStore.update(exId, metaData);
            return;
        }

        logger.info(`execution ${exId} has completed`);
        await exStore.setStatus(exId, 'completed', metaData);

        await this.clusterMasterClient.executionFinished(exId);
    }

    _checkExecutionState() {
        const { ex_id: exId } = this.executionContext;

        const query = `ex_id:${exId} AND (state:error OR state:start)`;
        return this.stores.stateStore.count(query, 0);
    }

    async _verifyExecution() {
        const { ex_id: exId } = this.executionContext;
        const { exStore } = this.stores;

        const terminalStatuses = exStore.getTerminalStatuses();
        const runningStatuses = exStore.getRunningStatuses();
        const result = await exStore.get(exId);

        if (_.includes(terminalStatuses, result._status)) {
            this.logger.warn('Execution was starting in terminal status, sending executionTerminal event');
            await this.clusterMasterClient.executionTerminal(exId);
        } else if (_.includes(runningStatuses, result._status)) {
            this.logger.warn('Execution was starting in running status, sending executionFinished event');
            await this.clusterMasterClient.executionFinished(exId);
        } else {
            return;
        }

        const maxDelay = 30 * 1000;
        const delay = this.actionTimeout > maxDelay ? maxDelay : this.actionTimeout;
        await Promise.delay(delay);

        this.logger.error('Execution is shutdown because it started in a invalid state');
        await this.shutdown();
    }

    _startWorkConnectWatchDog() {
        if (this.connectedWorkers > 0) return;

        const { ex_id: exId } = this.executionContext;

        const timeout = this.context.sysconfig.teraslice.slicer_timeout;
        const err = new Error(`No workers have connected to slicer in the allotted time: ${timeout} ms`);

        clearTimeout(this.workerConnectTimeout);

        this.workerConnectTimeout = setTimeout(() => {
            clearTimeout(this.workerConnectTimeout);

            if (this.connectedWorkers > 0) return;

            this.logger.warn(`A worker has not connected to a slicer for ex: ${exId}, shutting down execution`);

            this.terminalError(err);
        }, timeout);
    }

    _startWorkerDisconnectWatchDog() {
        if (this.connectedWorkers > 0) return;

        const { ex_id: exId } = this.executionContext;
        const timeout = this.context.sysconfig.teraslice.worker_disconnect_timeout;
        const err = new Error(`All workers from slicer #${exId} have disconnected`);

        clearTimeout(this.workerDisconnectTimeout);

        this.workerDisconnectTimeout = setTimeout(() => {
            clearTimeout(this.workerDisconnectTimeout);

            if (this.connectedWorkers > 0) return;

            this.terminalError(err);
        }, timeout);
    }
}

module.exports = ExecutionController;
