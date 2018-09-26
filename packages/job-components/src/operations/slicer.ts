import _ from 'lodash';
import { Context, OpConfig, ExecutionConfig } from '@terascope/teraslice-types';
import SlicerCore, { SlicerResult } from './core/slicer-core';

/**
 * The simpliest form a "Slicer"
 * @see SlicerCore
 */

export default abstract class Slicer extends SlicerCore {
    /**
     * @private
    */
    protected order = 0;

    isFinished = false;

    /**
     * A method called by {@link Slicer#handle}
     * @returns a Slice, or SliceRequest
    */
    abstract async slice(): Promise<SlicerResult>;

    async handle(): Promise<boolean> {
        if (this.isFinished) return true;

        const result = await this.slice();
        if (result == null) {
            this.isFinished = true;
            return true;
        }

        if (_.isArray(result)) {
            this.events.emit('execution:subslice');
            _.each(result, (item) => {
                this.order += 1;
                this.createSlice(item, this.order);
            });
        } else {
            this.order += 1;
            this.createSlice(result, this.order);
        }

        return false;
    }
}

export { SlicerResult };

export type SlicerConstructor = {
    isRecoverable: boolean;
    new(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig): Slicer;
};
