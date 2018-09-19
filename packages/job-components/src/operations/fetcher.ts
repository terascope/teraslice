import { DataEntity } from './data-entity';
import { OperationCore } from './core/operation-core';

/**
 * Fetcher [DRAFT]
 * @description One of the main types of an Operation for reading data for a slice.
 *              The "Fetcher" is a part of the "Reader" component of a job.
 */

export abstract class Fetcher extends OperationCore {
    abstract async fetch(startingData?: any): Promise<DataEntity[]>;

    // this method is called by the teraslice framework and should not be overwritten
    async handle(startingData?: any): Promise<DataEntity[]> {
        return this.fetch(startingData);
    }
}
