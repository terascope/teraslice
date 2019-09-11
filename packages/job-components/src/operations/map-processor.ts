import { DataEntity, DataWindow } from '@terascope/utils';
import { OpConfig } from '../interfaces';
import ProcessorCore from './core/processor-core';

/**
 * A variation of Processor that can process a single DataEntity at a time.
 * This processor should return a modified DataEntity.
 */

export default abstract class MapProcessor<T = OpConfig> extends ProcessorCore<T> {
    /**
     * Called by {@link Processor#handle} and will handle single {@link DataEntity}
     *
     * @returns a DataEntity
     */
    abstract map(data: DataEntity, index: number, array: DataEntity[]): DataEntity;

    /**
     * A generic method called by the Teraslice framework, calls {@link #map}
     * @param input an array of DataEntities
     *
     * @returns an array of DataEntities
     */
    async handle(input: DataWindow): Promise<DataWindow|DataWindow[]> {
        return input.map((data, index, array) => this.map(data, index, array));
    }
}
