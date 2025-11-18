/* eslint-disable prefer-const */

import {
    get, getFullErrorStack, isFatalError,
    logError, pWhile, Logger
} from '@terascope/core-utils';
import type { EventEmitter } from 'node:events';
import { ExecutionController, formatURL } from '@terascope/teraslice-messaging';
import { type Context, type WorkerExecutionContext, isPromAvailable } from '@terascope/job-components';
import type { SliceCompletePayload } from '@terascope/types';
import { StateStorage, AnalyticsStorage } from '../../storage/index.js';
import { generateWorkerId, makeLogger } from '../helpers/terafoundation.js';
import { waitForWorkerShutdown } from '../helpers/worker-shutdown.js';
import { Metrics } from '../metrics/index.js';
import { SliceExecution } from './slice.js';
import { getPackageJSON } from '../../utils/file_utils.js';

export class Worker {
    stateStorage: StateStorage;
    analyticsStorage: AnalyticsStorage;
    client: ExecutionController.Client;
    metrics: Metrics | null;
    readonly executionContext: WorkerExecutionContext;
    readonly shutdownTimeout: number;
    readonly context: Context;
    readonly workerId: string;
    private slice!: SliceExecution;
    logger: Logger;
    events: EventEmitter;
    isShuttingDown = false;
    isProcessing = false;
    isInitialized = false;
    shouldShutdown = false;
    forceShutdown = false;
    slicesProcessed = 0;
    isShutdown = false;

    constructor(context: Context, executionContext: WorkerExecutionContext) {
        const workerId = generateWorkerId(context);
        // Use the bunyan logger.level() function to set the log level of context.logger equal
        // to the log level of executionContext.logger.
        // If a log_level was given in the job config, it will have overwritten the default
        // log_level in the execution context.
        context.logger.level(executionContext.logger.level());
        const logger = makeLogger(context, 'worker');
        const events = context.apis.foundation.getSystemEvents();

        const {
            slicer_port: slicerPort,
            slicer_hostname: slicerHostname,
            performance_metrics: performanceMetrics
        } = executionContext.config;

        const config = context.sysconfig.teraslice;
        const networkLatencyBuffer = get(config, 'network_latency_buffer');
        const actionTimeout = get(config, 'action_timeout');
        const workerDisconnectTimeout = get(config, 'worker_disconnect_timeout');
        const slicerTimeout = get(config, 'slicer_timeout');
        const shutdownTimeout = get(config, 'shutdown_timeout');

        this.stateStorage = new StateStorage(context);
        this.analyticsStorage = new AnalyticsStorage(context);

        this.client = new ExecutionController.Client({
            executionControllerUrl: formatURL(slicerHostname, slicerPort),
            workerId,
            networkLatencyBuffer,
            workerDisconnectTimeout,
            // the connect timeout should be set to the same timeout that will
            // cause the execution fail if no Workers connect
            connectTimeout: slicerTimeout,
            actionTimeout,
            logger
        } as any);

        this.metrics = performanceMetrics
            ? new Metrics({
                logger
            })
            : null;

        this.executionContext = executionContext;
        this.shutdownTimeout = shutdownTimeout;
        this.context = context;
        this.workerId = workerId;
        this.logger = logger;
        this.events = events;
    }

    async initialize() {
        if (this.context.sysconfig.teraslice.cluster_manager_type === 'native') {
            this.logger.warn('Skipping PromMetricsAPI initialization: incompatible with native clustering.');
        } else {
            const { terafoundation } = this.context.sysconfig;
            const { config, exId, jobId } = this.executionContext;
            await this.context.apis.foundation.promMetrics.init({
                terasliceName: this.context.sysconfig.teraslice.name,
                assignment: 'worker',
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
                    assignment: 'worker'
                },
                prefix: 'teraslice_job_',
                prom_metrics_display_url: terafoundation.prom_metrics_display_url
            });
            await this.setupPromMetrics();
        }

        const { context } = this;
        this.isInitialized = true;

