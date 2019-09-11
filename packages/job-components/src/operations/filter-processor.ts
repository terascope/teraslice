import { DataEntity, DataWindow } from '@terascope/utils';
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
    abstract filter(data: DataEntity, index: number, array: DataEntity[]): boolean;

    /**
     * A generic method called by the Teraslice framework, calls {@link #filter}
     */
    async handle(input: DataWindow): Promise<DataWindow|DataWindow[]> {
        // eslint-disable-next-line arrow-body-style
        return input.filter((value, index, array): value is DataEntity => {
            return this.filter(value, index, array);
        });
    }
}
