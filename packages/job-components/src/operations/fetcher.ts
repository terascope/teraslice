import { DataEntity } from './data-entity';
import { OperationCore } from './core/operation-core';

/**
 * Fetcher [DRAFT]
 * @description One of the main types of an Operation for reading data for a slice.
 *              The "Fetcher" is a part of the "Reader" component of a job.
 */

export abstract class Fetcher extends OperationCore {
    /**
    * @description fetch data
    * @param sliceRequest the metadata from the Slice request
    * @returns an array of DataEntities
    */
    abstract async fetch(sliceRequest?: any): Promise<DataEntity[]>;

    /**
    * @description this is called by the Teraslice framework, this calls "->fetch"
    */
    async handle(sliceRequest?: any): Promise<DataEntity[]> {
        return this.fetch(sliceRequest);
    }
}
