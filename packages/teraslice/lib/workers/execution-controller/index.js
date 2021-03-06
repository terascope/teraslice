'use strict';

const ms = require('ms');
const _ = require('lodash');
const Messaging = require('@terascope/teraslice-messaging');
const {
    TSError, includes, get, pDelay, getFullErrorStack, logError, pWhile, makeISODate
} = require('@terascope/utils');
const { waitForWorkerShutdown } = require('../helpers/worker-shutdown');
const { makeStateStore, makeExStore, SliceState } = require('../../storage');
const { makeLogger, generateWorkerId } = require('../helpers/terafoundation');
const ExecutionAnalytics = require('./execution-analytics');
const makeSliceAnalytics = require('./slice-analytics');
const Scheduler = require('./scheduler');
const Metrics = require('../metrics');

const ExecutionControllerServer = Messaging.ExecutionController.Server;
const ClusterMasterClient = Messaging.ClusterMaster.Client;
const { formatURL } = Messaging;

class ExecutionController {
    constructor(context, executionContext) {
        const workerId = generateWorkerId(context);
        const logger = makeLogger(context, 'execution_controller');
        const events = context.apis.foundation.getSystemEvents();
        const slicerPort = executionContext.config.slicer_port;
        const performanceMetrics = executionContext.config.performance_metrics;
        const config = context.sysconfig.teraslice;
        const networkLatencyBuffer = get(config, 'network_latency_buffer');
        const actionTimeout = get(config, 'action_timeout');
        const workerDisconnectTimeout = get(config, 'worker_disconnect_timeout');
        const nodeDisconnectTimeout = get(config, 'node_disconnect_timeout');
        const shutdownTimeout = get(config, 'shutdown_timeout');

        this.server = new ExecutionControllerServer({
            port: slicerPort,
            networkLatencyBuffer,
            actionTimeout,
            workerDisconnectTimeout,
            logger
        });

        const clusterMasterPort = get(config, 'port');
        const clusterMasterHostname = get(config, 'master_hostname');

        this.client = new ClusterMasterClient({
            clusterMasterUrl: formatURL(clusterMasterHostname, clusterMasterPort),
            executionContext,
            networkLatencyBuffer,
            actionTimeout,
            nodeDisconnectTimeout,
            connectTimeout: nodeDisconnectTimeout,
            exId: executionContext.exId,
            logger
        });

        this.executionAnalytics = new ExecutionAnalytics(context, executionContext, this.client);

        this.scheduler = new Scheduler(context, executionContext);
        this.metrics = performanceMetrics
            ? new Metrics({
                logger
            })
            : null;

        this.exId = executionContext.exId;
        this.workerId = workerId;
        this.logger = logger;
        this.events = events;
        this.context = context;
        this.executionContext = executionContext;
        this.collectAnalytics = this.executionContext.config.analytics;
        this.shutdownTimeout = shutdownTimeout;
        this.workerDisconnectTimeout = workerDisconnectTimeout;
        this.stores = {};

        this.isPaused = false;
        this.isShutdown = false;
        this.isShuttingDown = false;
        this.isInitialized = false;
        this.isStarted = false;
        this.pendingDispatches = 0;
        this.pendingSlices = 0;
        this.isDoneProcessing = false;
        this.isExecutionFinished = false;
        this.isExecutionDone = false;
        this.workersHaveConnected = false;
        this._handlers = {};

        this._updateExecutionStats = _.debounce(
            () => {
                this._updateExecutionStatsNow();
            },
            100,
            {
                leading: true,
                trailing: true,
                maxWait: 500
            }
        );

        this._startSliceFailureWatchDog = this._initSliceFailureWatchDog();
    }

