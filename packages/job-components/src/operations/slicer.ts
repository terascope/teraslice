import { SlicerCore, SlicerResult } from './core/slicer-core';

/**
 * Slicer [DRAFT]
 * @description A core operation for slicing large sets of data
 *              that will be pushed to the workers for processing.
 *              The slicer is not used within the same context of the other operations
 *              The "Slicer" is a part of the "Reader" component of a job.
 */

export abstract class Slicer extends SlicerCore {
    abstract async slice(): Promise<SlicerResult>;

    // this method is called by the teraslice framework and should not be overwritten
    async handle(slicerId: number): Promise<SlicerResult[]> {
        this.logger.trace(`slicer is being called with slicerId ${slicerId}`);
        const result = await this.slice();
        return [result];
    }
}

export { SlicerResult };
