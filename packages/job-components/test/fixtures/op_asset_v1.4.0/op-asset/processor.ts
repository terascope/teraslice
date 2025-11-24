import { DataEntity } from '@terascope/core-utils';
import { BatchProcessor } from '../../../../src/index.js';

export default class OpTest extends BatchProcessor {
    async onBatch(input: DataEntity[]): Promise<DataEntity[]> {
        return input.map((data) => DataEntity.make({
            ...data,
            version: '1.4.0'
        }));
    }
}