    async initialize() {
        const { context } = this;

        const exStore = await makeExStore(context);
        this.stores.exStore = exStore;

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

        const stateStore = await makeStateStore(context);
        this.stores.stateStore = stateStore;

        // attach to scheduler
        this.scheduler.stateStore = stateStore;
        this.scheduler.exStore = exStore;

        await this.server.start();

        if (this.metrics != null) {
            await this.metrics.initialize();
        }

        this.isInitialized = true;

        this.server.onClientOnline((workerId) => {
            clearTimeout(this.workerConnectTimeoutId);
            this.workerConnectTimeoutId = null;

            this.logger.trace(`worker ${workerId} is online`);
            this.workersHaveConnected = true;
            this.executionAnalytics.increment('workers_joined');

            this._updateExecutionStats();
        });

        this.server.onClientAvailable((workerId) => {
            this.logger.trace(`worker ${workerId} is available`);
            this.executionAnalytics.set('workers_active', this.server.activeWorkerCount);
            this.executionAnalytics.set('workers_available', this.server.availableClientCount);

            this._updateExecutionStats();
        });

        this.server.onClientUnavailable(() => {
            this.executionAnalytics.set('workers_active', this.server.activeWorkerCount);
            this.executionAnalytics.set('workers_available', this.server.availableClientCount);
        });

        this.server.onClientDisconnect((workerId) => {
            this.logger.trace(`worker ${workerId} disconnected but it may reconnect`);
            this.executionAnalytics.increment('workers_disconnected');
            this.executionAnalytics.set('workers_active', this.server.activeWorkerCount);

            this._startWorkerDisconnectWatchDog();
            this._updateExecutionStats();
        });

        this.server.onClientReconnect((workerId) => {
            clearTimeout(this.workerDisconnectTimeoutId);
            this.workerConnectTimeoutId = null;

            this.logger.trace(`worker ${workerId} is reconnected`);
            this.executionAnalytics.increment('workers_reconnected');
        });

        this.client.onExecutionPause(() => this.pause());
        this.client.onExecutionResume(() => this.resume());

        this.server.onSliceSuccess((workerId, response) => {
            process.nextTick(() => {
                const { slice_id: sliceId } = response.slice;
                this.logger.info(`worker ${workerId} has completed its slice ${sliceId}`);
                this.events.emit('slice:success', response);
                this._removePendingSlice();
                this._updateExecutionStats();
                this.executionContext.onSliceComplete(response);
            });
        });

        this.server.onSliceFailure((workerId, response) => {
            process.nextTick(() => {
                this.logger.error(`worker: ${workerId} has failure completing its slice`, response);
                this.events.emit('slice:failure', response);

                if (this.scheduler.canComplete()) {
                    this.setFailingStatus('slice failure event');
                } else if (this.scheduler.isRecovering()) {
                    this._terminalError(new Error('Slice failed while recovering'));
                } else {
                    // in persistent mode we set watchdogs to monitor
                    // when failing can be set back to running
                    this._startSliceFailureWatchDog();
                }
                this._removePendingSlice();
                this._updateExecutionStats();
                this.executionContext.onSliceComplete(response);
            });
        });

        this._handlers['slicer:execution:update'] = (data) => {
            this.logger.warn(data, 'event slicer:execution:update has been removed, used context.apis.executionContext.setMetadata(key, value): Promise<void>');
        };

        this._handlers['slicers:finished'] = (err) => {
            if (err) {
                this._terminalError(err);
            }
        };

        this._handlers['recovery:failure'] = (err) => {
            logError(this.logger, err, 'recovery finished due to failure');
            this._terminalError(err);
        };

        Object.entries(this._handlers).forEach(([event, handler]) => {
            this.events.on(event, handler);
        });

        if (this.collectAnalytics) {
            this.slicerAnalytics = makeSliceAnalytics(this.context, this.executionContext);
        }

        // This initializes user code, need to throw terminal error
        // so it can be surfaced
        try {
            await this.scheduler.initialize();
        } catch (err) {
            await this._terminalError(err);
            throw err;
        }

        this.logger.info(`execution: ${this.exId} initialized execution_controller`);

        this.isInitialized = true;
    }

    async run() {
        if (!this.isInitialized) return;

        this._startWorkConnectWatchDog();

        this.executionAnalytics.start();

        try {
            await this._runExecution();
        } catch (err) {
            logError(this.logger, err, 'Run execution error');
        }

        this.events.emit('worker:shutdown');
        await this.executionContext.shutdown();

        // help the workers go offline
        this.server.isShuttingDown = true;

        await this._finishExecution();

        try {
            await Promise.all([this.client.sendExecutionFinished(), this._waitForWorkersToExit()]);
        } catch (err) {
            logError(this.logger, err, 'Failure sending execution finished');
        }

        this.logger.debug(`execution ${this.exId} is done`);
    }

