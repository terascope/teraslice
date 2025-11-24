import { DataEntity } from '@terascope/core-utils';
import { BatchProcessor } from '../../operations/index.js';

export default class Noop extends BatchProcessor {
    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        return data;
    }
}
