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
    * @param startingData information given the "Fetcher" from the slicer
    * @returns an array of DataEntities
    */
    abstract async fetch(startingData?: any): Promise<DataEntity[]>;

    /**
    * @description this is called by the Teraslice framework, this calls "->fetch"
    */
    async handle(startingData?: any): Promise<DataEntity[]> {
        return this.fetch(startingData);
    }
}
