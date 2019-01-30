'use strict';

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
    }

    async initialize(slice, stores) {
        const { slice_id: sliceId } = slice;

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
        const maxTries = maxRetries > 0 ? maxRetries + 1 : 0;
        const retryOptions = {
            max_tries: maxTries,
            throw_original: true,
            interval: 100,
            backoff: 2
        };

        let result;
        let remaining = maxTries;
        let sliceSuccess = false;

        try {
            result = await retry(() => {
                remaining -= 1;
                return this._runOnce(remaining > 0);
            }, retryOptions);

            sliceSuccess = true;
            await this._markCompleted();
        } catch (err) {
            // avoid incorrectly marking
            // the slice as failed when it fails
            // to mark it as "complete"
            if (!sliceSuccess) {
                await this._markFailed(err);
            }
            throw err;
        } finally {
            await this._logAnalytics(result && result.analytics);
            await this._onSliceFinalize(slice);
        }

        return result.results;
    }

    async shutdown() {
        this._isShutdown = true;
    }

    async _onSliceFinalize(slice) {
        try {
            this.events.emit('slice:finalize', slice);
            await this.executionContext.onSliceFinalizing(slice.slice_id);
        } catch (err) {
            const errMsg = `Slice: ${slice.slice_id} failure on lifecycle event onSliceFinalizing`;
            this.logger.error(new Error(prependErrorMsg(errMsg, err, true)));
        }
    }

    async _onSliceFailure(slice) {
        try {
            this.events.emit('slice:failure', slice);
            await this.executionContext.onSliceFailed(slice.slice_id);
        } catch (err) {
            const errMsg = `Slice: ${slice.slice_id} failure on lifecycle event onSliceFailed`;
            this.logger.error(new Error(prependErrorMsg(errMsg, err, true)));
        }
    }

    async _logAnalytics(analyticsData) {
        if (analyticsData == null) return;
        this.analyticsData = analyticsData;

        logOpStats(this.logger, this.slice, this.analyticsData);

        try {
            await this.analyticsStore.log(
                this.executionContext,
                this.slice,
                this.analyticsData
            );
        } catch (_err) {
            const error = new Error(prependErrorMsg('Failure to update analytics', _err));
            this.logger.error(error);
        }
    }

    async _markCompleted() {
        const { slice } = this;

        await this.stateStore.updateState(slice, 'completed');

        this.logger.trace(`completed slice for execution: ${this.executionContext.exId}`, slice);
        this.events.emit('slice:success', slice);
    }

    async _markFailed(err) {
        const {
            stateStore,
            slice,
            logger
        } = this;

        const errMsg = err ? parseError(err) : new Error('Unknown error occurred');

        await stateStore.updateState(slice, 'error', errMsg);

        logger.error(err, `slice state for ${this.executionContext.exId} has been marked as error`);

        this._onSliceFailure(slice);

        if (err instanceof retry.StopError) {
            const stopError = new Error(err.message);
            throw stopError;
        }

        const sliceError = new Error(prependErrorMsg('Slice failed processing', err, true));
        sliceError.alreadyLogged = true;
        throw sliceError;
    }

    async _runOnce(shouldRetry) {
        if (this._isShutdown) {
            throw new retry.StopError('Slice shutdown during slice execution');
        }

        try {
            return await this.executionContext.runSlice(this.slice);
        } catch (err) {
            this.logger.error(`An error has occurred: ${toString(err)}, slice:`, this.slice);

            if (shouldRetry) {
                try {
                    // for backwards compatibility
                    this.events.emit('slice:retry', this.slice);
                    await this.executionContext.onSliceRetry(this.slice.slice_id);
                } catch (retryErr) {
                    const error = new retry.StopError(`Slice failed to retry: ${toString(retryErr)}, caused by: ${toString(err)}`);
                    error.fatalError = get(retryErr, 'fatalError', false);
                    throw error;
                }
            }

            throw err;
        }
    }
}

module.exports = Slice;
