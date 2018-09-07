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
        const workerDisconnectTimeout = _.get(context, 'sysconfig.teraslice.worker_disconnect_timeout');
        const shutdownTimeout = _.get(context, 'sysconfig.teraslice.shutdown_timeout');
        const recoverExecution = _.get(executionContext.config, 'recovered_execution', false);

        this.messenger = new ExecutionControllerMessenger({
            port: slicerPort,
            networkLatencyBuffer,
            actionTimeout,
            events,
            workerDisconnectTimeout,
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
        this.shutdownTimeout = shutdownTimeout;
        this.workerDisconnectTimeout = workerDisconnectTimeout;
        this.recoverExecution = recoverExecution;

        this.stores = {};
        this.slicersDoneCount = 0;
        this.isPaused = false;
        this.isShuttingDown = false;
        this.isInitialized = false;
        this.isStarted = false;
        this.isExecutionFinished = false;
        this.forceShutdown = false;

        this.logDoneCreatingSlices = _.once(() => {
            this.logger.debug('done creating slices');
        });

        this.logDoneProcessingSlices = _.once(() => {
            this.logger.debug('done processing slices');
        });

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
        if (this.isShuttingDown || this.forceShutdown) {
            this.logger.error('Cannot run execution while shutting down');
            return;
        }

        const { ex_id: exId } = this.executionContext;
        const errors = [];

        try {
            await this._startExecution();
        } catch (err) {
            errors.push(err);
        }

        this.logger.debug(`execution ${exId} is done`);

        try {
            await this.shutdown();
        } catch (err) {
            errors.push(err);
        }

        if (errors.length) {
            const errMsg = errors.map(e => e.stack).join(', and');
            throw new Error(`Execution run failure: ${errMsg}`);
        }
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

        this.slicerFailed = true;

        const error = new WrapError(`slicer for ex ${exId} had an error, shutting down execution`, err);
        this.logger.error(error);

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = await exStore.executionMetaData(executionStats, error.toString());

        await exStore.setStatus(exId, 'failed', errorMeta);

        await this.clusterMasterClient.executionTerminal(exId);
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

    async shutdown() {
        if (!this.isInitialized) return;
        if (this.isShuttingDown) return;

        this.logger.debug('execution shutdown was called');
        this.isShuttingDown = true;

        const shutdownErrs = [];

        clearTimeout(this.workerConnectTimeoutId);
        clearTimeout(this.workerDisconnectTimeoutId);

        const error = await this._waitForExecutionFinished();
        if (error) {
            shutdownErrs.push(error);
        }

        await this._finishExecution();

        this.events.emit('worker:shutdown');

        if (this.recover) {
            try {
                await this.recover.shutdown();
            } catch (err) {
                shutdownErrs.push(err);
            }
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

        try {
            await Promise.map(Object.values(this.stores), (store) => {
                // attempt to shutdown but if it takes longer than shutdown_timeout, cleanup
                const forceShutdown = true;
                return store.shutdown(forceShutdown);
            });
        } catch (err) {
            shutdownErrs.push(err);
        }

        if (shutdownErrs.length) {
            const errMsg = shutdownErrs.map(e => e.stack).join(', and');
            throw new Error(`Failed to shutdown correctly: ${errMsg}`);
        }

        this.logger.debug('execution controller is shutdown');
    }

    // this is used to indicate that recovery is complete
    // if there is no recovery, this is returns true.
    get recoveryComplete() {
        return this.recover == null || this.recover.recoveryComplete();
    }

    // this is used to determine when slicers should stop creating slices
    get isDoneCreatingSlices() {
        const isDone = this.forceShutdown
            || this.isShuttingDown
            || this.isExecutionFinished
            || this.slicerFailed
            || this.isPaused
            || (this.slicersDone && this.recoveryComplete);

        if (isDone) this.logDoneCreatingSlices();
        return isDone;
    }

    // this is used to determine when slices should stop be dispatched to the workers
    // in most cases this will only return true after the slices are done being created
    get isDoneProcessing() {
        const isDone = this.isDoneCreatingSlices
            && this.slicersDone
            && this.recoveryComplete
            && this.isSlicersComplete;

        const isDoneOrShutdown = this.forceShutdown || this.slicerFailed || isDone;

        if (isDoneOrShutdown) this.logDoneProcessingSlices();
        return isDoneOrShutdown;
    }

    // this is used to determine when the slicers are done the work is done processing
    get isSlicersComplete() {
        const workersCompleted = this.messenger.readyWorkers >= this.messenger.connectedWorkers;
        return this.isStarted && workersCompleted;
    }

    // this is used to determine when all slices are done creating slices
    get slicersDone() {
        if (this.slicers == null) return false;
        return this.slicersDoneCount === _.size(this.slicers) && this.recoveryComplete;
    }

    // this is used to determine when the slices are done
    get isOnce() {
        const { lifecycle } = this.executionContext.config;
        return (lifecycle === 'once') && this.recoveryComplete;
    }

    // this is used to indicate the number of slices pending slices
    get remainingSlices() {
        return this.slicerQueue.size();
    }

    async _adjustSlicerQueueLength() {
        const { dynamicQueueLength, queueLength } = this.executionContext;
        if (!dynamicQueueLength) return;

        if (this.messenger.connectedWorkers > queueLength) {
            this.executionContext.queueLength = this.messenger.connectedWorkers;
            this.logger.info(`adjusted queue length ${this.executionContext.queueLength}`);
        }
    }

    async _startExecution() {
        const { ex_id: exId } = this.executionContext;

        const { exStore } = this.stores;

        this.slicerAnalytics = makeSliceAnalytics(this.context, this.executionContext);

        this.logger.info(`starting execution ${exId}...`);
        this.startTime = Date.now();
        this.executionAnalytics.start();
        await exStore.setStatus(exId, 'running');
        this._startWorkConnectWatchDog();

        if (this.recoverExecution) {
            await this._recoverSlicesInit();

            this.isStarted = true;
            await Promise.all([
                this._waitForRecovery(),
                this._processSlices(),
            ]);
        } else {
            await this._slicerInit();

            this.isStarted = true;
            await this._processSlices();
        }

        await this._finishExecution();
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
        if (this.isDoneProcessing) return;

        if (!this.messenger.availableWorkers) {
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

    async _recoverSlicesInit() {
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
    }

    async _waitForRecovery() {
        if (this.recoveryComplete) return;

        await new Promise((resolve) => {
            this.events.once('execution:recovery:complete', (startingPoints) => {
                this.logger.debug('recovery starting points', startingPoints);
                this.startingPoints = startingPoints;
                resolve();
            });
        });

        if (_.get(this.startingPoints, '_exit') === true) {
            this.logger.warn('execution recovery has been marked as completed');
            return;
        }

        await this._slicerInit();
    }

    async _finishExecution() {
        const { ex_id: exId } = this.executionContext;
        if (this.isExecutionFinished) return;

        try {
            await this._updateExecutionStatus();
        } catch (err) {
            /* istanbul ignore next */
            const errMsg = parseError(err);
            this.logger.error(`execution ${exId} has run to completion but the process has failed while updating the execution status, slicer will soon exit, error: ${errMsg}`);
        }

        await this._logFinishedJob();

        await this.messenger.executionFinished(exId);

        if (!this.isDoneProcessing || this.forceShutdown) {
            await this.clusterMasterClient.executionTerminal(exId);
        } else {
            await this.clusterMasterClient.executionFinished(exId);
        }

        this.isExecutionFinished = true;
        this.logger.debug(`execution ${exId} is finished`);
    }

    async _updateExecutionStatus() {
        // if this.slicerFailed is true, slicer has already been marked as failed
        if (this.slicerFailed) return;

        const { logger } = this;
        const { exStore } = this.stores;
        const { ex_id: exId } = this.executionContext;

        const executionStats = this.executionAnalytics.getAnalytics();

        const isShutdownEarly = !this.isDoneProcessing || this.forceShutdown;

        if (isShutdownEarly) {
            // if status is stopping or stopped, only update the execution metadata
            const status = await exStore.getStatus(exId);
            const isStopping = status === 'stopping' || status === 'stopped';
            if (isStopping) {
                const metaData = exStore.executionMetaData(executionStats);
                logger.debug(`execution is set to ${status}, status will not be updated`);
                await exStore.update(exId, metaData);
                return;
            }

            const errMsg = `execution ${exId} received shutdown before the slicer could complete, setting status to "terminated"`;
            const metaData = exStore.executionMetaData(executionStats, errMsg);
            logger.error(errMsg);
            await exStore.setStatus(exId, 'terminated', metaData);
            return;
        }

        const errCount = await this._checkExecutionState();
        if (errCount > 0) {
            const errMsg = `execution: ${exId} had ${errCount} slice failures during processing`;
            const errorMeta = exStore.executionMetaData(executionStats, errMsg);
            logger.error(errMsg);
            await exStore.setStatus(exId, 'failed', errorMeta);
            return;
        }

        const metaData = exStore.executionMetaData(executionStats);
        logger.info(`execution ${exId} has completed`);
        await exStore.setStatus(exId, 'completed', metaData);
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

    _checkExecutionState() {
        const { ex_id: exId } = this.executionContext;

        const query = `ex_id:${exId} AND (state:error OR state:start)`;
        return this.stores.stateStore.count(query, 0);
    }

    _waitForExecutionFinished() {
        const timeout = Math.round(this.shutdownTimeout * 0.8);
        const shutdownAt = timeout + Date.now();

        // hoist this error to get a better stack trace
        const timeoutError = new Error(`${this.shutdownTimeout}ms timeout waiting for the execution to finish...`);
        const forcedError = new Error('Execution was forced to shutdown');

        const checkExecution = async () => {
            if (this.isExecutionFinished) return null;
            if (this.forceShutdown) return forcedError;

            const now = Date.now();
            if (now > shutdownAt) {
                this.forceShutdown = true;
                return timeoutError;
            }

            this.logger.debug('shutdown is waiting for execution to finish...');
            await Promise.delay(1000);
            return checkExecution();
        };

        return checkExecution();
    }

    // verify the execution can be set to running
    async _verifyExecution() {
        const { ex_id: exId } = this.executionContext;
        const { exStore } = this.stores;
        let error;

        const terminalStatuses = exStore.getTerminalStatuses();
        const runningStatuses = exStore.getRunningStatuses();
        const status = await exStore.getStatus(exId);

        if (_.includes(terminalStatuses, status)) {
            error = new Error(`Execution ${exId} was starting in terminal status, sending executionTerminal event to cluster master`);
            await this.clusterMasterClient.executionTerminal(exId);
        } else if (_.includes(runningStatuses, status)) {
            error = new Error(`Execution ${exId} was starting in running status, sending executionFinished event to cluster master`);
            await this.clusterMasterClient.executionFinished(exId);
        } else {
            return;
        }

        this.logger.error(error.message);

        const maxDelay = 30 * 1000;
        const delay = this.actionTimeout > maxDelay ? maxDelay : this.actionTimeout;
        await Promise.delay(delay);

        this.forceShutdown = true;

        throw error;
    }

    _startWorkConnectWatchDog() {
        if (this.messenger.connectedWorkers > 0) return;

        const { ex_id: exId } = this.executionContext;

        const timeout = this.context.sysconfig.teraslice.slicer_timeout;
        const err = new Error(`No workers have connected to slicer in the allotted time: ${timeout} ms`);

        clearTimeout(this.workerConnectTimeoutId);

        this.workerConnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerConnectTimeoutId);

            if (this.messenger.connectedWorkers > 0) return;

            this.logger.warn(`A worker has not connected to a slicer for ex: ${exId}, shutting down execution`);

            this.terminalError(err);
        }, timeout);
    }

    _startWorkerDisconnectWatchDog() {
        if (this.messenger.connectedWorkers > 0) return;

        const { ex_id: exId } = this.executionContext;
        const err = new Error(`All workers from slicer #${exId} have disconnected`);

        clearTimeout(this.workerDisconnectTimeoutId);

        this.workerDisconnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerDisconnectTimeoutId);

            if (this.messenger.connectedWorkers > 0) return;

            this.terminalError(err);
        }, this.workerDisconnectTimeout);
    }
}

module.exports = ExecutionController;
