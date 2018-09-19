import { DataEntity } from './data-entity';
import { OperationCore } from './operation-core';

/**
 * BatchProcessor Base Class [DRAFT]
 * @description A core operation within a job for consuming data in batches in the pipeline.
 */
export class BatchProcessor extends OperationCore {
    // @ts-ignore
    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        throw new Error('BatchProcessor must implement a "onBatch" method');
    }
}
