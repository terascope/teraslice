import { DataEntity } from '@terascope/entity-utils';
import { BatchProcessor } from '../../../../src/index.js';

export default class PrivateBatch extends BatchProcessor {
    async onBatch(input: DataEntity[]): Promise<DataEntity[]> {
        return input;
    }
}