    async resume() {
        if (!this.isPaused) return;

        this.logger.info(`execution ${this.exId} is resuming...`);

        this.isPaused = false;
        this.scheduler.start();

        await pDelay(100);
    }

    async pause() {
        if (this.isPaused) return;

        this.logger.info(`execution ${this.exId} is pausing...`);

        this.isPaused = true;
        this.scheduler.pause();

        await pDelay(100);
    }

    async setFailingStatus(reason) {
        const { exStore } = this.stores;

        const errMsg = `execution ${this.exId} has encountered a processing error, reason: ${reason}`;
        this.logger.error(errMsg);

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = exStore.executionMetaData(executionStats, errMsg);
        try {
            await exStore.setStatus(this.exId, 'failing', errorMeta);
        } catch (err) {
            logError(this.logger, err, 'Failure to set execution status to "failing"');
        }
    }

    async _terminalError(err) {
        if (this.isExecutionDone) return;

        const { exStore } = this.stores;

        this.slicerFailed = true;

        const error = new TSError(err, {
            reason: `slicer for ex ${this.exId} had an error, shutting down execution`
        });
        this.logger.error(error);

        const executionStats = this.executionAnalytics.getAnalytics();
        const fullStack = getFullErrorStack(error);
        const errorMeta = exStore.executionMetaData(executionStats, fullStack);

        try {
            await exStore.setStatus(this.exId, 'failed', errorMeta);
        } catch (_err) {
            logError(this.logger, _err, 'failure setting status to failed');
        }

        this.logger.fatal(`execution ${this.exId} is ended because of slice failure`);
        await this._endExecution();
    }

    async shutdown(block = true) {
        if (this.isShutdown) return;
        if (!this.isInitialized) return;
        if (this.isShuttingDown) {
            const msgs = [
                'execution',
                `shutdown was called for ${this.exId}`,
                'but it was already shutting down',
                block ? ', will block until done' : ''
            ];
            this.logger.debug(msgs.join(' '));

            if (block) {
                await waitForWorkerShutdown(this.context, 'worker:shutdown:complete');
            }
            return;
        }

        this.logger.debug(`execution shutdown was called for ex ${this.exId}`);

        const shutdownErrs = [];
        const pushError = (err) => {
            shutdownErrs.push(err);
        };

        // allow clients to go immediately from disconnect to offline
        this.server.isShuttingDown = true;

        // tell the scheduler to stop producing slices
        await this.scheduler.stop();

        // remove any listeners
        Object.entries(this._handlers).forEach(([event, handler]) => {
            this.events.removeListener(event, handler);
            this._handlers[event] = null;
        });

        this.isShuttingDown = true;
        this.isPaused = false;

        clearInterval(this.sliceFailureInterval);
        clearTimeout(this.workerConnectTimeoutId);
        clearTimeout(this.workerDisconnectTimeoutId);
        clearInterval(this._verifyStoresInterval);

        await this._waitForExecutionFinished();

        await Promise.all([
            (async () => {
                if (!this.collectAnalytics) return;

                await this.slicerAnalytics.shutdown().catch(pushError);
            })(),
            (async () => {
                // the execution analytics must be shutdown
                // before the message client
                await this.executionAnalytics.shutdown().catch(pushError);

                await this.client.shutdown().catch(pushError);
            })(),
            (async () => {
                await this.scheduler.shutdown().catch(pushError);
            })(),
            (async () => {
                await this.server.shutdown().catch(pushError);
            })(),
            (async () => {
                const stores = Object.values(this.stores);
                await Promise.all(stores.map((store) => store.shutdown(true).catch(pushError)));
            })(),
            (async () => {
                if (this.metrics == null) return;
                await this.metrics.shutdown().catch(pushError);
            })()
        ]);

        this.logger.warn(`execution controller ${this.exId} is shutdown`);
        this.isShutdown = true;

        if (shutdownErrs.length) {
            const errMsg = shutdownErrs.map((e) => e.stack).join(', and');
            const shutdownErr = new Error(`Failed to shutdown correctly: ${errMsg}`);
            this.events.emit(this.context, 'worker:shutdown:complete', shutdownErr);
            await pDelay(0);
            throw shutdownErr;
        }

        this.events.emit(this.context, 'worker:shutdown:complete');
    }

