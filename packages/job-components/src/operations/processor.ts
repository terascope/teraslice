import { DataEntity } from '@terascope/job-components/src/operations/data-entity';
import { OperationCore } from '@terascope/job-components/src/operations/operation-core';

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
