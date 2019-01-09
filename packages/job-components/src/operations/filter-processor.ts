import { DataEntity } from '@terascope/utils';
import { OpConfig } from '../interfaces';
import ProcessorCore from './core/processor-core';

/**
 * A variation of Processor that can process a single DataEntity at a time.
 * This processor is used to removed data from the batch of data
 */

export default abstract class FilterProcessor<T = OpConfig> extends ProcessorCore<T> {
    /**
    * Called by {@link Processor#handle} and will handle single {@link DataEntity}
    * @returns a thruthy value to indicate whether the data should be passed on.
    */
    abstract filter(data: DataEntity): boolean;

    /**
     * A generic method called by the Teraslice framework, calls {@link #filter}
     * @param input an array of DataEntities
     * @returns an array of DataEntities
    */
    async handle(input: DataEntity[]): Promise<DataEntity[]> {
        return input.filter((data) => this.filter(data));
    }
}
