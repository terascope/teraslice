import _ from 'lodash';
import { Context, OpConfig, ExecutionConfig } from '@terascope/teraslice-types';
import SlicerCore, { SlicerResult } from './core/slicer-core';

/**
 * A varient of a "Slicer" for running a parallel stream of slicers.
 * @see SlicerCore
 */

export default abstract class ParallelSlicer extends SlicerCore {
    protected _slicers: SlicerObj[] = [];

    /**
     * Register the different Slicer instances
     * @see SlicerCore#initialize
    */
    async initialize(recoveryData: object[]): Promise<void> {
        await super.initialize(recoveryData);
        const { slicers } = this.executionConfig;

        const promises = _.times(slicers, async (id) => {
            const fn = await this.newSlicer();
            this._slicers.push({
                done: false,
                fn,
                id,
                order: 0,
            });
        });

        await Promise.all(promises);
    }

    /**
     * Cleanup the slicers functions
     * @see SlicerCore#shutdown
    */
    async shutdown() {
        this._slicers.length = 0;
        return super.shutdown();
    }

    /**
     * Called by {@link ParallelSlicer#handle} for every count of `slicers` in the ExecutionConfig
     * @returns a function which will be called in parallel
    */
    abstract async newSlicer(): Promise<SlicerFn>;

    async handle(): Promise<boolean> {
        if (this.isFinished) return true;

        const promises = _.map(this._slicers, (slicer) => this.processSlicer(slicer));

        await Promise.all(promises);
        return this.isFinished;
    }

    get isFinished(): boolean {
        return _.every(this._slicers, { done: true });
    }

    private async processSlicer(slicer: SlicerObj) {
        if (slicer.done) return;

        const result = await slicer.fn();
        if (result == null) {
            slicer.done = true;
        } else {
            if (_.isArray(result)) {
                this.events.emit('slicer:subslice');
                _.each(result, (item) => {
                    slicer.order += 1;
                    this.createSlice(item, slicer.order, slicer.id);
                });
            } else {
                slicer.order += 1;
                this.createSlice(result, slicer.order, slicer.id);
            }
        }
    }
}

interface SlicerObj {
    done: boolean;
    fn: SlicerFn;
    id: number;
    order: number;
}

export interface SlicerFn {
    (): Promise<SlicerResult>;
}

export type ParallelSlicerConstructor = {
    isRecoverable: boolean;
    new(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig): ParallelSlicer;
};
