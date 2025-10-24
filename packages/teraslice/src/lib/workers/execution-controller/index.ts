import ms from 'ms';
import http from 'node:http';
import {
    formatURL, ExecutionController as ExController, ClusterMaster
} from '@terascope/teraslice-messaging';
import type { EventEmitter } from 'node:events';
import {
    TSError, includes, get,
    pDelay, getFullErrorStack, logError,
    pWhile, type Logger, debounce, throttle
} from '@terascope/core-utils';
import { makeISODate } from '@terascope/date-utils';
import {
    Context, SlicerExecutionContext, Slice, isPromAvailable
} from '@terascope/job-components';
import { waitForWorkerShutdown } from '../helpers/worker-shutdown.js';
import { StateStorage, ExecutionStorage, SliceState } from '../../storage/index.js';
import { makeLogger, generateWorkerId } from '../helpers/terafoundation.js';
import { ExecutionAnalytics } from './execution-analytics.js';
import { SliceAnalytics } from './slice-analytics.js';
import { Scheduler } from './scheduler.js';
import { Metrics } from '../metrics/index.js';
import { getPackageJSON } from '../../utils/file_utils.js';

export class ExecutionController {
    readonly context: Context;
    readonly executionContext: SlicerExecutionContext;
    events: EventEmitter;
    logger: Logger;
    readonly server: ExController.Server;
    readonly client: ClusterMaster.Client;
    stateStorage: StateStorage;
    executionStorage: ExecutionStorage;
    private isPaused = false;
    private isShutdown = false;
    private isShuttingDown = false;
    private isInitialized = false;
    isStarted = false;
    private pendingDispatches = 0;
    private pendingSlices = 0;
    private isDoneProcessing = false;
    private isExecutionFinished = false;
    isExecutionDone = false;
    private workersHaveConnected = false;

    private _handlers = new Map<string, ((arg: any) => void) | null>();
    executionAnalytics: ExecutionAnalytics;
    readonly scheduler: Scheduler;
    private metrics: Metrics | null;
    readonly workerId: string;
    readonly exId: string;
    private readonly shutdownTimeout: number;
    private readonly workerDisconnectTimeout: number;
    private readonly collectAnalytics: boolean;
    private slicerAnalytics!: SliceAnalytics;
    private _updateExecutionStats: any;
    private _startSliceFailureWatchDog: () => Promise<void>;
    private workerConnectTimeoutId!: NodeJS.Timeout | undefined;
    private workerDisconnectTimeoutId!: NodeJS.Timeout | undefined;
    private sliceFailureInterval!: NodeJS.Timeout | undefined;
    private verifyStoresInterval!: NodeJS.Timeout | undefined;
    private slicerFailed = false;
    private startTime: number | undefined;
    private isDoneDispatching!: boolean | undefined;

