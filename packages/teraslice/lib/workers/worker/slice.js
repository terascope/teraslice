'use strict';

const Promise = require('bluebird');
const retry = require('bluebird-retry');
const get = require('lodash/get');
const toString = require('lodash/toString');
const parseError = require('@terascope/error-parser');
const { makeLogger } = require('../helpers/terafoundation');
const { logOpStats } = require('../helpers/op-analytics');
const { prependErrorMsg } = require('../../utils/error_utils');

class Slice {
    constructor(context, executionContext) {
        this.context = context;
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
        this.analytics = get(executionContext, 'config.analytics', false);
    }

    async initialize(slice, stores) {
        const { slice_id: sliceId } = slice;

        // if (this.analytics) {
        //   this.analyticsData = { time: [], size: [], memory: [] };
        //   this.operations = queue.map(fn => fn.bind(null, this.analyticsData));
        // }

        this.stateStore = stores.stateStore;
        this.analyticsStore = stores.analyticsStore;
        this.slice = slice;
        this.logger = makeLogger(this.context, this.executionContext, 'slice', { slice_id: sliceId });

        this.events.emit('slice:initialize', slice);
        await this.executionContext.onSliceInitialized(sliceId);
    }

    async run() {
        if (this._isShutdown) throw new Error('Slice is already shutdown');

        const { slice } = this;
        const maxRetries = get(this.executionContext, 'config.max_retries', 3);
        const retryOptions = {
            max_tries: maxRetries,
            throw_original: true,
            interval: 100,
        };

        let result;

        try {
            result = await retry(() => this._runOnce(), retryOptions);
            await this._markCompleted();
        } catch (err) {
            await this._markFailed(err);
            throw err;
        } finally {
            await this._logAnalytics();
            this.events.emit('slice:finalize', slice);
            await this.executionContext.onSliceFinalizing(slice.slice_id);
        }

        return result;
    }

    async shutdown() {
        this._isShutdown = true;
    }

    async _logAnalytics() {
        if (!this.analytics) return;

        const {
            logger,
            analyticsData,
            slice,
            executionContext
        } = this;

        logOpStats(logger, slice, analyticsData);

        try {
            await this.analyticsStore.log(executionContext, slice, analyticsData);
        } catch (_err) {
            throw new Error('Failure to update analytics, caused by ', _err);
        }
    }

    async _markCompleted() {
        const { slice } = this;

        try {
            await this.stateStore.updateState(slice, 'completed');
        } catch (_err) {
            throw new Error(prependErrorMsg('Failure to update success state', _err));
        }

        this.events.emit('slice:success', slice);

        this.logger.trace(`completed slice for execution: ${this.executionContext.exId}`, slice);
    }

    async _markFailed(err) {
        const {
            stateStore,
            slice,
            logger
        } = this;

        const errMsg = err ? parseError(err) : new Error('Unknown error occurred');

        try {
            await stateStore.updateState(slice, 'error', errMsg);
        } catch (_err) {
            throw new Error(prependErrorMsg('Failure to update failed state', _err));
        }

        logger.error(err, `slice state for ${this.executionContext.exId} has been marked as error`);

        this.events.emit('slice:failure', slice);
        await this.executionContext.onSliceFailed(slice.slice_id);

        const sliceError = new Error(prependErrorMsg('Slice failed processing', err, true));
        sliceError.alreadyLogged = true;
        return Promise.reject(sliceError);
    }

    _runOnce() {
        if (this._isShutdown) {
            throw new retry.StopError('Slice shutdown during slice execution');
        }
        const { slice } = this;

        return this.executionContext.runSlice(slice)
            .catch((err) => {
                this.logger.error(`An error has occurred: ${toString(err)}, slice:`, slice);

                // for backwards compatibility
                this.events.emit('slice:retry', slice);
                return this.executionContext
                    .onSliceRetry(this.slice.slice_id)
                    .then(() => Promise.reject(err))
                    .catch(() => Promise.reject(err));
            });
    }
}

module.exports = Slice;
