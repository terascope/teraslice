import { DataEntity } from '@terascope/entity-utils';
import { OpConfig } from '../interfaces/index.js';
import ProcessorCore from './core/processor-core.js';

/**
 * A variation of "Processor" that deals with a batch of data at a time.
 */
export default abstract class BatchProcessor<T = OpConfig> extends ProcessorCore<T> {
    /**
     * A method called by {@link BatchProcessor#handle}
     * @returns an array of DataEntities
     */
    abstract onBatch(batch: DataEntity[]): Promise<DataEntity[]>;

    async handle(input: DataEntity[]): Promise<DataEntity[]> {
        const output = await this.onBatch(DataEntity.makeArray(input));
        return DataEntity.makeArray(output);
    }
}
