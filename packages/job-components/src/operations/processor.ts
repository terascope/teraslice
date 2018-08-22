import { DataEntity } from './data-entity';
import { OperationCore } from './operation-core';

/**
 * Processor Base Class [DRAFT]
 * @description A core operation within a job for consuming data in the pipeline.
 */

export class Processor extends OperationCore {
    public async onData(data: DataEntity): Promise<DataEntity | null> {
        return data;
    }

    public async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        return data;
    }
}
