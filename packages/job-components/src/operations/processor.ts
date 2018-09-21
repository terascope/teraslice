import * as L from 'list/methods';
import { DataEntity, DataEntityList } from './data-entity';
import { ProcessorCore } from './core/processor-core';

/**
 * Processor [DRAFT]
 * @description A variation of Processor that can a single DataEntity at a time.
 *              If onData returns null, no more data will be passed to onData for this slice.
 */

export abstract class Processor extends ProcessorCore {
    /**
    * @description this will handle a single DataEntity at a time.
    *              If false is returned it will stop processing the result of "Batch"
    *              If null or undefined is returned it will skip that result
    * @returns an array of DataEntities
    */
    abstract onData(data: DataEntity): DataEntity|null|undefined|false;

    /**
     * @description this is called by the Teraslice framework
     * @returns an array of DataEntities
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
