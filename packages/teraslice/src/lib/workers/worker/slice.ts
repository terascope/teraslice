import events from 'node:events';
import {
    TSError, getTypeOf, logError,
    Logger
} from '@terascope/core-utils';
import {
    Context, Slice, WorkerExecutionContext,
    RunSliceResult
} from '@terascope/job-components';
import { SliceAnalyticsData } from '@terascope/types';
import { SliceState, StateStorage, AnalyticsStorage } from '../../storage/index.js';
import { makeLogger } from '../helpers/terafoundation.js';
import { logOpStats } from '../helpers/op-analytics.js';

export class SliceExecution {
    private context: Context;
    readonly executionContext: WorkerExecutionContext;
    readonly stateStorage: StateStorage;
    readonly analyticsStorage: AnalyticsStorage;
    events: events.EventEmitter;
    private logger!: Logger;
    private isShutdown!: boolean;
    slice!: Slice;
    analyticsData!: SliceAnalyticsData;

    constructor(
        context: Context,
        executionContext: WorkerExecutionContext,
        stateStorage: StateStorage,
        analyticsStorage: AnalyticsStorage
    ) {
        this.context = context;
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
        this.stateStorage = stateStorage;
        this.analyticsStorage = analyticsStorage;
    }

    async initialize(slice: Slice) {
        const { slice_id: sliceId } = slice;

        await this.stateStorage.updateState(slice, SliceState.start);

        this.slice = slice;
        this.logger = makeLogger(this.context, 'slice', {
            slice_id: sliceId
        });

        await this.executionContext.initializeSlice(slice);
    }

    async run() {
        if (this.isShutdown) throw new Error('Slice is already shutdown');

        const { slice } = this;

        let result: RunSliceResult | undefined;
        let sliceSuccess = false;

        try {
            result = await this.executionContext.runSlice();

            sliceSuccess = true;
            await this._markCompleted();
        } catch (err) {
            const error = err || new Error(`Unknown slice error, got ${getTypeOf(err)} error`);
            // avoid incorrectly marking
            // the slice as failed when it fails
            // to mark it as "complete"
            if (!sliceSuccess) {
                await this._markFailed(error);
            }
            throw error;
        } finally {
            if (result) {
                await this._logAnalytics(result);
            }
            await this._onSliceFinalize(slice);
        }

        return result.results;
    }

    async flush() {
        const result = await this.executionContext.flush();

        if (result) {
            await this._markCompleted();
            await this._logAnalytics(result);
            await this._onSliceFinalize(this.slice);
        }
    }

    async shutdown() {
        this.isShutdown = true;
    }

    async _onSliceFinalize(slice: any) {
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

    async _onSliceFailure(slice: Slice) {
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

    async _logAnalytics(sliceResult: RunSliceResult) {
        const { analytics, status } = sliceResult;

        if (analytics == null) return;
        this.analyticsData = analytics;

        logOpStats(this.logger, this.slice, this.analyticsData);

        try {
            await this.analyticsStorage.log(
                this.executionContext,
                this.slice,
                this.analyticsData,
                status
            );
        } catch (_err) {
            this.logger.error(
                new TSError(_err, {
                    reason: 'Failure to update analytics'
                })
            );
        }
    }

    private async _markCompleted() {
        const { slice } = this;

        await this.stateStorage.updateState(slice, SliceState.completed);

        this.logger.trace(`completed slice for execution: ${this.executionContext.exId}`, slice);
        this.events.emit('slice:success', slice);
    }

    private async _markFailed(err: Error) {
        const { stateStorage, slice } = this;

        await stateStorage.updateState(slice, SliceState.error, err);

        logError(this.logger, err, `slice state for ${this.executionContext.exId} has been marked as error`);

        await this._onSliceFailure(slice);

        throw new TSError(err, {
            reason: 'Slice failed processing'
        });
    }
}
