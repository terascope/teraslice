import DataEntity from './data-entity';
import ProcessorCore from './core/processor-core';

/**
 * A variation of Processor that can process a single DataEntity at a time.
 * This processor should have zero side-effects on the data.
 */

export default abstract class EachProcessor extends ProcessorCore {
    /**
    * Called by {@link Processor#handle} and will handle single {@link DataEntity}
    * @returns void in order to avoid side-effects
    */
    abstract forEach(data: DataEntity): void;

    /**
     * A generic method called by the Teraslice framework, calls {@link #forEach}
     * @param input an array of DataEntities
     * @returns an array of DataEntities
    */
    async handle(input: DataEntity[]): Promise<DataEntity[]> {
        input.forEach((data) => this.forEach(data));
        return input;
    }
}
