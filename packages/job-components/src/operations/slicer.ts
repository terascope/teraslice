import _ from 'lodash';
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

    /**
     * A method called by {@link Slicer#handle}
     * @returns a Slice, or SliceRequest
    */
    abstract async slice(): Promise<SlicerResult>;

    async handle(): Promise<boolean> {
        const result = await this.slice();
        if (result == null) {
            return true;
        }

        if (_.isArray(result)) {
            this.events.emit('execution:subslice');
            _.map(result, (item) => {
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
