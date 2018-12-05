import { CollectConfig } from './interfaces';
import { BatchProcessor, DataEntity } from '../../operations';
import { Collector } from '../../collector';
import { WorkerContext, ExecutionConfig } from '../../interfaces';

export default class Collect extends BatchProcessor<CollectConfig> {
    collector: Collector<DataEntity>;

    constructor(context: WorkerContext, opConfig: CollectConfig, executionConfig: ExecutionConfig) {
        super(context, opConfig, executionConfig);
        this.collector = new Collector(opConfig);
    }

    async onBatch(batch: DataEntity[]) {
        this.collector.add(batch);

        return this.collector.getBatch() || [];
    }

    async shutdown() {
        await super.shutdown();
        const len = this.collector.flushAll().length;

        if (len > 0) {
            throw new Error(`Collect is shutdown with ${len} unprocessed records`);
        }
    }
}
