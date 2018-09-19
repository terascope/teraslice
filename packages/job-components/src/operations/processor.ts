import { DataEntity } from './data-entity';
import { OperationCore } from './core/operation-core';

/**
 * Processor [DRAFT]
 * @description A variation of Processor that can a single DataEntity at a time.
 *              If onData returns null, no more data will be passed to onData for this slice.
 */
export abstract class Processor extends OperationCore {
    abstract async onData(data: DataEntity): Promise<DataEntity | null>;

    // this method is called by the teraslice framework and should not be overwritten
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
