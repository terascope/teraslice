'use strict';

const _ = require('lodash');
const { ExecutionController, formatURL } = require('@terascope/teraslice-messaging');
const {
    makeStateStore,
    makeAnalyticsStore
} = require('../teraslice/stores');
const Slice = require('./slice');
const { waitForWorkerShutdown } = require('../utils');
const { generateWorkerId, makeLogger } = require('../utils/context');

class Worker {
    constructor(context, executionContext) {
        const workerId = generateWorkerId(context);
        const logger = makeLogger(context, executionContext, 'worker');
        const events = context.apis.foundation.getSystemEvents();

        const {
            slicer_port: slicerPort,
            slicer_hostname: slicerHostname
        } = executionContext;

        const networkLatencyBuffer = _.get(context, 'sysconfig.teraslice.network_latency_buffer');
        const actionTimeout = _.get(context, 'sysconfig.teraslice.action_timeout');
        const shutdownTimeout = _.get(context, 'sysconfig.teraslice.shutdown_timeout');

        this.client = new ExecutionController.Client({
            executionControllerUrl: formatURL(slicerHostname, slicerPort),
            workerId,
            networkLatencyBuffer,
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
        this.shouldShutdown = false;
        this.isProcessing = false;
        this.isInitialized = false;
        this.slicesProcessed = 0;
    }

    async initialize() {
        const { context } = this;
        this.isInitialized = true;
        const { ex_id: exId } = this.executionContext;

        const stateStore = makeStateStore(context);
        const analyticsStore = makeAnalyticsStore(context);
        this.stores.stateStore = await stateStore;
        this.stores.analyticsStore = await analyticsStore;

        await this.client.start();

        this.client.onExecutionFinished(() => {
            this.logger.warn(`exId ${exId} recieved a execution finished event`);
            this.shouldShutdown = true;
        });
    }

    async run() {
        const runForever = async () => {
            if (this.isShuttingDown) return;
            if (this.shouldShutdown) return;

            try {
                await this.runOnce();
            } catch (err) {
                /* istanbul ignore next */
                this.logger.warn('Slice failed but worker is not done processing');
            }
            await runForever();
        };

        await runForever();
    }

    async runOnce() {
        const msg = await this.client.waitForSlice(() => this.isShuttingDown);

        if (!msg) return;

        this.isProcessing = true;

        const { ex_id: exId } = this.executionContext;

        try {
            await this.slice.initialize(msg, this.stores);

            await this.slice.run();

            this.logger.info(`slice complete for execution ${exId}`);

            await this.client.sendSliceComplete({
                slice: this.slice.slice,
                analytics: this.slice.analyticsData,
            });
        } catch (err) {
            this.logger.error(`slice run error for execution ${exId}`, err);

            await this.client.sendSliceComplete({
                slice: this.slice.slice,
                analytics: this.slice.analyticsData,
                error: err.toString(),
            });
        }

        this.isProcessing = false;
        this.slicesProcessed += 1;
    }

    async shutdown() {
        if (this.isShutdown) return;
        if (!this.isInitialized) return;
        if (this.isShuttingDown) {
            this.logger.debug('worker shutdown was called but it was already shutting down, will block until done');
            await waitForWorkerShutdown(this.context, 'worker:shutdown:complete');
            return;
        }

        const { ex_id: exId } = this.executionContext;

        this.isShuttingDown = true;

        const shutdownErrs = [];

        this.logger.warn(`worker shutdown was called for execution ${exId}`);

        try {
            await this._waitForExecutionFinished();
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await this._waitForSliceToFinish();
        } catch (err) {
            shutdownErrs.push(err);
        }

        this.events.emit('worker:shutdown');

        try {
            await Promise.map(_.values(this.stores), (store) => {
                // attempt to shutdown but if it takes longer than shutdown_timeout, cleanup
                const forceShutdown = true;
                return store.shutdown(forceShutdown);
            });
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await this.slice.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

        try {
            await this.client.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

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

    async _waitForExecutionFinished() {
        if (this.shouldShutdown) return;
        if (!this.client.isClientReady) return;

        const { ex_id: exId } = this.executionContext;

        this.logger.info(`Worker ${this.workerId} for execution ${exId} will wait for exection:finished event from the execution controller`);

        const timeout = this.client.getTimeoutWithMax(30000);
        const finished = await this.client.onceWithTimeout('execution:finished', timeout);
        if (finished == null) {
            this.logger.warn(`Worker ${this.workerId} for execution ${exId} expected to receive an execution:finished message when shutting down`);
        } else {
            this.logger.debug(`Worker ${this.workerId} for execution ${exId} receive an execution:finished message when shutting down`);
        }
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
