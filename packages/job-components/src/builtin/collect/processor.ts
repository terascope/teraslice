import { DataEntity, Collector, DataWindow } from '@terascope/utils';
import { CollectConfig } from './interfaces';
import { BatchProcessor } from '../../operations';
import { WorkerContext, ExecutionConfig } from '../../interfaces';

export default class Collect extends BatchProcessor<CollectConfig> {
    collector: Collector<DataEntity>;

    constructor(context: WorkerContext, opConfig: CollectConfig, executionConfig: ExecutionConfig) {
        super(context, opConfig, executionConfig);
        this.collector = new Collector(opConfig);
    }

    async onBatch(batch: DataWindow): Promise<DataWindow> {
        this.collector.add(batch as DataEntity[]);

        return this.collector.getBatch() || [] as any;
    }

    async shutdown(): Promise<void> {
        await super.shutdown();
        const len = this.collector.flushAll().length;

        if (len > 0) {
            throw new Error(`Collect is shutdown with ${len} unprocessed records`);
        }
    }
}
