import { EntityResult, DataWindow, makeWindowResult } from '@terascope/utils';
import { OpConfig } from '../interfaces';
import ProcessorCore from './core/processor-core';

/**
 * A variation of "Processor" that deals with a batch of data at a time.
 */
export default abstract class BatchProcessor<T = OpConfig> extends ProcessorCore<T> {
    /**
     * A method called by {@link BatchProcessor#handle}
     * @returns an array of DataEntities
     */
    abstract async onBatch(batch: DataWindow): Promise<EntityResult>;

    async handle(input: DataWindow): Promise<DataWindow|DataWindow[]> {
        return makeWindowResult(await this.onBatch(DataWindow.make(input)));
    }
}
