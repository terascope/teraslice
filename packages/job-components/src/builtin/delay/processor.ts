import { pDelay, DataEntity } from '@terascope/core-utils';
import { DelayConfig } from './interfaces.js';
import { BatchProcessor } from '../../operations/index.js';

export default class Delay extends BatchProcessor<DelayConfig> {
    async onBatch(data: DataEntity[]): Promise<DataEntity[]> {
        await pDelay(this.opConfig.ms);
        return data;
    }
}
