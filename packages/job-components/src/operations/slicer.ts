import { OperationCore } from './operation-core';

export type SlicerResult = object | object[] | null;

/**
 * Slicer Base Class [DRAFT]
 * @description A core operation for slicing large sets of data
 *              that will be pushed to the workers for processing.
 *              The slicer is not used within the same context of the other operations
 *              The "Slicer" is a part of the "Reader" component of a job.
 */

export class Slicer extends OperationCore {
    public async initialize(startingPoints?: any): Promise<void> {
        this.logger.debug('got initialized starting points', startingPoints);
        super.initialize();
    }

    // @ts-ignore
    public async slice(slicerId: number): Promise<SlicerResult> {
        throw new Error('Slicer must implement a "slice" method');
    }
}
