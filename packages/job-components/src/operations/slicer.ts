import { OperationCore } from './operation-core';

// Make a generic SliceData interface
export interface SliceData {
    [prop: string]: any;
}

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

    public async slice(): Promise<SliceData[]> {
        return [];
    }
}
