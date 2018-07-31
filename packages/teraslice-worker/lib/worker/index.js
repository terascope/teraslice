'use strict';

const _ = require('lodash');

const Slice = require('./slice');
const WorkerMessenger = require('./messenger');

const {
    makeStateStore,
    makeAnalyticsStore
} = require('../teraslice');

const { formatURL } = require('../utils');
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

        this.messenger = new WorkerMessenger({
            executionControllerUrl: formatURL(slicerHostname, slicerPort),
            workerId,
            networkLatencyBuffer,
            actionTimeout,
            events,
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
        this.slicesProcessed = 0;

        this._onShutdown = this._onShutdown.bind(this);
    }

    async initialize() {
        const { context } = this;
        this.isInitialized = true;

        const stateStore = makeStateStore(context);
        const analyticsStore = makeAnalyticsStore(context);
        this.stores.stateStore = await stateStore;
        this.stores.analyticsStore = await analyticsStore;

        await this.messenger.start();

        this.events.once('worker:shutdown', this._onShutdown);
    }

    async run() {
        const runForever = async () => {
            if (this.isShuttingDown) return;
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
        const msg = await this.messenger.waitForSlice(() => this.isShuttingDown);

        if (!msg) return;

        this.isProcessing = true;

        try {
            await this.slice.initialize(msg, this.stores);

            await this.slice.run();

            await this.messenger.sliceComplete({
                slice: this.slice.slice,
                analytics: this.slice.analyticsData,
                isShuttingDown: this.isShuttingDown,
            });
        } catch (err) {
            this.logger.error(err);

            await this.messenger.sliceComplete({
                slice: this.slice.slice,
                analytics: this.slice.analyticsData,
                isShuttingDown: this.isShuttingDown,
                error: err.toString(),
            });
        }

        this.isProcessing = false;
        this.slicesProcessed += 1;
    }

    async shutdown() {
        if (!this.isInitialized) return;
        if (this.isShuttingDown) return;

        this.isShuttingDown = true;

        const shutdownErrs = [];

        this.events.removeListener('worker:shutdown', this._onShutdown);
        this.events.emit('worker:shutdown');

        try {
            await this._waitForSliceToFinish();
        } catch (err) {
            shutdownErrs.push(err);
        }

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
            await this.messenger.shutdown();
        } catch (err) {
            shutdownErrs.push(err);
        }

        this.stores = {};

        if (shutdownErrs.length) {
            const errMsg = shutdownErrs.map(e => e.stack).join(', and');
            throw new Error(`Failed to shutdown correctly: ${errMsg}`);
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

    _onShutdown() {
        this.logger.debug('worker:shutdown event received...');
        this.shutdown();
    }
}

module.exports = Worker;
