import { OpConfig } from '../interfaces';
import DataEntity from './data-entity';
import ProcessorCore from './core/processor-core';

/**
 * A variation of "Processor" that can handle a batch of data at a time.
 */

export default abstract class BatchProcessor<T = OpConfig> extends ProcessorCore<T> {
    /**
     * A method called by {@link BatchProcessor#handle}
     * @returns an array of DataEntities
    */
    abstract async onBatch(batch: DataEntity[]): Promise<DataEntity[]>;

    async handle(input: DataEntity[]): Promise<DataEntity[]> {
        const output = await this.onBatch(DataEntity.makeArray(input));
        return DataEntity.makeArray(output);
    }
}
