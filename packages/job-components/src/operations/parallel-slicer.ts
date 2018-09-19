import _ from 'lodash';
import { SlicerCore, SlicerResult } from './core/slicer-core';

/**
 * ParallelSlicer [DRAFT]
 * @description A more complex form of a "Slicer" for building a parallel stream of slicers.
 *              The "Slicer" is a part of the "Reader" component of a job.
 */

export abstract class ParallelSlicer extends SlicerCore {
    protected _slicers: SlicerObj[] = [];

    async initialize(recoveryData: object[]): Promise<void> {
        await super.initialize(recoveryData);
        const { slicers } = this.executionConfig;

        const promises = _.times(slicers, async () => {
            const fn = await this.newSlicer();
            const slicer = {
                fn,
                done: false,
                order: 0,
            };

            this._slicers.push(slicer);
        });

        await Promise.all(promises);
    }

    /**
     * @description this is called for every count of `slicers` in the ExecutionConfig
     * @returns a function which will be called in parallel
    */
    abstract async newSlicer(): Promise<SlicerFn>;

    /**
     * @description this is called by the Teraslice framework
     * @returns a boolean depending on whether the slicer is done
    */
    async handle(): Promise<boolean> {
        if (this.isFinished) return true;

        const promises = _.map(this._slicers, async (slicer, id) => {
            if (slicer.done) return;

            const result = await slicer.fn();
            if (result == null) {
                slicer.done = true;
            } else {
                if (_.isArray(result)) {
                    this.events.emit('execution:subslice');
                    await Promise.all(_.map(result, async (item) => {
                        slicer.order += 1;
                        this.enqueue(item, slicer.order, id);
                    }));
                } else {
                    slicer.order += 1;
                    this.enqueue(result, slicer.order);
                }
            }
        });

        await Promise.all(promises);
        return this.isFinished;
    }

    get isFinished(): boolean {
        return _.every(this._slicers, { done: true });
    }
}

interface SlicerObj {
    done: boolean;
    fn: SlicerFn;
    order: number;
}

export interface SlicerFn {
    (): Promise<SlicerResult>;
}
