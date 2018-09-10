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

        this.exId = _.get(executionContext, 'config.ex_id');
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
        this.slicersReady = false;
        this.slicesEnqueued = 0;

        this.stores = {};
        this.slicers = [];
        this.slicersDoneCount = 0;
        this.isPaused = false;
        this.isShutdown = false;
        this.isShuttingDown = false;
        this.isInitialized = false;
        this.isStarted = false;
        this.isProcessing = false;
        this.isDoneProcessing = false;
        this.isDoneCreating = false;
        this.isDoneDispatching = false;
        this.isExecutionFinished = false;
        this.isExecutionDone = false;
        this.workersHaveConnected = false;

        this._dispatchSlices = this._dispatchSlices.bind(this);
        this.setFailingStatus = this.setFailingStatus.bind(this);
        this.terminalError = this.terminalError.bind(this);
    }

    async initialize() {
        const { context } = this;

        const exStore = makeExStore(context);
        this.stores.exStore = await exStore;

        await this.client.start();

        let verified;
        let verifiedErr;
        try {
            verified = await this._verifyExecution();
        } catch (err) {
            verifiedErr = err;
        }
        if (!verified) {
            this.isShutdown = true;
            await this.stores.exStore.shutdown(true);
            await this.client.shutdown();
            if (verifiedErr) {
                throw verifiedErr;
            }
            return;
        }

        const stateStore = makeStateStore(context);
        this.stores.stateStore = await stateStore;

        await this.server.start();

        this.isInitialized = true;

        this.server.onClientOnline((workerId) => {
            this.logger.trace(`worker ${workerId} is online`);
            this._adjustSlicerQueueLength();
            this.workersHaveConnected = true;
            clearTimeout(this.workerConnectTimeoutId);
        });

        this.server.onClientAvailable((workerId) => {
            this.logger.trace(`worker ${workerId} is available`);
            this.executionAnalytics.increment('workers_joined');
        });

        this.server.onClientDisconnect((workerId) => {
            this.logger.trace(`worker ${workerId} is disconnected but it may reconnect`);
            this.executionAnalytics.increment('workers_disconnected');
        });

        this.server.onClientOffline((workerId) => {
            this.logger.trace(`worker ${workerId} is offline`);
            this._adjustSlicerQueueLength();
            this._startWorkerDisconnectWatchDog();
        });

        this.server.onClientReconnect((workerId) => {
            clearTimeout(this.workerDisconnectTimeoutId);
            this.logger.trace(`worker ${workerId} is reconnected`);

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
            this.logger.trace('slicer sending a execution update', update);

            // this is updating the opConfig for elasticsearch start and/or end dates for ex,
            // this assumes elasticsearch is first
            this.stores.exStore.update(this.exId, { operations: update });
        });

        this.engine = makeEngine(this);

        this.logger.debug(`execution ${this.exId} is initialized`);

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

        const errors = [];

        try {
            await this._startExecution();
        } catch (err) {
            errors.push(err);
        }

        this.events.emit('worker:shutdown');
        this.logger.debug(`execution ${this.exId} is done`);

        if (errors.length) {
            const errMsg = errors.map(e => e.stack).join(', and');
            throw new Error(`Execution run failure: ${errMsg}`);
        }
    }

    async resume() {
        if (!this.isPaused) return;

        this.logger.info(`execution ${this.exId} is resuming...`);
        this.isPaused = false;

        await Promise.delay(100);
    }

    async pause() {
        if (this.isPaused) return;

        this.logger.info(`execution ${this.exId} is pausing...`);
        this.isPaused = true;
        await Promise.delay(100);
    }

    async allocateSlice(request, slicerId, startingOrder) {
        let slicerOrder = startingOrder;
        const { logger, slicerQueue, exId } = this;
        const { stateStore } = this.stores;

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
        const { exStore } = this.stores;

        const errMsg = `slicer: ${this.exId} has encountered a processing_error`;
        this.logger.error(errMsg);

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = await exStore.executionMetaData(executionStats, errMsg);
        await exStore.setStatus(this.exId, 'failing', errorMeta);
    }

    async terminalError(err) {
        if (this.isExecutionDone) return;

        const { exStore } = this.stores;

        this.slicerFailed = true;

        const msg = `slicer for ex ${this.exId} had an error, shutting down execution`;
        this.logger.error(msg, err);

        const errMsg = `${msg}, caused by ${err.stack ? err.stack : _.toString(err)}`;

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = await exStore.executionMetaData(executionStats, errMsg);

        await exStore.setStatus(this.exId, 'failed', errorMeta);

        await this.client.sendExecutionFinished(errMsg);

        this.isExecutionDone = true;
        this.logger.fatal(`execution ${this.exId} is done because of slice failure`);
    }

    async slicerCompleted() {
        this.slicersDoneCount += 1;

        const remainingSlicers = _.size(this.slicers) - this.slicersDoneCount;
        this.logger.info(`a slicer for execution: ${this.exId} has completed its range, ${remainingSlicers} remainging slicers`);

        if (remainingSlicers > 0) return;
        this.slicersDone = true;

        this.events.emit('slicers:finished');

        this.logger.info(`all slicers for execution: ${this.exId} have been completed, waiting for slices in slicerQueue to be processed`);
        this.executionAnalytics.set('queuing_complete', newFormattedDate());
    }

    async shutdown() {
        if (this.isShutdown) return;
        if (!this.isInitialized) return;

        if (this.isShuttingDown) {
            this.logger.debug(`execution shutdown was called for ex ${this.exId} but it was already shutting down, will block until done`);
            await waitForWorkerShutdown(this.context, 'worker:shutdown:complete');
            return;
        }

        this.logger.debug(`execution shutdown was called for ex ${this.exId}`);
        this.isShuttingDown = true;
        this.isPaused = false;

        const shutdownErrs = [];

        clearTimeout(this.workerConnectTimeoutId);
        clearTimeout(this.workerDisconnectTimeoutId);

        const error = await this._waitForExecutionFinished();
        if (error) {
            shutdownErrs.push(error);
        }

        if (!this.isExecutionDone) {
            this.isExecutionDone = true;
            this.logger.fatal(`execution ${this.exId} is being marked as done even though it didn't finish when shutdown was called`);
        }

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

        this.logger.warn(`execution controller ${this.exId} is shutdown`);
        this.isShutdown = true;

        if (shutdownErrs.length) {
            const errMsg = shutdownErrs.map(e => e.stack).join(', and');
            const shutdownErr = new Error(`Failed to shutdown correctly: ${errMsg}`);
            this.events.emit(this.context, 'worker:shutdown:complete', shutdownErr);
            throw shutdownErr;
        }

        this.events.emit(this.context, 'worker:shutdown:complete');
    }

    get slicesAreComplete() {
        if (!this.isStarted) return false;
        if (!this.recoveryComplete) return false;

        const noPendingSlices = this.server.pendingSlices.length === 0;
        const noActiveWorkers = this.server.activeWorkers.length === 0;
        return this.slicesEnqueued > 0 && noPendingSlices && noActiveWorkers;
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
        const { exStore } = this.stores;
        this._startWorkConnectWatchDog();

        this.slicerAnalytics = makeSliceAnalytics(this.context, this.executionContext);

        this.logger.info(`starting execution ${this.exId}...`);
        this.startTime = Date.now();

        this.executionAnalytics.start();

        await Promise.all([
            exStore.setStatus(this.exId, 'running'),
            this.client.sendAvailable()
        ]);

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
        this.isProcessing = true;
        const statsInterval = setInterval(() => {
            this.executionAnalytics.set('workers_available', this.server.availableClientCount);
            this.executionAnalytics.set('queued', this.slicerQueue.size());
            this.executionAnalytics.set('workers_active', this.server.activeWorkers.length);
        }, 500);

        await Promise.all([
            this._createSlices(),
            this._dispatchSlices(),
        ]);

        clearInterval(statsInterval);

        this.isProcessing = false;
        if (this.isDoneCreating && this.isDoneDispatching) {
            this.logger.trace(`execution ${this.exId} is done processing slices`);
            this.isDoneProcessing = true;
        } else {
            this.logger.warn(`execution ${this.exId} is not done processing slices because it had to exit early`);
            this.isDoneProcessing = false;
        }
    }

    async _createSlices() {
        if (this.isExecutionDone || this.isShuttingDown) {
            this.logger.debug(`execution ${this.exId} will stop creating slices because it shutdown early`);
            return false;
        }

        if (this.slicersDone) {
            this.logger.debug(`execution ${this.exId} is done creating slices`);
            this.isDoneCreating = true;
            return true;
        }

        await Promise.delay(0);

        if (this.isPaused) {
            this.logger.debug('execution is paused, wait for resume...');
            const found = await this.client.onceWithTimeout('execution:resume', 1000);
            if (found == null) {
                return this._createSlices();
            }
        }

        // If all slicers are not done, the slicer queue is not overflown and the scheduler
        // is set, then attempt to provision more slices
        const needsMoreSlices = this.slicerQueue.size() < this.executionContext.queueLength;
        if (this.slicersReady && needsMoreSlices) {
            try {
                await Promise.map(this.scheduler, slicerFn => slicerFn());
            } catch (err) {
                this.logger.error('Error creating slicer', err);
            }
        }

        return this._createSlices();
    }

    async _dispatchSlices() {
        if (this.isExecutionDone) {
            this.logger.debug(`execution ${this.exId} will stop dispatching slices because it shutdown early`);
            return false;
        }

        if (this.slicesAreComplete && this.isDoneCreating) {
            this.logger.trace(`execution ${this.exId} is done dispatching slices`);
            this.isDoneDispatching = true;
            return true;
        }

        await Promise.delay(0);

        if (this.isPaused) {
            this.logger.debug('execution is paused, wait for resume...');
            const found = await this.client.onceWithTimeout('execution:resume', 1000);
            if (found == null) {
                return this._dispatchSlices();
            }
        }

        if (!this.server.workerQueueSize) {
            const found = await this.server.onceWithTimeout('worker:enqueue', 1000);
            if (found == null) {
                return this._dispatchSlices();
            }
        }

        const slice = this.slicerQueue.dequeue();
        if (!slice) {
            return this._dispatchSlices();
        }

        let dispatched;
        let workerId;

        try {
            ({ dispatched, workerId } = await this.server.dispatchSlice(slice));
        } catch (err) {
            this.logger.error('Error dispatching slices to worker', err);
            return this._dispatchSlices();
        }

        if (!workerId || !dispatched) {
            this.slicerQueue.unshift(slice);
            this.logger.debug(`worker "${workerId}" is not available to process slice ${slice.slice_id}`);
        } else {
            this.logger.debug(`dispatched slice ${slice.slice_id} to worker ${workerId}`);
        }

        return this._dispatchSlices();
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

        this.slicersReady = true;
    }

    async _recoverSlicesInit() {
        this.recover = makeExecutionRecovery(
            this.context,
            this.terminalError,
            this.stores.stateStore,
            this.executionContext
        );

        await this.recover.initialize();

        this.logger.info(`execution: ${this.exId} is starting in recovery mode`);

        this.slicersDoneCount = 0;
        this.slicers = await this.recover.newSlicer();

        this.scheduler = await this.engine.registerSlicers(this.slicers, true);
        this.slicersReady = true;
    }

    async _waitForRecovery() {
        if (this.recoveryComplete) return;

        await new Promise((resolve) => {
            this.events.once('execution:recovery:complete', (startingPoints) => {
                this.logger.trace('recovery starting points', startingPoints);
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
        if (this.isExecutionFinished) return;

        try {
            await this._updateExecutionStatus();
        } catch (err) {
            /* istanbul ignore next */
            const errMsg = parseError(err);
            this.logger.error(`execution ${this.exId} has run to completion but the process has failed while updating the execution status, slicer will soon exit, error: ${errMsg}`);
        }

        this._logFinishedJob();

        await Promise.all([
            this.server.sendExecutionFinishedToAll(this.exId),
            this.client.sendExecutionFinished()
        ]);

        this.isExecutionFinished = true;
        this.isExecutionDone = true;

        this.logger.debug(`execution ${this.exId} is successfully finished`);
    }

    async _updateExecutionStatus() {
        // if this.slicerFailed is true, slicer has already been marked as failed
        if (this.slicerFailed) return;

        const { logger } = this;
        const { exStore } = this.stores;

        const executionStats = this.executionAnalytics.getAnalytics();

        if (!this.isDoneProcessing) {
            // if status is stopping or stopped, only update the execution metadata
            const status = await exStore.getStatus(this.exId);
            const isStopping = status === 'stopping' || status === 'stopped';
            if (isStopping) {
                const metaData = exStore.executionMetaData(executionStats);
                logger.debug(`execution is set to ${status}, status will not be updated`);
                await exStore.update(this.exId, metaData);
                return;
            }

            const errMsg = `execution ${this.exId} received shutdown before the slicer could complete, setting status to "terminated"`;
            const metaData = exStore.executionMetaData(executionStats, errMsg);
            logger.error(errMsg);
            await exStore.setStatus(this.exId, 'terminated', metaData);
            return;
        }

        const errCount = await this._checkExecutionState();
        if (errCount > 0) {
            const errMsg = `execution: ${this.exId} had ${errCount} slice failures during processing`;
            const errorMeta = exStore.executionMetaData(executionStats, errMsg);
            logger.error(errMsg);
            await exStore.setStatus(this.exId, 'failed', errorMeta);
            return;
        }

        const metaData = exStore.executionMetaData(executionStats);
        logger.info(`execution ${this.exId} has completed`);
        await exStore.setStatus(this.exId, 'completed', metaData);
    }

    _logFinishedJob() {
        if (this.startTime == null) {
            this.logger.debug('no start time, cannot log finished job');
            return;
        }

        const endTime = Date.now();
        const elapsed = endTime - this.startTime;
        const time = elapsed < 1000 ? 1 : Math.round((elapsed) / 1000);

        this.executionAnalytics.set('job_duration', time);

        if (this.collectAnalytics) {
            this.slicerAnalytics.analyzeStats();
        }

        this.logger.info(`execution ${this.exId} has finished in ${time} seconds`);
    }

    _checkExecutionState() {
        const query = `ex_id:${this.exId} AND (state:error OR state:start)`;
        return this.stores.stateStore.count(query, 0);
    }

    _waitForExecutionFinished() {
        if (!this.isStarted) return null;

        const timeout = Math.round(this.shutdownTimeout * 0.8);
        const shutdownAt = timeout + Date.now();

        // hoist this error to get a better stack trace
        const timeoutError = new Error(`Shutdown timeout of ${this.shutdownTimeout}ms waiting for the execution to finish...`);
        const logShuttingDown = _.throttle(() => {
            this.logger.debug('shutdown is waiting for execution to finish...');
        }, 1000);

        const checkExecution = async () => {
            if (this.isExecutionDone) {
                this.logger.trace('execution finished while shutting down');
                return null;
            }

            const now = Date.now();
            if (now > shutdownAt) {
                this.logger.error(timeoutError.message);
                return timeoutError;
            }

            logShuttingDown();
            await Promise.delay(100);
            return checkExecution();
        };

        return checkExecution();
    }

    // verify the execution can be set to running
    async _verifyExecution() {
        const { exStore } = this.stores;
        let error;

        const terminalStatuses = exStore.getTerminalStatuses();
        const runningStatuses = exStore.getRunningStatuses();
        const status = await exStore.getStatus(this.exId);

        if (_.includes(terminalStatuses, status)) {
            error = new Error(`Execution ${this.exId} was starting in terminal status, sending execution:finished event to cluster master`);
        } else if (_.includes(runningStatuses, status)) {
            error = new Error(`Execution ${this.exId} was starting in running status, sending execution:finished event to cluster master`);
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

        const timeout = this.context.sysconfig.teraslice.slicer_timeout;
        const err = new Error(`No workers have connected to slicer in the allotted time: ${timeout} ms`);

        this.workerConnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerConnectTimeoutId);

            if (this.workersHaveConnected) return;

            this.logger.warn(`A worker has not connected to a slicer for ex: ${this.exId}, shutting down execution`);

            this.terminalError(err);
        }, timeout);
    }

    _startWorkerDisconnectWatchDog() {
        clearTimeout(this.workerDisconnectTimeoutId);

        if (this.isShuttingDown) return;
        if (this.server.onlineClientCount > 0) return;

        const err = new Error(`All workers from slicer #${this.exId} have disconnected`);

        this.workerDisconnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerDisconnectTimeoutId);

            if (this.server.onlineClientCount > 0) return;

            this.terminalError(err);
        }, this.workerDisconnectTimeout);
    }
}

module.exports = ExecutionController;
