import DataEntity, { DataEntityList } from './data-entity';
import ProcessorCore from './core/processor-core';

/**
 * A variation of Processor that can process a single DataEntity at a time.
 * This processor is used to removed data from the batch of data
 */

export default abstract class FilterProcessor extends ProcessorCore {
    /**
    * Called by {@link Processor#handle} and will handle single {@link DataEntity}
    * @returns a thruthy value to indicate whether the data should be passed on.
    */
    abstract filter(data: DataEntity): boolean;

    /**
     * A generic method called by the Teraslice framework, calls {@link #filter}
     * @param input an immutable list of DataEntities
     * @returns an immutable list of DataEntities
    */
    async handle(input: DataEntityList): Promise<DataEntityList> {
        return input.filter((data) => this.filter(data));
    }
}