        await Promise.all([
            this.stateStorage.initialize(),
            this.analyticsStorage.initialize(),
        ]);

        this.slice = new SliceExecution(
            context,
            this.executionContext,
            this.stateStorage,
            this.analyticsStorage
        );

        this.client.onServerShutdown(() => {
            this.logger.warn('Execution Controller shutdown, exiting...');
            this.shouldShutdown = true;
        });

        await this.client.start();

        // initialize the execution context next
        await this.executionContext.initialize();

        if (this.metrics != null) {
            await this.metrics.initialize();
        }

        const { exId } = this.executionContext;
        this.logger.info(`execution: ${exId} initialized worker`);
    }

    async run() {
        let running = false;

        const _run = async () => {
            running = true;

            try {
                await this.runOnce();
            } catch (err) {
                process.exitCode = 1;
                logError(this.logger, err, 'Worker must shutdown due to fatal error');
                this.forceShutdown = true;
            } finally {
                running = false;
            }
        };

        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.forceShutdown) {
                    done();
                    return;
                }

                if (running) return;

                if (this.isShuttingDown || this.shouldShutdown) {
                    done();
                    return;
                }

                _run();
            }, 5);

            function done() {
                clearInterval(interval);
                resolve(true);
            }
        });
    }

    async runOnce() {
        if (this.isShuttingDown || this.forceShutdown || this.shouldShutdown) return;

        this.logger.trace('waiting for new slice from execution controller');
        const msg = await this.client.waitForSlice(() => this.isShuttingDown);

        if (!msg) {
            this.logger.debug(`${this.workerId} worker is idle`);
            return;
        }

        this.isProcessing = true;

        let sentSliceComplete = false;
        const { slice_id: sliceId } = msg;

        try {
            await this.slice.initialize(msg);

            await this.slice.run();

            this.logger.info(`slice ${sliceId} completed`);

            await this._sendSliceComplete({
                slice: this.slice.slice,
                analytics: this.slice.analyticsData
            });

            sentSliceComplete = true;

            await this.executionContext.onSliceFinished();
        } catch (err) {
            logError(this.logger, err, `slice ${sliceId} run error`);

            if (!sentSliceComplete) {
                await this._sendSliceComplete({
                    slice: this.slice.slice,
                    analytics: this.slice.analyticsData,
                    error: getFullErrorStack(err)
                });
            }

            if (isFatalError(err)) {
                throw err;
            }
        }

        this.isProcessing = false;
        this.slicesProcessed += 1;
    }

    async shutdown(event?: string, shutdownError?: Error, block?: boolean) {
        if (this.isShutdown) return;
        if (!this.isInitialized) return;
        const { exId } = this.executionContext;

        if (this.isShuttingDown) {
            const msgs = [
                'worker',
                `shutdown was called for ${exId}`,
                'but it was already shutting down',
                block !== false ? ', will block until done' : ''
            ];
            this.logger.debug(msgs.join(' '));

            if (block !== false) {
                await waitForWorkerShutdown(this.context, 'worker:shutdown:complete');
            }
            return;
        }

        this.client.available = false;
        this.isShuttingDown = true;

        const shutdownErrs: Error[] = [];
        const pushError = (err: Error) => {
            shutdownErrs.push(err);
        };

        const extra = event ? ` due to event: ${event}` : '';
        this.logger.warn(`worker shutdown was called for execution ${exId}${extra}`);

        // set the slice to to failed to avoid
        // flushing the slice at the end
        // we need to check if this.executionContext.sliceState
        // in case a slice isn't currently active
        if (shutdownError && this.executionContext.sliceState) {
            this.executionContext.onSliceFailed();
        }

        // attempt to flush the slice
        // and wait for the slice to finish
        await Promise.all([
            this.slice.flush().catch(pushError),
            this._waitForSliceToFinish().catch(pushError)
        ]);

        this.events.emit('worker:shutdown');
        await this.executionContext.shutdown();

        // make sure ->run() resolves the promise
        this.forceShutdown = true;

        await Promise.all([
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
                            await this.analyticsStorage.shutdown(true);
                        } catch (err) {
                            pushError(err);
                        }
                    })()
                ]);
            })(),
            (async () => {
                await this.slice.shutdown().catch(pushError);
            })(),
            (async () => {
                await this.client.shutdown().catch(pushError);
            })(),
            (async () => {
                if (this.metrics == null) return;
                await this.metrics.shutdown().catch(pushError);
            })()
        ]);

        const n = this.slicesProcessed;
        this.logger.warn(
            `worker ${this.workerId} is shutdown for execution ${exId}, processed ${n} slices`
        );
        this.isShutdown = true;

        if (shutdownErrs.length) {
            const errMsg = shutdownErrs.map((e) => e.stack).join(', and');
            const shutdownErr = new Error(`Failed to shutdown correctly: ${errMsg}`);
            this.events.emit('worker:shutdown:complete', shutdownErr);
            throw shutdownErr;
        }

        // TODO: investigate this this.events.emit(this.context, 'worker:shutdown:complete');

        this.events.emit('worker:shutdown:complete');
    }

    _sendSliceComplete(payload: SliceCompletePayload) {
        return pWhile(async () => {
            try {
                await this.client.sendSliceComplete(payload);
                return true;
            } catch (err) {
                if (this.isShuttingDown) {
                    throw err;
                } else if (err.retryable === false) {
                    this.logger.warn(`${err}, will not retry.`);
                    return true;
                } else {
                    this.logger.warn(err);
                }
            }
            return false;
        });
    }

    _waitForSliceToFinish() {
        if (!this.isProcessing) return Promise.resolve();

        const { logger } = this;
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            let timeout: NodeJS.Timeout | undefined;
            let interval: NodeJS.Timeout | undefined;

            const done = (err?: Error) => {
                clearInterval(interval);
                clearTimeout(timeout);
                if (err) {
                    reject(err);
                    return;
                }
                resolve(true);
            };

            interval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                if (!this.isProcessing) {
                    logger.trace(
                        `is done with current slice, shutdown counter took ${elapsed} seconds`
                    );
                    done();
                    return;
                }

                /* istanbul ignore if */
                if (elapsed % 60 === 0) {
                    logger.info(
                        `shutdown sequence initiated, but is still processing. Will force shutdown in ${elapsed} seconds`
                    );
                }
            }, 100);

            timeout = setTimeout(() => {
                const seconds = this.shutdownTimeout / 1000;
                const err = new Error(
                    `Worker shutdown timeout after ${seconds} seconds, forcing shutdown`
                );
                done(err);
            }, this.shutdownTimeout);
        });
    }

    getSlicesProcessed() {
        return this.slicesProcessed;
    }

    /**
     * Adds all prom metrics specific to the worker.
     *
     * If trying to add a new metric for the worker, it belongs here.
     * @async
     * @function setupPromMetrics
     * @return {Promise<void>}
     * @link https://terascope.github.io/teraslice/docs/development/k8s#prometheus-metrics-api
     */
    async setupPromMetrics() {
        if (isPromAvailable(this.context)) {
            this.logger.info(`adding ${this.context.assignment} prom metrics...`);
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            await Promise.all([
                this.context.apis.foundation.promMetrics.addGauge(
                    'worker_info',
                    'Information about Teraslice worker',
                    ['arch', 'clustering_type', 'name', 'node_version', 'platform', 'teraslice_version'],
                ),
                this.context.apis.foundation.promMetrics.addGauge(
                    'slices_processed',
                    'Number of slices the worker has processed',
                    [],
                    function collect() {
                        const slicesProcessed = self.getSlicesProcessed();
                        const defaultLabels = {
                            ...self.context.apis.foundation.promMetrics.getDefaultLabels()
                        };
                        this.set(defaultLabels, slicesProcessed);
                    }
                )
            ]);

            this.context.apis.foundation.promMetrics.set(
                'worker_info',
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
}
