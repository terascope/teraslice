import { DataEntity } from './data-entity';
import { OperationCore } from './core/operation-core';

/**
 * Processor [DRAFT]
 * @description A variation of Processor that can a single DataEntity at a time.
 *              If onData returns null, no more data will be passed to onData for this slice.
 */

export abstract class Processor extends OperationCore {
    /**
    * @description this will handle a single DataEntity at a time.
    *              If null is returned it will stop processing the result of "Batch"
    * @returns an array of DataEntities
    */
    abstract async onData(data: DataEntity): Promise<DataEntity | null>;

    /**
     * @description this is called by the Teraslice framework
     * @returns an array of DataEntities
    */
    async handle(input: DataEntity[]): Promise<DataEntity[]> {
        const remaining = input.slice();
        const entities: DataEntity[] = [];

        const forEach = async (): Promise<void> => {
            const data = remaining.shift();
            if (data == null) return;

            const result = await this.onData(data);
            if (result == null) return;

            entities.push(result);

            return forEach();
        };

        await forEach();

        return entities;
    }
}
