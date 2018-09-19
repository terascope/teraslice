import { DataEntity } from './data-entity';
import { OperationCore } from './operation-core';

/**
 * DataProcessor Base Class [DRAFT]
 * @description A core operation within a job for consuming data one item at a time in the pipeline.
 */
export class DataProcessor extends OperationCore {
    // @ts-ignore
    async onData(data: DataEntity): Promise<DataEntity | null> {
        throw new Error('DataProcessor must implement a "onData" method');
    }
}
