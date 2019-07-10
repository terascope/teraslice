import { times, isFunction } from '@terascope/utils';
import { SlicerFn, SlicerResult, OpConfig, SlicerRecoveryData } from '../interfaces';
import SlicerCore from './core/slicer-core';

/**
 * A varient of a "Slicer" for running a parallel stream of slicers.
 *
 * See [[SlicerCore]] for more informartion
 */

export default abstract class ParallelSlicer<T = OpConfig> extends SlicerCore<T> {
    protected _slicers: SlicerObj[] = [];

    /**
     * Register the different Slicer instances
     *
     * See [[SlicerCore#initialize]]
     */
    async initialize(recoveryData: SlicerRecoveryData[]): Promise<void> {
        await super.initialize(recoveryData);
        const { slicers = 1 } = this.executionConfig;

        const promises = times(slicers, async id => {
            const fn = await this.newSlicer(id);
            if (!isFunction(fn)) return;

            this._slicers.push({
                done: false,
                fn,
                id,
                processing: false,
                order: 0,
            });
        });

        await Promise.all(promises);
    }

    /**
     * Cleanup the slicers functions
     *
     * See [[SlicerCore#shutdown]]
     */
    async shutdown() {
        this._slicers.length = 0;
        return super.shutdown();
    }

    /**
     * Called by {@link ParallelSlicer#handle} for every count of `slicers` in the ExecutionConfig
     * @returns a function which will be called in parallel
     */
    abstract async newSlicer(id: number): Promise<SlicerFn | undefined>;

    slicers() {
        return this._slicers.length;
    }

    async handle(): Promise<boolean> {
        if (this.isFinished) return true;

        const promises = this._slicers.filter(slicer => !slicer.processing).map(slicer => this.processSlicer(slicer));

        await Promise.race(promises);
        return this.isFinished;
    }

    get isFinished(): boolean {
        return this._slicers.every(slicer => slicer.done);
    }

    private async processSlicer(slicer: SlicerObj) {
        if (slicer.done || slicer.processing) return;

        slicer.processing = true;
        let result: SlicerResult;

        try {
            result = await slicer.fn();
        } finally {
            slicer.processing = false;
        }

        if (result == null && this.canComplete()) {
            this.logger.info(`slicer ${slicer.id} has completed its range`);
            slicer.done = true;

            this.events.emit('slicer:done', slicer.id);
        } else if (result != null) {
            if (Array.isArray(result)) {
                this.events.emit('slicer:subslice');
                result.forEach(item => {
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
    processing: boolean;
    order: number;
}
