import * as L from 'list/methods';
import DataEntity, { DataEntityList } from './data-entity';
import ProcessorCore from './core/processor-core';

/**
 * A variation of "Processor" that can handle a batch of data at a time.
 */

export default abstract class BatchProcessor extends ProcessorCore {
    /**
     * A method called by {@link BatchProcessor#handle}
     * @returns an array of DataEntities or DataEntityList
    */
    abstract async onBatch(data: DataEntity[]): Promise<DataEntity[]|DataEntityList>;

    async handle(input: DataEntityList): Promise<DataEntityList> {
        return L.from(await this.onBatch(input.toArray()));
    }
}
