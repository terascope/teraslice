'use strict';

const Promise = require('bluebird');
const retry = require('bluebird-retry');
const get = require('lodash/get');
const cloneDeep = require('lodash/cloneDeep');
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

        this._runOnce = this._runOnce.bind(this);
        this._markCompleted = this._markCompleted.bind(this);
        this._markFailed = this._markFailed.bind(this);
        this._logAnalytics = this._logAnalytics.bind(this);
    }

    initialize(slice, stores) {
        const { slice_id: sliceId } = slice;
        const { queue } = this.executionContext;

        if (this.analytics) {
            this.analyticsData = { time: [], size: [], memory: [] };
            this.operations = queue.map(fn => fn.bind(null, this.analyticsData));
        } else {
            this.operations = queue;
        }

        this.stateStore = stores.stateStore;
        this.analyticsStore = stores.analyticsStore;
        this.slice = slice;
        this.metadata = cloneDeep(get(slice, 'request'));
        this.logger = makeLogger(this.context, this.executionContext, 'slice', { slice_id: sliceId });
        this.events.emit('slice:initalize', slice);
    }

    async run() {
        if (this._isShutdown) throw new Error('Slice is already shutdown');

        const { slice, events } = this;
        const maxRetries = get(this.executionContext, 'config.max_retries', 3);
        const retryOptions = {
            max_tries: maxRetries,
            throw_original: true,
            interval: 100,
        };

        await this._checkSlice();
        let result;

        try {
            result = await retry(this._runOnce, retryOptions);
            await this._markCompleted();
        } catch (err) {
            await this._markFailed(err);
            throw err;
        } finally {
            await this._logAnalytics();
            events.emit('slice:finalize', slice);
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
        const {
            stateStore,
            slice,
            events,
            logger
        } = this;

        try {
            await stateStore.updateState(slice, 'completed');
        } catch (_err) {
            throw new Error(prependErrorMsg('Failure to update success state', _err));
        }

        events.emit('slice:success', slice);

        const { ex_id: exId } = this.executionContext;
        logger.trace(`completed slice for execution: ${exId}`, slice);
    }

    async _markFailed(err) {
        const {
            stateStore,
            slice,
            events,
            logger
        } = this;

        const { ex_id: exId } = this.executionContext;
        const errMsg = err ? parseError(err) : new Error('Unknown error occurred');

        try {
            await stateStore.updateState(slice, 'error', errMsg);
        } catch (_err) {
            throw new Error(prependErrorMsg('Failure to update failed state', _err));
        }

        logger.error(err, `slice state for ${exId} has been marked as error`);

        events.emit('slice:failure', slice);

        const sliceError = new Error(prependErrorMsg('Slice failed processing', err, true));
        return Promise.reject(sliceError);
    }

    _runOnce() {
        if (this._isShutdown) {
            throw new retry.StopError('Slice shutdown during slice execution');
        }

        const {
            logger,
            operations,
            events,
            slice,
            metadata,
        } = this;

        const reduceFn = (prev, fn) => Promise.resolve(prev)
            .then(data => fn(data, logger, metadata));

        return Promise.reduce(operations, reduceFn, metadata).catch((err) => {
            const errMsg = parseError(err);
            logger.error(`An error has occurred: ${errMsg}, message: `, slice);
            events.emit('slice:retry', slice);
            return Promise.reject(err);
        });
    }

    async _checkSlice() {
        const { slice_id: sliceId } = this.slice;
        const { ex_id: exId } = this.executionContext;
        const query = `ex_id:${exId} AND slice_id:${sliceId} AND (state:error OR state:completed)`;
        const count = await this.stateStore.count(query, 0);
        if (count > 0) {
            throw new Error(`Slice ${sliceId} has already been processed`);
        }
    }
}

module.exports = Slice;
