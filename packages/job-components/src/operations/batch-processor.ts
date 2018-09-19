import { DataEntity } from './data-entity';
import { ProcessorCore } from './core/processor-core';

/**
 * BatchProcessor [DRAFT]
 * @description A variation of Processor that can handle a batch of data at a time.
 */
export abstract class BatchProcessor extends ProcessorCore {
    abstract async onBatch(data: DataEntity[]): Promise<DataEntity[]>;

    // this method is called by the teraslice framework and should not be overwritten
    async handle(input: DataEntity[]): Promise<DataEntity[]> {
        return this.onBatch(input);
    }
}
