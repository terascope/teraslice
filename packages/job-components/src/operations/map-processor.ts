import DataEntity from './data-entity';
import ProcessorCore from './core/processor-core';

/**
 * A variation of Processor that can process a single DataEntity at a time.
 * This processor should return a modified DataEntity.
 */

export default abstract class MapProcessor<T> extends ProcessorCore<T> {
    /**
    * Called by {@link Processor#handle} and will handle single {@link DataEntity}
    * @returns a DataEntity
    */
    abstract map(data: DataEntity): DataEntity;

    /**
     * A generic method called by the Teraslice framework, calls {@link #map}
     * @param input an array of DataEntities
     * @returns an array of DataEntities
    */
    async handle(input: DataEntity[]): Promise<DataEntity[]> {
        return input.map((data) => DataEntity.make(this.map(data)));
    }
}
