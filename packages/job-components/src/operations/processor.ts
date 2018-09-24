import * as L from 'list/methods';
import DataEntity, { DataEntityList } from './data-entity';
import ProcessorCore from './core/processor-core';

/**
 * A variation of Processor that can a single DataEntity at a time.
 * This call be used as a primative for doing `filter`, `map`, `forEach`, `error`
 */

export default abstract class Processor extends ProcessorCore {
    /**
    * Called by {@link Processor#handle} and will handle single {@link DataEntity}
    * If false is returned it will stop processing the result of "Batch"
    * If null or undefined is returned it will skip that result
    * @returns an array of DataEntities
    */
    abstract onData(data: DataEntity): DataEntity|null|undefined|false;

    /**
     * A generic method called by the Teraslice framework, calls {@link #onData}
     * @param input an immutable list of DataEntities
     * @returns an immutable list of DataEntities
    */
    async handle(input: DataEntityList): Promise<DataEntityList> {
        let output : DataEntityList = L.empty();

        for (const data of input) {
            const result = this.onData(data);
            if (result == null) continue;
            if (result === false) break;

            output = output.append(result);
        }

        return output;
    }

}