    async _runExecution() {
        // wait for paused
        await pWhile(async () => {
            if (!this.isPaused || this.isShuttdown) return true;
            await pDelay(100);
            return false;
        });

        this.logger.info(`starting execution ${this.exId}...`);
        this.startTime = Date.now();

        this.isStarted = true;
        this._verifyStores();

        // start creating / dispatching slices, this will block until done
        await Promise.all([
            this.client.sendAvailable(),
            this._runDispatch(),
            this.scheduler.run()
        ]);

        const schedulerSuccessful = this.scheduler.isFinished && this.scheduler.slicersDone;

        await this._waitForPendingSlices();

        if (schedulerSuccessful && this.isDoneDispatching) {
            this.logger.debug(`execution ${this.exId} is done processing slices`);
            this.isDoneProcessing = true;
        } else if (!this.isShuttdown) {
            this.logger.debug(`execution ${this.exId} did not finish`);
        } else {
            this.logger.debug(`execution ${this.exId} is exiting...`);
        }
    }

    // dispatching should be pushed out into its own module
    async _runDispatch() {
        this.isDoneDispatching = false;

        let dispatchInterval;

        // returns a boolean to indicate whether
        // dispatching should continue
        const isRunning = () => {
            if (this.isShuttingDown) return false;
            if (this.isExecutionDone) return false;
            if (this.scheduler.isFinished && !this.pendingDispatches) return false;
            return true;
        };

        const isPaused = () => this.isPaused;
        const canDispatch = () => {
            const workers = this.server.workerQueueSize;
            const slices = this.scheduler.queueLength;

            return workers > 0 && slices > 0;
        };

        const dequeueAndDispatch = () => {
            const reenqueue = [];
            const dispatch = [];

            const slices = this.scheduler.getSlices(this.server.workerQueueSize);
            slices.forEach((slice) => {
                const workerId = this.server.dequeueWorker(slice);
                if (!workerId) {
                    reenqueue.push(slice);
                } else {
                    this._addPendingDispatch();
                    this._addPendingSlice();
                    dispatch.push({ slice, workerId });
                }
            });
            slices.length = 0;

            if (dispatch.length > 0) {
                process.nextTick(() => {
                    const promises = dispatch.map((input) => {
                        const { slice, workerId } = input;
                        return this._dispatchSlice(slice, workerId);
                    });
                    dispatch.length = 0;

                    Promise.all(promises).catch((err) => logError(this.logger, err, 'failure to dispatch slices'));
                });
            }

            if (reenqueue.length > 0) {
                // this isn't really ideal since we adding
                // to the beginning of the queue and
                // it may end up in a recursive loop trying
                // to process that slice
                this.scheduler.enqueueSlices(reenqueue, true);
                reenqueue.length = 0;
            }
        };

        await pDelay(0);

        await new Promise((resolve) => {
            this.logger.debug('dispatching slices...');

            dispatchInterval = setInterval(() => {
                if (!isRunning()) {
                    resolve();
                    return;
                }

                if (isPaused()) return;

                if (canDispatch()) {
                    dequeueAndDispatch();
                }
            }, 5);
        });

        clearInterval(dispatchInterval);

        this.isDoneDispatching = true;
    }

    _dispatchSlice(slice, workerId) {
        this.logger.trace(`dispatching slice ${slice.slice_id} for worker ${workerId}`);

        return this.server
            .dispatchSlice(slice, workerId)
            .then((dispatched) => {
                if (dispatched) {
                    this.logger.debug(`dispatched slice ${slice.slice_id} to worker ${workerId}`);
                    this.executionContext.onSliceDispatch(slice);
                } else {
                    this.logger.warn(
                        `worker "${workerId}" is not available to process slice ${slice.slice_id}`
                    );
                    this.scheduler.enqueueSlice(slice, true);
                    this._removePendingSlice();
                }

                this._removePendingDispatch();
            })
            .catch((err) => {
                logError(this.logger, err, 'error dispatching slice');
                this._removePendingDispatch();
                this._removePendingSlice();
            });
    }

