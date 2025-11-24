import { times, isFunction, pDelay } from '@terascope/core-utils';
import {
    SlicerFn, SlicerResult, OpConfig, SlicerRecoveryData
} from '../interfaces/index.js';
import SlicerCore from './core/slicer-core.js';

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

        const promises = times(slicers, async (id) => {
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
    async shutdown(): Promise<void> {
        this._slicers.length = 0;
        return super.shutdown();
    }

    /**
     * Called by {@link ParallelSlicer#handle} for every count of `slicers` in the ExecutionConfig
     * @returns a function which will be called in parallel
     */
    abstract newSlicer(id: number): Promise<SlicerFn | undefined>;

    slicers(): number {
        return this._slicers.length;
    }

    async handle(): Promise<boolean> {
        if (this.isFinished) return true;

        // must filter out done slicers, if they are done
        // they will return undefined which will always win race
        // which will prevent other from calling
        const slicers = this._slicers
            .filter((slicer) => !slicer.processing && !slicer.done);

        // calling race on an empty array will be forever pending
        if (slicers.length > 0) {
            await Promise.race(slicers.map((slicer) => this.processSlicer(slicer)));
        } else {
            // promises are a microtask, if no action then we need to delay
            await pDelay(10);
        }

        return this.isFinished;
    }

    get isFinished(): boolean {
        return this._slicers.every((slicer) => slicer.done);
    }

    private async processSlicer(slicer: SlicerObj) {
        slicer.processing = true;
        let result: SlicerResult;

        try {
            result = await slicer.fn();
        } catch (err) {
            slicer.processing = false;
            throw err;
        }

        try {
            if (result == null && this.canComplete()) {
                this.logger.info(`slicer ${slicer.id} has completed its range`);
                slicer.done = true;
                this.events.emit('slicer:done', slicer.id);
            } else if (result != null) {
                if (Array.isArray(result)) {
                    this.events.emit('slicer:subslice');
                    result.forEach((item) => {
                        slicer.order += 1;
                        this.createSlice(item, slicer.order, slicer.id);
                    });
                } else {
                    slicer.order += 1;
                    this.createSlice(result, slicer.order, slicer.id);
                }
            }
        } finally {
            slicer.processing = false;
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
