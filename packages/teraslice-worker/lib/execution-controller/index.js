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
const Messaging = require('@terascope/teraslice-messaging');
const ExecutionAnalytics = require('./analytics');
const makeEngine = require('../teraslice/engine');
const { makeStateStore, makeExStore } = require('../teraslice/stores');
const { makeLogger, generateWorkerId } = require('../utils/context');
const { waitForWorkerShutdown } = require('../utils');

const ExecutionControllerServer = Messaging.ExecutionController.Server;
const ClusterMasterClient = Messaging.ClusterMaster.Client;
const { formatURL } = Messaging;

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

        this.server = new ExecutionControllerServer({
            port: slicerPort,
            networkLatencyBuffer,
            actionTimeout,
            workerDisconnectTimeout,
        });

        const clusterMasterPort = _.get(context, 'sysconfig.teraslice.port');
        const clusterMasterHostname = _.get(context, 'sysconfig.teraslice.master_hostname');

        this.client = new ClusterMasterClient({
            clusterMasterUrl: formatURL(clusterMasterHostname, clusterMasterPort),
            executionContext,
            networkLatencyBuffer,
            actionTimeout,
            exId: executionContext.ex_id,
        });

        this.executionAnalytics = new ExecutionAnalytics(
            context,
            executionContext,
            this.client
        );

        this.slicerQueue = new Queue();

        this.workerId = workerId;
        this.logger = logger;
        this.events = events;
        this.context = context;
        this.executionContext = executionContext;
        this.collectAnalytics = this.executionContext.config.analytics;
        this.shutdownTimeout = shutdownTimeout;
        this.workerDisconnectTimeout = workerDisconnectTimeout;
        this.recoverExecution = recoverExecution;
        this.recoveryComplete = !recoverExecution;
        this.slicerReady = false;
        this.slicesEnqueued = 0;

        this.stores = {};
        this.slicers = [];
        this.slicersDoneCount = 0;
        this.isPaused = false;
        this.isShutdown = false;
        this.isShuttingDown = false;
        this.isInitialized = false;
        this.isStarted = false;
        this.isExecutionFinished = false;
        this.workersHaveConnected = false;

        this.logDoneCreating = _.once(() => {
            this.logger.debug('done creating slices');
        });

        this.logDoneProcessing = _.once(() => {
            this.logger.debug('done processing slices');
        });

        this.logDoneDispatching = _.once(() => {
            this.logger.debug('done dispatching slices');
        });

        this.logExecutionDone = _.once(() => {
            this.logger.debug('execution is done');
        });

        this._dispatchSlices = this._dispatchSlices.bind(this);
        this.setFailingStatus = this.setFailingStatus.bind(this);
        this.terminalError = this.terminalError.bind(this);
    }

    async initialize() {
        const { context } = this;
        const { ex_id: exId } = this.executionContext;

        const exStore = makeExStore(context);
        this.stores.exStore = await exStore;

        await this.client.start();

        const verified = await this._verifyExecution();
        if (!verified) {
            this.isShutdown = true;
            await this.stores.exStore.shutdown(true);
            await this.client.shutdown();
            return;
        }

        const stateStore = makeStateStore(context);
        this.stores.stateStore = await stateStore;

        await this.server.start();

        this.isInitialized = true;

        this.server.onClientOnline((workerId) => {
            this.logger.debug(`worker ${workerId} is online`);
            this._adjustSlicerQueueLength();
            this.workersHaveConnected = true;
            clearTimeout(this.workerConnectTimeoutId);
        });

        this.server.onClientAvailable((workerId) => {
            this.logger.debug(`worker ${workerId} is available`);
            this.executionAnalytics.increment('workers_joined');
        });

        this.server.onClientDisconnect((workerId) => {
            this.logger.debug(`worker ${workerId} is disconnected but it may reconnect`);
            this.executionAnalytics.increment('workers_disconnected');
        });

        this.server.onClientOffline((workerId) => {
            this.logger.debug(`worker ${workerId} is offline`);
            this._adjustSlicerQueueLength();
            this._startWorkerDisconnectWatchDog();
        });

        this.server.onClientReconnect((workerId) => {
            clearTimeout(this.workerDisconnectTimeoutId);
            this.logger.debug(`worker ${workerId} is reconnected`);

            this.executionAnalytics.increment('workers_reconnected');
        });

        this.client.onExecutionPause(() => this.pause());
        this.client.onExecutionResume(() => this.resume());

        this.server.onSliceSuccess((workerId, response) => {
            this.executionAnalytics.increment('processed');

            if (this.collectAnalytics) {
                this.slicerAnalytics.addStats(response.analytics);
            }

            this.logger.debug(`worker ${workerId} has completed its slice`, response);
            this.events.emit('slice:success', response);
        });

        this.server.onSliceFailure((workerId, response) => {
            this.executionAnalytics.increment('processed');
            this.executionAnalytics.increment('failed');

            this.logger.error(`worker: ${workerId} has failure completing its slice`, response);
            this.events.emit('slice:failure', response);
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
        if (this.isShuttingDown) {
            this.logger.error('Cannot run execution while shutting down');
            return;
        }

        if (!this.isInitialized) {
            this.logger.error('Cannot run execution is not initialized');
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
            const dontBlock = true;
            await this.shutdown(dontBlock);
        } catch (err) {
            errors.push(err);
        }

        if (errors.length) {
            const errMsg = errors.map(e => e.stack).join(', and');
            throw new Error(`Execution run failure: ${errMsg}`);
        }
    }

    async resume() {
        if (!this.isPaused) return;

        const { ex_id: exId } = this.executionContext;

        this.logger.info(`execution ${exId} is resuming...`);
        this.isPaused = false;

        await Promise.delay(1000);
    }

    async pause() {
        if (this.isPaused) return;

        const { ex_id: exId } = this.executionContext;

        this.logger.info(`execution ${exId} is pausing...`);
        this.isPaused = true;
        await Promise.delay(1000);
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

            this.slicesEnqueued += 1;
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
        if (this.slicerFailed) return;

        const { ex_id: exId } = this.executionContext;
        const { exStore } = this.stores;

        this.slicerFailed = true;

        const msg = `slicer for ex ${exId} had an error, shutting down execution`;
        this.logger.error(msg, err);

        const errMsg = `${msg}, caused by ${err.stack ? err.stack : _.toString(err)}`;

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = await exStore.executionMetaData(executionStats, errMsg);

        await exStore.setStatus(exId, 'failed', errorMeta);

        await this.client.sendExecutionFinished(errMsg);
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

    async shutdown(dontBlock) {
        if (this.isShutdown) return;
        if (!this.isInitialized) return;
        const exId = _.get(this.executionContext, 'ex_id');

        if (this.isShuttingDown && !dontBlock) {
            this.logger.debug(`execution shutdown was called for ex ${exId} but it was already shutting down, will block until done`);
            await waitForWorkerShutdown(this.context, 'worker:shutdown:complete');
            return;
        }

        this.logger.debug(`execution shutdown was called for ex ${exId}`);
        this.isShuttingDown = true;
        this.isPaused = false;

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
            await this.server.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await this.client.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await Promise.map(Object.values(this.stores), store => store.shutdown(true));
        } catch (err) {
            shutdownErrs.push(err);
        }

        this.logger.warn(`execution controller ${exId} is shutdown`);
        this.isShutdown = true;

        if (shutdownErrs.length) {
            const errMsg = shutdownErrs.map(e => e.stack).join(', and');
            const shutdownErr = new Error(`Failed to shutdown correctly: ${errMsg}`);
            this.events.emit(this.context, 'worker:shutdown:complete', shutdownErr);
            throw shutdownErr;
        }

        this.events.emit(this.context, 'worker:shutdown:complete');
    }

    // this is used to determine when slicers should stop creating slices
    get isDoneCreatingSlices() {
        if (this.isExecutionDone) return true;
        if (this.isPaused) return true;
        if (this.slicersDone) {
            this.logDoneCreating();
            return true;
        }
        return false;
    }

    // this is used to determine when slices should stop be dispatched to the workers
    // in most cases this will only return true after the slices are done being created
    get isDoneDispatching() {
        if (this.isExecutionDone) return true;
        if (this.isPaused) return false;
        if (!this.isDoneCreatingSlices) return false;
        if (this.slicersDone) {
            this.logDoneDispatching();
            return true;
        }
        return false;
    }

    // this is used to determine when slices are done being created
    // and dispatched and are marked complete
    get isDoneProcessing() {
        if (this.isExecutionDone) return true;
        if (this.isPaused) return false;
        if (!this.isDoneDispatching) return false;
        if (this.slicesAreComplete) {
            this.logDoneProcessing();
            return true;
        }
        return false;
    }

    get isExecutionDone() {
        const isDone = this.isExecutionFinished || this.slicerFailed || this.isShutdown;
        if (isDone) {
            this.logExecutionDone();
            return true;
        }
        return false;
    }

    get slicesAreComplete() {
        if (!this.isStarted) return false;
        if (!this.recoveryComplete) return false;

        const noPendingSlices = this.server.pendingSlices.length === 0;
        const noActiveWorkers = this.server.activeWorkers.length === 0;
        return this.slicesEnqueued > 0 && noPendingSlices && noActiveWorkers;
    }

    // this is used to determine when all slices are done creating slices
    get slicersDone() {
        if (!this.isStarted) return false;
        if (!this.recoveryComplete) return false;

        const noRemaingSlicers = this.slicerReady && this.slicersDoneCount === _.size(this.slicers);
        return this.slicesEnqueued > 0 && noRemaingSlicers;
    }

    // this is used to determine when the slices are done
    get isOnce() {
        const { lifecycle } = this.executionContext.config;
        return (lifecycle === 'once') && this.recoveryComplete;
    }

    async _adjustSlicerQueueLength() {
        const { dynamicQueueLength, queueLength } = this.executionContext;
        if (!dynamicQueueLength) return;

        if (this.server.onlineClientCount > queueLength) {
            this.executionContext.queueLength = this.server.onlineClientCount;
            this.logger.info(`adjusted queue length ${this.executionContext.queueLength}`);
        }
    }

    async _startExecution() {
        const { ex_id: exId } = this.executionContext;

        const { exStore } = this.stores;
        this._startWorkConnectWatchDog();

        this.slicerAnalytics = makeSliceAnalytics(this.context, this.executionContext);

        this.logger.info(`starting execution ${exId}...`);
        this.startTime = Date.now();

        this.executionAnalytics.start();

        await Promise.all([
            exStore.setStatus(exId, 'running'),
            this.client.sendAvailable()
        ]);

        if (this.recoverExecution) {
            await this._recoverSlicesInit();

            await Promise.all([
                this._waitForRecovery(),
                this._processSlices(),
            ]);
        } else {
            await this._slicerInit();
            await this._processSlices();
        }

        await this._finishExecution();
    }

    async _processSlices() {
        this.isStarted = true;
        const { ex_id: exId } = this.executionContext;

        if (this.isPaused) {
            this.logger.debug('execution is paused, wait for resume...');
            await this.client.onceWithTimeout('execution:resume', 1000);
            return this._processSlices();
        }

        if (this.isDoneProcessing) {
            this.logger.debug(`execution ${exId} is done processing`);
            return true;
        }

        try {
            await this._createSlices();
            await this._dispatchSlices();
        } catch (err) {
            this.logger.error('Run failed dispatching slices but this is likely not fatal', err);
        }

        this.executionAnalytics.set('workers_available', this.server.availableClientCount);
        this.executionAnalytics.set('queued', this.slicerQueue.size());
        this.executionAnalytics.set('workers_active', this.server.activeWorkers.length);

        await immediate();

        return this._processSlices();
    }

    async _dispatchSlices() {
        if (this.isPaused || this.isDoneDispatching) return;

        if (!this.server.workerQueueSize) {
            const timeout = this.server.getTimeoutWithMax(5000);
            const found = await this.server.onceWithTimeout('worker:enqueue', timeout);
            if (!found) return;
        }

        const slice = this.slicerQueue.dequeue();
        if (!slice) return;

        const { dispatched, workerId } = await this.server.dispatchSlice(slice);

        if (!workerId) return;

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
        if (this.isShuttingDown || this.isDoneCreatingSlices) return;
        if (!this.scheduler) return;

        // If all slicers are not done, the slicer queue is not overflown and the scheduler
        // is set, then attempt to provision more slices
        if (this.slicerQueue.size() < this.executionContext.queueLength) {
            await Promise.map(this.scheduler, slicerFn => slicerFn());
        }
    }

    async _slicerInit() {
        const {
            logger,
            context,
        } = this;

        const maxRetries = _.get(this.executionContext, 'config.max_retries', 3);
        const retryOptions = {
            max_tries: maxRetries,
            throw_original: true,
            interval: 100,
        };

        this.slicersDoneCount = 0;
        this.slicers = await retry(() => {
            const executionContext = _.cloneDeep(this.executionContext);
            const startingPoints = this.startingPoints ? _.cloneDeep(this.startingPoints) : [];

            return this.executionContext.slicer.newSlicer(
                context,
                executionContext,
                startingPoints,
                logger
            );
        }, retryOptions);

        logger.debug(`initialized ${this.slicers.length} slices`);
        this.scheduler = await this.engine.registerSlicers(this.slicers);

        this.slicerReady = true;
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

        this.slicersDoneCount = 0;
        this.slicers = await this.recover.newSlicer();

        this.scheduler = await this.engine.registerSlicers(this.slicers, true);
        this.slicerReady = true;
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

        this.recoveryComplete = true;
        // reset the slicers
        this.slicers = [];
        this.scheduler = null;
        this.slicersDoneCount = -1;
        this.slicersReady = false;

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

        await this.server.sendExecutionFinishedToAll(exId);

        await this.client.sendExecutionFinished();

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

        if (!this.isDoneProcessing) {
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
        const elapsed = endTime - this.startTime;
        const time = elapsed < 1000 ? 1 : Math.round((elapsed) / 1000);

        this.executionAnalytics.set('job_duration', time);

        if (this.collectAnalytics) {
            this.slicerAnalytics.analyzeStats();
        }

        this.logger.info(`execution ${exId} has finished in ${time} seconds, enqueued ${this.slicesEnqueued} slices`);
    }

    _checkExecutionState() {
        const { ex_id: exId } = this.executionContext;

        const query = `ex_id:${exId} AND (state:error OR state:start)`;
        return this.stores.stateStore.count(query, 0);
    }

    _waitForExecutionFinished() {
        if (!this.isStarted) return null;

        const timeout = Math.round(this.shutdownTimeout * 0.8);
        const shutdownAt = timeout + Date.now();

        // hoist this error to get a better stack trace
        const timeoutError = new Error(`${this.shutdownTimeout}ms timeout waiting for the execution to finish...`);

        const checkExecution = async () => {
            if (this.isExecutionDone) return null;

            const now = Date.now();
            if (now > shutdownAt) {
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
            error = new Error(`Execution ${exId} was starting in terminal status, sending execution:finished event to cluster master`);
        } else if (_.includes(runningStatuses, status)) {
            error = new Error(`Execution ${exId} was starting in running status, sending execution:finished event to cluster master`);
        } else {
            return true;
        }

        await this.client.sendExecutionFinished(error.message);

        this.logger.warn('Unable to verify execution on initialization', error.stack);
        return false;
    }

    _startWorkConnectWatchDog() {
        clearTimeout(this.workerConnectTimeoutId);

        if (this.isShuttingDown) return;
        if (this.workersHaveConnected) return;

        const { ex_id: exId } = this.executionContext;

        const timeout = this.context.sysconfig.teraslice.slicer_timeout;
        const err = new Error(`No workers have connected to slicer in the allotted time: ${timeout} ms`);

        this.workerConnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerConnectTimeoutId);

            if (this.workersHaveConnected) return;

            this.logger.warn(`A worker has not connected to a slicer for ex: ${exId}, shutting down execution`);

            this.terminalError(err);
        }, timeout);
    }

    _startWorkerDisconnectWatchDog() {
        clearTimeout(this.workerDisconnectTimeoutId);

        if (this.isShuttingDown) return;
        if (this.server.onlineClientCount > 0) return;

        const { ex_id: exId } = this.executionContext;
        const err = new Error(`All workers from slicer #${exId} have disconnected`);

        this.workerDisconnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerDisconnectTimeoutId);

            if (this.server.onlineClientCount > 0) return;

            this.terminalError(err);
        }, this.workerDisconnectTimeout);
    }
}

module.exports = ExecutionController;