    async _finishExecution() {
        if (this.isExecutionFinished) return;

        this._logFinishedJob();

        // refresh the state store index
        // to prevent the execution from failing incorrectly
        await this.stores.stateStore.refresh();

        try {
            await this._updateExecutionStatus();
        } catch (err) {
            /* istanbul ignore next */
            const error = new TSError(err, {
                reason: `execution ${
                    this.exId
                } has run to completion but the process has failed while updating the execution status, slicer will soon exit`
            });
            this.logger.error(error);
        }

        this.isExecutionFinished = true;
        await this._endExecution();
    }

    async _endExecution() {
        this.isExecutionDone = true;
        await this.scheduler.shutdown();
    }

    _updateExecutionStatsNow() {
        this.executionContext.onExecutionStats({
            workers: {
                connected: this.server.onlineClientCount,
                available: this.server.availableClientCount
            },
            slices: {
                processed: this.executionAnalytics.get('processed'),
                failed: this.executionAnalytics.get('failed')
            }
        });
    }

    async _updateExecutionStatus() {
        // if this.slicerFailed is true, slicer has already been marked as failed
        if (this.slicerFailed) return;

        const { exStore } = this.stores;

        const executionStats = this.executionAnalytics.getAnalytics();

        if (!this.isDoneProcessing) {
            // if status is stopping or stopped, only update the execution metadata
            const status = await exStore.getStatus(this.exId);
            const isStopping = status === 'stopping' || status === 'stopped';
            if (isStopping) {
                this.logger.debug(`execution is set to ${status}, status will not be updated`);
                await exStore.updatePartial(this.exId, (existing) => {
                    const metaData = exStore.executionMetaData(executionStats);
                    return Object.assign(existing, metaData, {
                        _updated: makeISODate()
                    });
                });
                return;
            }

            const errMsg = `execution ${
                this.exId
            } received shutdown before the slicer could complete, setting status to "terminated"`;
            const metaData = exStore.executionMetaData(executionStats, errMsg);
            this.logger.error(errMsg);
            await exStore.setStatus(this.exId, 'terminated', metaData);
            return;
        }

        const [errors, started, pending] = await Promise.all([
            this.stores.stateStore.countByState(this.exId, SliceState.error),
            this.stores.stateStore.countByState(this.exId, SliceState.start),
            this.stores.stateStore.countByState(this.exId, SliceState.pending),
        ]);

        if (errors > 0 || started > 0) {
            const errMsg = this._formartExecutionFailure({ errors, started, pending });
            const errorMeta = exStore.executionMetaData(executionStats, errMsg);
            this.logger.error(errMsg);
            await exStore.setStatus(this.exId, 'failed', errorMeta);
            return;
        }

        const metaData = exStore.executionMetaData(executionStats);
        this.logger.info(`execution ${this.exId} has completed`);
        await exStore.setStatus(this.exId, 'completed', metaData);
    }

    _logFinishedJob() {
        const endTime = Date.now();
        const elapsed = endTime - this.startTime;
        const time = elapsed < 1000 ? 1 : Math.round(elapsed / 1000);

        this.executionAnalytics.set('job_duration', time);

        if (this.collectAnalytics && this.slicerAnalytics) {
            this.slicerAnalytics.analyzeStats();
        }

        this.logger.info(`execution ${this.exId} has finished in ${time} seconds`);
    }

    _formartExecutionFailure({ started, errors, pending }) {
        const startedMsg = started <= 1
            ? `had ${started} slice stuck in started`
            : `had ${started} slices stuck in started`;

        const pendingMsg = pending <= 1
            ? `had ${pending} slice are still pending`
            : `had ${pending} slices are still pending`;

        const errorsMsg = errors <= 1
            ? `had ${errors} slice failure`
            : `had ${errors} slice failures`;

        const none = (errors + started + pending) === 0;
        const stateMessages = [
            started || none ? startedMsg : '',
            pending || none ? pendingMsg : '',
            errors || none ? errorsMsg : '',
        ].filter(Boolean);

        return `execution: ${this.exId} ${stateMessages} during processing`;
    }

