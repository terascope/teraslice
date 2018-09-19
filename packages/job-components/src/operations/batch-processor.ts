import { DataEntity } from './data-entity';
import { OperationCore } from './operation-core';

/**
 * BatchProcessor Base Class [DRAFT]
 * @description A core operation within a job for consuming data in batches in the pipeline.
 */
export class BatchProcessor extends OperationCore {
    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        this.logger.debug(`got batch of ${data.length}`);
        throw new Error('BatchProcessor must implement a "onBatch" method');
    }
}
