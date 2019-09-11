import { DataWindow } from '@terascope/utils';
import { BatchProcessor } from '../../operations';

export default class Noop extends BatchProcessor {
    async onBatch(data: DataWindow): Promise<DataWindow> {
        return data;
    }
}