    async _waitForWorkersToExit() {
        if (!this.server.onlineClientCount) return;

        const timeoutOutAt = this.workerDisconnectTimeout + Date.now();

        const logWaitingForWorkers = _.throttle(() => {
            this.logger.debug(`waiting for ${this.server.onlineClientCount} to go offline`);
        }, 1000);

        const checkOnlineCount = async () => {
            if (this.isExecutionFinished) {
                this.logger.trace('execution finished while waiting for workers to go offline');
                return;
            }

            if (!this.client.ready) return;

            if (!this.server.onlineClientCount) {
                this.logger.trace('workers all workers have disconnected');
                return;
            }

            const now = Date.now();
            if (now > timeoutOutAt) {
                return;
            }

            logWaitingForWorkers();

            await pDelay(100);
            await checkOnlineCount();
        };

        await checkOnlineCount();
    }

    async _waitForPendingSlices() {
        const logPendingSlices = _.throttle(() => {
            this.logger.debug(`waiting for ${this.pendingSlices} slices to finish`);
        }, 1000);

        const checkPendingSlices = async () => {
            if (this.isShuttingDown) return;
            if (!this.pendingSlices) {
                this.logger.debug('all pending slices are done');
                return;
            }

            if (!this.server.onlineClientCount) {
                this.logger.warn(
                    `clients are all offline, but there are still ${
                        this.pendingSlices
                    } pending slices`
                );
                return;
            }

            logPendingSlices();

            await pDelay(100);
            await checkPendingSlices();
        };

        await checkPendingSlices();
    }

