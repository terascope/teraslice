'use strict';

const {
    get,
    getFullErrorStack,
    isFatalError,
    logError,
    pWhile
} = require('@terascope/utils');
const { ExecutionController, formatURL } = require('@terascope/teraslice-messaging');
const { makeStateStore, makeAnalyticsStore } = require('../../storage');
const { generateWorkerId, makeLogger } = require('../helpers/terafoundation');
const { waitForWorkerShutdown } = require('../helpers/worker-shutdown');
const Metrics = require('../metrics');
const Slice = require('./slice');

class Worker {
    constructor(context, executionContext) {
        const workerId = generateWorkerId(context);
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
        });

        this.slice = new Slice(context, executionContext);

        this.metrics = performanceMetrics
            ? new Metrics({
                logger
            })
            : null;

        this.stores = {};
        this.executionContext = executionContext;
        this.shutdownTimeout = shutdownTimeout;
        this.context = context;
        this.workerId = workerId;
        this.logger = logger;
        this.events = events;

        this.isShuttingDown = false;
        this.isProcessing = false;
        this.isInitialized = false;
        this.shouldShutdown = false;
        this.forceShutdown = false;
        this.slicesProcessed = 0;
    }

    async initialize() {
        const { context } = this;
        this.isInitialized = true;

        const [stateStore, analyticsStore] = await Promise.all([
            makeStateStore(context),
            makeAnalyticsStore(context),
        ]);

        this.stores.stateStore = stateStore;
        this.slice.stateStore = stateStore;
        this.stores.analyticsStore = analyticsStore;
        this.slice.analyticsStore = analyticsStore;

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
                resolve();
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

            await this.executionContext.onSliceFinished(sliceId);
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

    async shutdown(block = true, event, shutdownError) {
        if (this.isShutdown) return;
        if (!this.isInitialized) return;
        const { exId } = this.executionContext;

        if (this.isShuttingDown) {
            const msgs = [
                'worker',
                `shutdown was called for ${exId}`,
                'but it was already shutting down',
                block ? ', will block until done' : ''
            ];
            this.logger.debug(msgs.join(' '));

            if (block) {
                await waitForWorkerShutdown(this.context, 'worker:shutdown:complete');
            }
            return;
        }

        this.client.available = false;
        this.isShuttingDown = true;

        const shutdownErrs = [];
        const pushError = (err) => {
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
                const stores = Object.values(this.stores);
                await Promise.all(stores.map((store) => store.shutdown(true).catch(pushError)));
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
            this.events.emit(this.context, 'worker:shutdown:complete', shutdownErr);
            throw shutdownErr;
        }

        this.events.emit(this.context, 'worker:shutdown:complete');
    }

    _sendSliceComplete(payload) {
        return pWhile(async () => {
            try {
                await this.client.sendSliceComplete(payload);
                return true;
            } catch (err) {
                if (this.isShuttingDown) {
                    throw err;
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
            let timeout;
            let interval;
            const done = (err) => {
                clearInterval(interval);
                clearTimeout(timeout);
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
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
}

module.exports = Worker;
