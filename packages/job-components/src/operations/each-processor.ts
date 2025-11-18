import { DataEntity } from '@terascope/core-utils';
import { OpConfig } from '../interfaces/index.js';
import ProcessorCore from './core/processor-core.js';

/**
 * A variation of Processor that can process a single DataEntity at a time.
 * This processor should have limit the side-effects on the data.
 */

export default abstract class EachProcessor<T = OpConfig> extends ProcessorCore<T> {
    /**
     * Called by {@link Processor#handle} and will handle single {@link DataEntity}
     * @returns void in order to avoid side-effects
     */
    abstract forEach(data: DataEntity, index: number, array: DataEntity[]): void;

    /**
     * A generic method called by the Teraslice framework, calls {@link #forEach}
     * @param input an array of DataEntities
     * @returns an array of DataEntities
     */
    async handle(input: DataEntity[]): Promise<DataEntity[]> {
        input.forEach((data, index, array) => this.forEach(data, index, array));
        return input;
    }
}