    constructor(context: Context, executionContext: SlicerExecutionContext) {
        const workerId = generateWorkerId(context);
        // Use the bunyan logger.level() function to set the log level of context.logger equal
        // to the log level of executionContext.logger.
        // If a log_level was given in the job config, it will have overwritten the default
        // log_level in the execution context.
        context.logger.level(executionContext.logger.level());
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
        this.server = new ExController.Server({
            port: slicerPort,
            networkLatencyBuffer,
            requestListener: this.requestListener.bind(this),
            actionTimeout,
            workerDisconnectTimeout,
            logger
        });

        const clusterMasterPort = get(config, 'port');
        const clusterMasterHostname = get(config, 'master_hostname');

        this.client = new ClusterMaster.Client({
            clusterMasterUrl: formatURL(clusterMasterHostname, clusterMasterPort),
            nodeDisconnectTimeout,
            networkLatencyBuffer,
            actionTimeout,
            exId: executionContext.exId,
            connectTimeout: nodeDisconnectTimeout,
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

        this.executionStorage = new ExecutionStorage(context);
        this.stateStorage = new StateStorage(context);
        // TODO: see if I can remove this debounce
        this._updateExecutionStats = debounce(
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
        if (this.context.sysconfig.teraslice.cluster_manager_type === 'native') {
            this.logger.warn('Skipping PromMetricsAPI initialization: incompatible with native clustering.');
        } else {
            const { terafoundation } = this.context.sysconfig;
            const { config, exId, jobId } = this.executionContext;
            await this.context.apis.foundation.promMetrics.init({
                terasliceName: this.context.sysconfig.teraslice.name,
                assignment: 'execution_controller',
                logger: this.logger,
                tf_prom_metrics_add_default: terafoundation.prom_metrics_add_default,
                tf_prom_metrics_enabled: terafoundation.prom_metrics_enabled,
                tf_prom_metrics_port: terafoundation.prom_metrics_port,
                job_prom_metrics_add_default: config.prom_metrics_add_default,
                job_prom_metrics_enabled: config.prom_metrics_enabled,
                job_prom_metrics_port: config.prom_metrics_port,
                labels: {
                    ex_id: exId,
                    job_id: jobId,
                    job_name: config.name,
                    assignment: 'execution_controller'
                },
                prefix: 'teraslice_job_',
                prom_metrics_display_url: terafoundation.prom_metrics_display_url

            });
            await this.setupPromMetrics();
        }

        await Promise.all([
            this.executionStorage.initialize(),
            this.stateStorage.initialize(),
            this.client.start()
        ]);

        let verified;
        let verifiedErr;

        try {
            verified = await this._verifyExecution();
        } catch (err) {
            verifiedErr = err;
        }

        if (!verified) {
            this.isShutdown = true;

            await Promise.all([
                this.executionStorage.shutdown(true),
                this.stateStorage.shutdown(true),
                this.client.shutdown()
            ]);

            if (verifiedErr) {
                throw verifiedErr;
            }
            return;
        }

        await this.server.start();

        if (this.metrics != null) {
            await this.metrics.initialize();
        }
        /// We set this to true later down the line. Not sure why
        this.isInitialized = true;

        this.server.onClientOnline((workerId) => {
            clearTimeout(this.workerConnectTimeoutId);
            this.workerConnectTimeoutId = undefined;

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
            this.workerConnectTimeoutId = undefined;

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

        this._handlers.set('slicer:execution:update', (data: any) => {
            this.logger.warn(data, 'event slicer:execution:update has been removed, used context.apis.executionContext.setMetadata(key, value): Promise<void>');
        });

        this._handlers.set('slicers:finished', (err: Error) => {
            if (err) {
                this._terminalError(err);
            }
        });

        this._handlers.set('recovery:failure', (err: Error) => {
            logError(this.logger, err, 'recovery finished due to failure');
            this._terminalError(err);
        });

        for (const [event, handler] of this._handlers.entries()) {
            if (handler !== null) {
                this.events.on(event, handler);
            }
        }

        if (this.collectAnalytics) {
            this.slicerAnalytics = new SliceAnalytics(this.context, this.executionContext);
        }

        // This initializes user code, need to throw terminal error
        // so it can be surfaced
        try {
            await this.scheduler.initialize(this.stateStorage, this.executionStorage);
        } catch (err) {
            await this._terminalError(err);
            throw err;
        }

        this.logger.info(`execution: ${this.exId} initialized execution_controller`);

        this.isInitialized = true;
        /// This will change the  '/ready' endpoint to Ready
        this.server.executionReady = true;
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

    async setFailingStatus(reason: string) {
        const errMsg = `execution ${this.exId} has encountered a processing error, reason: ${reason}`;
        this.logger.error(errMsg);

        const executionStats = this.executionAnalytics.getAnalytics();
        const errorMeta = this.executionStorage.executionMetaData(executionStats, errMsg);

        try {
            await this.executionStorage.setStatus(this.exId, 'failing', errorMeta);
        } catch (err) {
            logError(this.logger, err, 'Failure to set execution status to "failing"');
        }
    }

    async _terminalError(err: Error) {
        if (this.isExecutionDone) return;

        this.slicerFailed = true;

        const error = new TSError(err, {
            reason: `slicer for ex ${this.exId} had an error, shutting down execution`
        });

        this.logger.error(error);

        const executionStats = this.executionAnalytics.getAnalytics();
        const fullStack = getFullErrorStack(error);
        const errorMeta = this.executionStorage.executionMetaData(executionStats, fullStack);

        try {
            await this.executionStorage.setStatus(this.exId, 'failed', errorMeta);
        } catch (_err) {
            logError(this.logger, _err, 'failure setting status to failed');
        }

        this.logger.fatal(`execution ${this.exId} is ended because of slice failure`);
        await this._endExecution();
    }

    async shutdown(eventType?: string, shutdownError?: Error, block: boolean = true) {
        if (eventType === 'error' && shutdownError) {
            /// Add errors to this list as needed. Errors not in this list won't cleanup resources
            const errorList = [
                'index specified in reader does not exist'
            ];
            /// Tell cluster_master that shutdown is due to a specific error
            /// Cleans up kubernetes resources. For native, kills processes
            if (errorList.includes(shutdownError.message)) {
                this.logger.warn('sent request to cluster_master to cleanup job resources.');
                await this.client.sendExecutionFinished(shutdownError.message);
            }
        }

        /// This only applies to kubernetesV2
        if (
            this.context.sysconfig.teraslice.cluster_manager_type === 'kubernetesV2'
            && eventType === 'SIGTERM'
        ) {
            await this.stateStorage.refresh();
            const status = await this.executionStorage.getStatus(this.exId);
            const runningStatuses = this.executionStorage.getRunningStatuses();
            this.logger.debug(`Execution ${this.exId} is currently in a ${status} state`);
            /// This is an indication that the cluster_master did not call for this
            /// shutdown. We want to restart in this case.
            if (status !== 'stopping' && includes(runningStatuses, status)) {
                this.logger.info('Skipping shutdown to allow for relocation...');
                return;
            }
        }

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

        const shutdownErrs: Error[] = [];
        const pushError = (err: Error) => {
            shutdownErrs.push(err);
        };

        // allow clients to go immediately from disconnect to offline
        this.server.isShuttingDown = true;

        // tell the scheduler to stop producing slices
        await this.scheduler.stop();

        // remove any listeners
        for (const [event, handler] of this._handlers.entries()) {
            if (handler !== null) {
                this.events.removeListener(event, handler);
                this._handlers.set(event, null);
            }
        }

        this.isShuttingDown = true;
        this.isPaused = false;

        clearInterval(this.sliceFailureInterval);
        clearTimeout(this.workerConnectTimeoutId);
        clearTimeout(this.workerDisconnectTimeoutId);
        clearInterval(this.verifyStoresInterval);

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
                await Promise.all([
                    (async () => {
                        try {
                            await this.stateStorage.shutdown(true);
                        } catch (err) {
                            pushError(err);
                        }
                    })(),
                    (async () => {
                        try {
                            await this.executionStorage.shutdown(true);
                        } catch (err) {
                            pushError(err);
                        }
                    })()
                ]);
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
            this.events.emit('worker:shutdown:complete', shutdownErr);
            await pDelay(0);
            throw shutdownErr;
        }

        this.events.emit('worker:shutdown:complete');
    }

    async _runExecution() {
        // wait for paused
        await pWhile(async () => {
            if (!this.isPaused || this.isShutdown) return true;
            await pDelay(100);
            return false;
        });

        this.logger.info(`starting execution ${this.exId}...`);
        this.startTime = Date.now();

        this.isStarted = true;
        this._verifyStores();

        // start creating / dispatching slices, this will block until done
        await Promise.all([
            this.client.sendAvailable().then(() => this.logger.debug('client.sendAvailable() promise resolved')),
            this._runDispatch().then(() => this.logger.debug('_runDispatch() promise resolved')),
            this.scheduler.run().then(() => this.logger.debug('scheduler.run() promise resolved'))
        ]);

        const schedulerSuccessful = this.scheduler.isFinished && this.scheduler.slicersDone;

        await this._waitForPendingSlices();

        if (schedulerSuccessful && this.isDoneDispatching) {
            this.logger.debug(`execution ${this.exId} is done processing slices`);
            this.isDoneProcessing = true;
        } else if (!this.isShutdown) {
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
            const reenqueue: Slice[] = [];
            const dispatch: { workerId: string; slice: Slice }[] = [];

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
                    resolve(true);
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
        this.logger.debug('done dispatching slices');
    }

    _dispatchSlice(slice: Slice, workerId: string) {
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
        await this.stateStorage.refresh();

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

        const executionStats = this.executionAnalytics.getAnalytics();

        if (!this.isDoneProcessing) {
            // if status is stopping or stopped, only update the execution metadata
            const status = await this.executionStorage.getStatus(this.exId);
            const isStopping = status === 'stopping' || status === 'stopped';
            if (isStopping) {
                this.logger.debug(`execution is set to ${status}, status will not be updated`);

                await this.executionStorage.updatePartial(
                    this.exId,
                    async (existing: Record<string, any>) => {
                        const metaData = this.executionStorage.executionMetaData(executionStats);
                        return Object.assign(existing, metaData, {
                            _updated: makeISODate()
                        });
                    });
                return;
            }

            const errMsg = `execution ${
                this.exId
            } received shutdown before the slicer could complete, setting status to "terminated"`;
            const metaData = this.executionStorage.executionMetaData(executionStats, errMsg);
            this.logger.error(errMsg);
            await this.executionStorage.setStatus(this.exId, 'terminated', metaData);
            return;
        }

        const [errors, started, pending] = await Promise.all([
            this.stateStorage.countByState(this.exId, SliceState.error),
            this.stateStorage.countByState(this.exId, SliceState.start),
            this.stateStorage.countByState(this.exId, SliceState.pending),
        ]);

        if (errors > 0 || started > 0) {
            const errMsg = this._formatExecutionFailure({ errors, started, pending });
            const errorMeta = this.executionStorage.executionMetaData(executionStats, errMsg);
            this.logger.error(errMsg);
            await this.executionStorage.setStatus(this.exId, 'failed', errorMeta);
            return;
        }

        const metaData = this.executionStorage.executionMetaData(executionStats);
        this.logger.info(`execution ${this.exId} has completed`);
        await this.executionStorage.setStatus(this.exId, 'completed', metaData);
    }

    _logFinishedJob() {
        const endTime = Date.now();
        const elapsed = endTime - (this.startTime ?? 0);
        const time = elapsed < 1000 ? 1 : Math.round(elapsed / 1000);

        this.executionAnalytics.set('job_duration', time);

        if (this.collectAnalytics && this.slicerAnalytics) {
            this.slicerAnalytics.analyzeStats();
        }

        this.logger.info(`execution ${this.exId} has finished in ${time} seconds`);
    }

    _formatExecutionFailure(
        { started, errors, pending }: { started: number; errors: number; pending: number }
    ) {
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

        const logWaitingForWorkers = throttle(() => {
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
        const logPendingSlices = throttle(() => {
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

        const logShuttingDown = throttle(() => {
            this.logger.debug('shutdown is waiting for execution to finish...');
        }, 1000);

        const checkExecution = async (): Promise<null> => {
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
                this.logger.debug(`Execution controller state vars at timeout:\nisExecutionDone: ${this.isExecutionDone}\nclient.ready: ${this.client.ready}\n`
                    + `onlineClientCount: ${this.server.onlineClientCount}\nserver.isShuttingDown: ${this.server.isShuttingDown}`
                    + `isShuttingDown: ${this.isShuttingDown}\nisShutdown: ${this.isShutdown}\n`
                    + `isDoneDispatching: ${this.isDoneDispatching}\npendingDispatches: ${this.pendingDispatches}\n`
                    + `scheduler.isFinished: ${this.scheduler.isFinished}\npendingSlices: ${this.pendingSlices}\n`);
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
        let error;

        const terminalStatuses = this.executionStorage.getTerminalStatuses();
        const runningStatuses = this.executionStorage.getRunningStatuses();
        const status = await this.executionStorage.getStatus(this.exId);

        const invalidStateMsg = (state: string) => {
            const prefix = `Execution ${this.exId} was starting in ${state} status`;
            return `${prefix}, sending execution:finished event to cluster master`;
        };

        if (includes(terminalStatuses, status)) {
            error = new Error(invalidStateMsg('terminal'));
        } else if (includes(runningStatuses, status)) {
            // In the case of a running status on startup we
            // want to continue to start up. Only in V2.
            // Right now we will depend on kubernetes `crashloopbackoff` in the case of
            // an unexpected exit to the ex process. Ex: an OOM
            // NOTE: If this becomes an issue we may want to add a new state. Maybe `interrupted`
            if (this.context.sysconfig.teraslice.cluster_manager_type === 'kubernetesV2') {
                // Check to see if `isRelocatable` exists.
                // Allows for older assets to work with k8sV2
                if (this.executionContext.slicer().isRelocatable) {
                    this.logger.info(`Execution ${this.exId} detected to have been restarted..`);
                    const relocatable = this.executionContext.slicer().isRelocatable();
                    if (relocatable) {
                        this.logger.info(`Execution ${this.exId} is relocatable and will continue reinitializing...`);
                    } else {
                        this.logger.error(`Execution ${this.exId} is not relocatable and will shutdown...`);
                    }
                    return relocatable;
                }
            }
            error = new Error(invalidStateMsg('running'));
            // If in a running status the execution process
            // crashed and k8s is trying to restart the pod,
            // e.g. execution controller OOM.
            this.logger.warn(`Changing execution status from ${status} to failed`);
            await this.executionStorage.setStatus(
                this.exId,
                'failed',
                this.executionStorage.executionMetaData(null, getFullErrorStack(error))
            );
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

        const logPaused = throttle((storesStr) => {
            this.logger.warn(`${storesStr} are in a invalid state, scheduler is paused`);
        }, 10 * 1000);

        clearInterval(this.verifyStoresInterval);

        this.verifyStoresInterval = setInterval(() => {
            if (this.isShuttingDown || this.isShutdown) return;

            const invalid: string[] = [];
            try {
                const valid = this.executionStorage.verifyClient();
                if (!valid) {
                    invalid.push('execution');
                }
            } catch (err) {
                clearInterval(this.verifyStoresInterval);
                this._terminalError(err);
                return;
            }

            try {
                const valid = this.stateStorage.verifyClient();
                if (!valid) {
                    invalid.push('state');
                }
            } catch (err) {
                clearInterval(this.verifyStoresInterval);
                this._terminalError(err);
                return;
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
        let errorCount: number;
        let processedCount: number;

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
                    this.sliceFailureInterval = undefined;

                    const setStatusTo = this.scheduler.recovering ? 'recovering' : 'running';

                    this.logger.info(
                        `No slice errors have occurred within execution: ${
                            this.exId
                        } will be set back to '${setStatusTo}' state`
                    );

                    this.executionStorage.setStatus(this.exId, setStatusTo)
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

    /**
     * Adds all prom metrics specific to the execution_controller.
     *
     * If trying to add a new metric for the execution_controller, it belongs here.
     * @async
     * @function setupPromMetrics
     * @return {Promise<void>}
     * @link https://terascope.github.io/teraslice/docs/development/k8s#prometheus-metrics-api
     */
    async setupPromMetrics() {
        if (isPromAvailable(this.context)) {
            this.logger.info(`adding ${this.context.assignment} prom metrics...`);
            const { context, executionAnalytics } = this;
            await Promise.all([
                this.context.apis.foundation.promMetrics.addGauge(
                    'execution_controller_info',
                    'Information about Teraslice execution controller',
                    ['arch', 'clustering_type', 'name', 'node_version', 'platform', 'teraslice_version'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'slices_processed',
                    'Number of slices processed by all workers',
                    [],
                    function collect() {
                        const slicesProcessed = executionAnalytics.get('processed');
                        const defaultLabels = {
                            ...context.apis.foundation.promMetrics.getDefaultLabels()
                        };
                        this.set(defaultLabels, slicesProcessed);
                    }
                )
            ]);

            this.context.apis.foundation.promMetrics.set(
                'execution_controller_info',
                {
                    arch: this.context.arch,
                    clustering_type: this.context.sysconfig.teraslice.cluster_manager_type,
                    name: this.context.sysconfig.teraslice.name,
                    node_version: process.version,
                    platform: this.context.platform,
                    teraslice_version: `v${getPackageJSON().version}`

                },
                1
            );
        }
    }

    requestListener(req: http.IncomingMessage, res: http.ServerResponse) {
        if (req.url === '/health') {
            if (this.server.executionReady) {
                res.writeHead(200);
                res.end('Ready');
            } else {
                res.writeHead(503);
                res.end('Service Unavailable');
            }
        } else {
            res.writeHead(501);
            res.end('Not Implemented');
        }
    }
}
