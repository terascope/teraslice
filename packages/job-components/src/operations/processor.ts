import { DataEntity } from './data-entity';
import { OperationCore } from './operation-core';

/**
 * Processor Base Class [DRAFT]
 * @description A core operation within a job for consuming data one item at a time in the pipeline.
 */
export class Processor extends OperationCore {
    async onData(data: DataEntity): Promise<DataEntity | null> {
        this.logger.debug(`data ${data}`);
        throw new Error('DataProcessor must implement a "onData" method');
    }
}
