import { pDelay, DataWindow } from '@terascope/utils';
import { DelayConfig } from './interfaces';
import { BatchProcessor } from '../../operations';

export default class Delay extends BatchProcessor<DelayConfig> {
    async onBatch(data: DataWindow): Promise<DataWindow> {
        await pDelay(this.opConfig.ms);
        return data;
    }
}
