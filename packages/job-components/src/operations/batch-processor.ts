import * as L from 'list/methods';
import { DataEntity, DataEntityList } from './data-entity';
import { ProcessorCore } from './core/processor-core';

/**
 * BatchProcessor [DRAFT]
 * @description A variation of Processor that can handle a batch of data at a time.
 */

export abstract class BatchProcessor extends ProcessorCore {
    /**
     * @description this will handle an array of DataEntities
     *              and can increase size of the result by appending to the result
     * @returns an array of DataEntities
    */
    abstract async onBatch(data: DataEntity[]): Promise<DataEntity[]|DataEntityList>;

    /**
     * @description this is called by the Teraslice framework
     * @returns an array of DataEntities
    */
    async handle(input: DataEntityList): Promise<DataEntityList> {
        return L.from(await this.onBatch(input.toArray()));
    }
}
