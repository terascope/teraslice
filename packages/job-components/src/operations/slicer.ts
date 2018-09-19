import { SlicerCore } from './slicer-core';

export type SlicerResult = object | object[] | null;

/**
 * Slicer Base Class [DRAFT]
 * @description A core operation for slicing large sets of data
 *              that will be pushed to the workers for processing.
 *              The slicer is not used within the same context of the other operations
 *              The "Slicer" is a part of the "Reader" component of a job.
 */

export class Slicer extends SlicerCore {
    async slice(slicerId: number): Promise<SlicerResult> {
        this.logger.debug(`slicerId ${slicerId}`);
        throw new Error('Slicer must implement a "slice" method');
    }
}
