'use strict';

const { TSError, getTypeOf, logError } = require('@terascope/utils');
const { SliceState } = require('../../storage');
const { makeLogger } = require('../helpers/terafoundation');
const { logOpStats } = require('../helpers/op-analytics');

class Slice {
    constructor(context, executionContext) {
        this.context = context;
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
    }

    async initialize(slice) {
        const { slice_id: sliceId } = slice;

        if (slice.state !== SliceState.pending) {
            await this.stateStore.updateState(slice, SliceState.start);
        }

        this.slice = slice;
        this.logger = makeLogger(this.context, 'slice', {
            slice_id: sliceId
        });

        await this.executionContext.initializeSlice(slice);
    }

    async run() {
        if (this._isShutdown) throw new Error('Slice is already shutdown');

        const { slice } = this;

        let result;
        let sliceSuccess = false;

        try {
            result = await this.executionContext.runSlice();
            sliceSuccess = true;
            await this._markCompleted();
        } catch (_err) {
            const err = _err || new Error(`Unknown slice error, got ${getTypeOf(_err)} error`);
            // avoid incorrectly marking
            // the slice as failed when it fails
            // to mark it as "complete"
            if (!sliceSuccess) {
                await this._markFailed(err);
            }
            throw err;
        } finally {
            if (result) await this._logAnalytics(result.analytics, result.status);
            await this._onSliceFinalize(slice);
        }

        return result.results;
    }

    async flush() {
        const result = await this.executionContext.flush();

        if (result) {
            await this._markCompleted();
            await this._logAnalytics(result.analytics, result.status);
            await this._onSliceFinalize(this.slice);
        }
    }

    async shutdown() {
        this._isShutdown = true;
    }

    async _onSliceFinalize(slice) {
        try {
            await this.executionContext.onSliceFinalizing();
        } catch (err) {
            this.logger.error(
                new TSError(err, {
                    reason: `Slice: ${slice.slice_id} failure on lifecycle event onSliceFinalizing`
                })
            );
        }
    }

    async _onSliceFailure(slice) {
        try {
            await this.executionContext.onSliceFailed();
        } catch (err) {
            this.logger.error(
                new TSError(err, {
                    reason: `Slice: ${slice.slice_id} failure on lifecycle event onSliceFailed`
                })
            );
        }
    }

    async _logAnalytics(analyticsData, state) {
        if (analyticsData == null) return;
        this.analyticsData = analyticsData;

        logOpStats(this.logger, this.slice, this.analyticsData);

        try {
            await this.analyticsStore.log(
                this.executionContext,
                this.slice,
                this.analyticsData,
                state
            );
        } catch (_err) {
            this.logger.error(
                new TSError(_err, {
                    reason: 'Failure to update analytics'
                })
            );
        }
    }

    async _markCompleted() {
        const { slice } = this;

        await this.stateStore.updateState(slice, SliceState.completed);

        this.logger.trace(`completed slice for execution: ${this.executionContext.exId}`, slice);
        this.events.emit('slice:success', slice);
    }

    async _markFailed(err) {
        const { stateStore, slice } = this;

        await stateStore.updateState(slice, SliceState.error, err);

        logError(this.logger, err, `slice state for ${this.executionContext.exId} has been marked as error`);

        await this._onSliceFailure(slice);

        throw new TSError(err, {
            reason: 'Slice failed processing'
        });
    }
}

module.exports = Slice;
