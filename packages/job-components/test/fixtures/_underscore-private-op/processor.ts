import { DataWindow, BatchProcessor } from '../../../src';

export default class PrivateBatch extends BatchProcessor {
    async onBatch(input: DataWindow): Promise<DataWindow> {
        return input;
    }
}
