import { DataEntity, Collector } from '@terascope/entity-utils';
import { CollectConfig } from './interfaces.js';
import { BatchProcessor } from '../../operations/index.js';
import { Context, ExecutionConfig } from '../../interfaces/index.js';

export default class Collect extends BatchProcessor<CollectConfig> {
    collector: Collector<DataEntity>;

    constructor(context: Context, opConfig: CollectConfig, executionConfig: ExecutionConfig) {
        super(context, opConfig, executionConfig);
        this.collector = new Collector(opConfig);
    }

    async onBatch(batch: DataEntity[]): Promise<DataEntity[]> {
        this.collector.add(batch);

        return this.collector.getBatch() || [];
    }

    async shutdown(): Promise<void> {
        await super.shutdown();
        const len = this.collector.flushAll().length;

        if (len > 0) {
            throw new Error(`Collect is shutdown with ${len} unprocessed records`);
        }
    }
}
