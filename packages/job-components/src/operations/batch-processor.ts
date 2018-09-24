import * as L from 'list/methods';
import { DataEntity, DataEntityList } from './data-entity';
import { ProcessorCore } from './core/processor-core';

/**
 * A variation of "Processor" that can handle a batch of data at a time.
 * @see ProcessorCore
 * @see OperationCore
 */

export abstract class BatchProcessor extends ProcessorCore {
    /**
     * A method called by {@link BatchProcessor#handle}
     * @returns an array of DataEntities or DataEntityList
    */
    abstract async onBatch(data: DataEntity[]): Promise<DataEntity[]|DataEntityList>;

    /**
     * A generic method called by the Teraslice framework, calls {@link #onBatch}
     * @param input an immutable list of DataEntities
     * @returns an immutable list of DataEntities
     * @see ProcessorCore#handle
    */
    async handle(input: DataEntityList): Promise<DataEntityList> {
        return L.from(await this.onBatch(input.toArray()));
    }
}
