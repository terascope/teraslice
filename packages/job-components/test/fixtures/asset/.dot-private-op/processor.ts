import { DataEntity, BatchProcessor } from '../../../../src';

export default class PrivateBatch extends BatchProcessor {
    async onBatch(input: DataEntity[]): Promise<DataEntity[]> {
      return input
    }
}
