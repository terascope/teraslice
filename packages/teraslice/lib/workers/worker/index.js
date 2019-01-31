'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const { isFatalError } = require('@terascope/job-components');
const { ExecutionController, formatURL } = require('@terascope/teraslice-messaging');
const {
    makeStateStore,
    makeAnalyticsStore
} = require('../../cluster/storage');
const Slice = require('./slice');
const { waitForWorkerShutdown } = require('../helpers/worker-shutdown');
const { generateWorkerId, makeLogger } = require('../helpers/terafoundation');

class Worker {
    constructor(context, executionContext) {
        const workerId = generateWorkerId(context);
        const logger = makeLogger(context, executionContext, 'worker');
        const events = context.apis.foundation.getSystemEvents();

        const {
            slicer_port: slicerPort,
            slicer_hostname: slicerHostname
        } = executionContext.config;

        const networkLatencyBuffer = _.get(context, 'sysconfig.teraslice.network_latency_buffer');
        const actionTimeout = _.get(context, 'sysconfig.teraslice.action_timeout');
        const workerDisconnectTimeout = _.get(context, 'sysconfig.teraslice.worker_disconnect_timeout');
        const shutdownTimeout = _.get(context, 'sysconfig.teraslice.shutdown_timeout');

        this.client = new ExecutionController.Client({
            executionControllerUrl: formatURL(slicerHostname, slicerPort),
            workerId,
            networkLatencyBuffer,
            connectTimeout: workerDisconnectTimeout,
            actionTimeout,
        });

        this.slice = new Slice(context, executionContext);

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

        await this.executionContext.initialize();

        const stateStore = makeStateStore(context);
        const analyticsStore = makeAnalyticsStore(context);
        this.stores.stateStore = await stateStore;
        this.stores.analyticsStore = await analyticsStore;

        this.client.onServerShutdown(() => {
            this.logger.warn('Execution Controller shutdown, exiting...');
            this.shouldShutdown = true;
        });

        await this.client.start();
    }

    async run() {
        let running = false;

        const _run = async () => {
            running = true;
            try {
                await this.runOnce();
            } catch (err) {
                this.logger.fatal(err, 'Worker must shutdown to Fatal Error');
                this.shutdown(false);
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
        this.logger.trace('waiting for new slice from execution controller');
        const msg = await this.client.waitForSlice(() => this.isShuttingDown);

        if (!msg) {
            this.logger.debug(`${this.workerId} worker is idle`);
            return;
        }

        this.isProcessing = true;

        const { exId } = this.executionContext;

        try {
            await this.slice.initialize(msg, this.stores);

            await this.slice.run();

            const { slice_id: sliceId } = this.slice.slice;
            this.logger.info(`slice complete for execution ${exId}`);

            await this.client.sendSliceComplete({
                slice: this.slice.slice,
                analytics: this.slice.analyticsData,
            });

            await this.executionContext.onSliceFinished(sliceId);
        } catch (err) {
            this.logger.error(err, `slice run error for execution ${exId}`);

            if (isFatalError(err)) {
                throw err;
            }

            await this.client.sendSliceComplete({
                slice: this.slice.slice,
                analytics: this.slice.analyticsData,
                error: err.toString(),
            });
        }

        this.isProcessing = false;
        this.slicesProcessed += 1;
    }

    async shutdown(block = true) {
        if (this.isShutdown) return;
        if (!this.isInitialized) return;
        if (this.isShuttingDown) {
            this.logger.debug(`worker shutdown was called but it was already shutting down ${block ? ', will block until done' : ''}`);
            if (block) {
                await waitForWorkerShutdown(this.context, 'worker:shutdown:complete');
            }
            return;
        }

        const { exId } = this.executionContext;

        this.isShuttingDown = true;

        const shutdownErrs = [];
        const pushError = (err) => {
            shutdownErrs.push(err);
        };

        this.logger.warn(`worker shutdown was called for execution ${exId}`);

        try {
            await this._waitForSliceToFinish();
        } catch (err) {
            shutdownErrs.push(err);
        }

        this.events.emit('worker:shutdown');
        await this.executionContext.shutdown();

        // make sure ->run() resolves the promise
        this.forceShutdown = true;

        await Promise.all([
            (async () => {
                const stores = Object.values(this.stores);
                await Promise.map(stores, store => store.shutdown(true)
                    .catch(pushError));
            })(),
            (async () => {
                await this.slice.shutdown().catch(pushError);
            })(),
            (async () => {
                await this.client.shutdown().catch(pushError);
            })()
        ]);

        this.logger.warn(`worker ${this.workerId} is shutdown for execution ${exId}, processed ${this.slicesProcessed} slices`);
        this.isShutdown = true;

        if (shutdownErrs.length) {
            const errMsg = shutdownErrs.map(e => e.stack).join(', and');
            const shutdownErr = new Error(`Failed to shutdown correctly: ${errMsg}`);
            this.events.emit(this.context, 'worker:shutdown:complete', shutdownErr);
            throw shutdownErr;
        }

        this.events.emit(this.context, 'worker:shutdown:complete');
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
                    logger.trace(`is done with current slice, shutdown counter took ${elapsed} seconds`);
                    done();
                    return;
                }

                /* istanbul ignore if */
                if (elapsed % 60 === 0) {
                    logger.info(`shutdown sequence initiated, but is still processing. Will force shutdown in ${elapsed} seconds`);
                }
            }, 100);

            timeout = setTimeout(() => {
                const err = new Error(`Worker shutdown timeout after ${this.shutdownTimeout / 1000} seconds, forcing shutdown`);
                done(err);
            }, this.shutdownTimeout);
        });
    }
}

module.exports = Worker;