    _waitForExecutionFinished() {
        const timeout = Math.round(this.shutdownTimeout * 0.8);
        const shutdownAt = timeout + Date.now();

        const logShuttingDown = _.throttle(() => {
            this.logger.debug('shutdown is waiting for execution to finish...');
        }, 1000);

        const checkExecution = async () => {
            if (this.isExecutionDone) {
                this.logger.trace('execution finished while shutting down');
                return null;
            }

            if (!this.client.ready) return null;

            const now = Date.now();
            if (now > shutdownAt) {
                this.logger.error(
                    `Shutdown timeout of ${ms(timeout)} waiting for execution ${
                        this.exId
                    } to finish...`
                );
                return null;
            }

            logShuttingDown();
            await pDelay(100);
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

        const invalidStateMsg = (state) => {
            const prefix = `Execution ${this.exId} was starting in ${state} status`;
            return `${prefix} sending execution:finished event to cluster master`;
        };

        if (includes(terminalStatuses, status)) {
            error = new Error(invalidStateMsg('terminal'));
        } else if (includes(runningStatuses, status)) {
            error = new Error(invalidStateMsg('running'));
        } else {
            return true;
        }

        try {
            await this.client.sendExecutionFinished(error.message);
        } finally {
            logError(this.logger, error, 'Unable to verify execution on initialization');
        }

        return false;
    }

    _verifyStores() {
        let paused = false;

        const prettyStoreNames = {
            exStore: 'execution',
            stateStore: 'state'
        };

        const logPaused = _.throttle((storesStr) => {
            this.logger.warn(`${storesStr} are in a invalid state, scheduler is paused`);
        }, 10 * 1000);

        clearInterval(this._verifyStoresInterval);
        this._verifyStoresInterval = setInterval(() => {
            if (!this.stores) return;
            if (this.isShuttingDown || this.isShutdown) return;

            const invalid = [];
            for (const [name, store] of Object.entries(this.stores)) {
                try {
                    const valid = store.verifyClient();
                    if (!valid) {
                        invalid.push(prettyStoreNames[name] || name);
                    }
                } catch (err) {
                    clearInterval(this._verifyStoresInterval);
                    this._terminalError(err);
                    return;
                }
            }

            if (invalid.length) {
                const storesStr = `elasticsearch stores ${invalid.join(', ')}`;
                if (paused) {
                    logPaused(storesStr);
                    return;
                }

                this.logger.warn(`${storesStr} are in a invalid state, pausing scheduler...`);
                paused = true;
                this.scheduler.pause();
                return;
            }

            if (paused) {
                this.logger.info(
                    'elasticsearch stores are now in a valid state, resumming scheduler...'
                );
                paused = false;
                this.scheduler.start();
            }
        }, 100);
    }

    _initSliceFailureWatchDog() {
        const probationWindow = this.executionContext.config.probation_window;
        let watchDogSet = false;
        let errorCount;
        let processedCount;

        return async () => {
            if (watchDogSet) return;
            watchDogSet = true;

            const analyticsData = this.executionAnalytics.getAnalytics();
            // keep track of how many slices have been processed and failed
            errorCount = analyticsData.failed;
            processedCount = analyticsData.processed;

            await this.setFailingStatus('slice failure watch dog');

            this.sliceFailureInterval = setInterval(() => {
                const currentAnalyticsData = this.executionAnalytics.getAnalytics();
                const currentErrorCount = currentAnalyticsData.failed;
                const currentProcessedCount = currentAnalyticsData.processed;
                const errorCountTheSame = currentErrorCount === errorCount;
                const slicesHaveProcessedSinceError = currentProcessedCount > processedCount;

                if (errorCountTheSame && slicesHaveProcessedSinceError) {
                    clearInterval(this.sliceFailureInterval);

                    watchDogSet = false;
                    this.sliceFailureInterval = null;

                    const setStatusTo = this.scheduler.recovering ? 'recovering' : 'running';

                    this.logger.info(
                        `No slice errors have occurred within execution: ${
                            this.exId
                        } will be set back to '${setStatusTo}' state`
                    );

                    this.stores.exStore.setStatus(this.exId, setStatusTo)
                        .catch((err) => {
                            logError(this.logger, err, 'failure to status back to running after running');
                        });
                    return;
                }

                errorCount = currentErrorCount;
                processedCount = currentProcessedCount;
            }, probationWindow);
        };
    }

    _startWorkConnectWatchDog() {
        clearTimeout(this.workerConnectTimeoutId);

        const timeout = this.context.sysconfig.teraslice.slicer_timeout;
        const err = new Error(
            `No workers have connected to slicer in the allotted time: ${ms(timeout)}`
        );

        this.workerConnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerConnectTimeoutId);

            if (this.isShuttingDown) return;
            if (this.workersHaveConnected) return;

            this.logger.warn(
                `A worker has not connected to a slicer for execution: ${
                    this.exId
                }, shutting down execution`
            );

            this._terminalError(err);
        }, timeout);
    }

    _startWorkerDisconnectWatchDog() {
        clearTimeout(this.workerDisconnectTimeoutId);

        if (this.isShuttingDown) return;
        if (this.server.onlineClientCount > 0) return;

        const err = new Error(`All workers from workers from ${this.exId} have disconnected`);

        this.workerDisconnectTimeoutId = setTimeout(() => {
            clearTimeout(this.workerDisconnectTimeoutId);

            if (this.isShuttingDown) return;
            if (this.server.onlineClientCount > 0) return;

            this._terminalError(err);
        }, this.workerDisconnectTimeout);
    }

    _removePendingSlice() {
        this.pendingSlices--;

        if (this.pendingSlices < 0) {
            this.logger.warn('a slice was possibly finished more than once');
            this.pendingSlices = 0;
        }
    }

    _addPendingSlice() {
        if (this.pendingSlices < 0) {
            this.logger.warn('a slice was possibly finished more than once');
            this.pendingSlices = 0;
        }

        this.pendingSlices++;
    }

    _removePendingDispatch() {
        this.pendingDispatches--;

        if (this.pendingDispatches < 0) {
            this.logger.warn('a slice was possibly dispatched more than once');
            this.pendingDispatches = 0;
        }
    }

    _addPendingDispatch() {
        if (this.pendingDispatches < 0) {
            this.logger.warn('a slice was possibly dispatched more than once');
            this.pendingDispatches = 0;
        }

        this.pendingDispatches++;
    }
}

module.exports = ExecutionController;
