import { promisify } from 'util';
import { DelayConfig } from './interfaces';
import { BatchProcessor, DataEntity } from '../../operations';
const delay = promisify(setTimeout);

export default class Delay extends BatchProcessor<DelayConfig> {
    async onBatch(data: DataEntity[]) {
        await delay(this.opConfig.ms);
        return data;
    }
}
