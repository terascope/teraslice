import _ from 'lodash';
import { SlicerCore, SlicerResult } from './core/slicer-core';

/**
 * Slicer [DRAFT]
 * @description The simpilest form of a "Slicer" for building non-parallel stream of slices.
 *              The "Slicer" is a part of the "Reader" component of a job.
 */

export abstract class Slicer extends SlicerCore {
    /**
     * @private
    */
    protected order = 0;

    abstract async slice(): Promise<SlicerResult>;

    /**
     * @description this is called by the Teraslice framework
     * @returns a boolean depending on whether the slicer is done
    */
    async handle(): Promise<boolean> {
        const result = await this.slice();
        if (result == null) {
            return true;
        }

        if (_.isArray(result)) {
            this.events.emit('execution:subslice');
            await Promise.all(_.map(result, async (item) => {
                this.order += 1;
                this.enqueue(item, this.order);
            }));
        } else {
            this.order += 1;
            this.enqueue(result, this.order);
        }

        return false;
    }
}

export { SlicerResult };
