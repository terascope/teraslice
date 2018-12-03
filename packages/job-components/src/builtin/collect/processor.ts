import { CollectConfig } from './interfaces';
import { BatchProcessor, DataEntity } from '../../operations';

export default class Collect extends BatchProcessor<CollectConfig> {
    queue: DataEntity[] = [];
    private _startTime: number|null = null;

    async onBatch(batch: DataEntity[]) {
        if (this._startTime == null) {
            this._startTime = Date.now();
        }

        this.enqueueBatch(batch);
        return this.dequeueBatch();
    }

    async shutdown() {
        await super.shutdown();
        if (this.queue.length > 0) {
            throw new Error(`Collect is shutdown with ${this.queue.length} unprocessed records`);
        }
    }

    private enqueueBatch(batch: DataEntity[]) {
        const newQueue: DataEntity[] = [];
        this.queue = newQueue.concat(this.queue, batch);
    }

    private dequeueBatch(): DataEntity[] {
        const isValid = this.checkTime();

        if (isValid && this.queue.length < this.opConfig.size) return [];

        const result = this.queue.splice(0, this.opConfig.size);
        this.queue = this.queue.slice();

        this.logger.debug(`resolving batch of size ${result.length}`);

        this._startTime = null;
        return result;
    }

    private checkTime(): boolean {
        if (this._startTime == null) return true;

        const invalidAt = this._startTime + this.opConfig.wait;
        return Date.now() < invalidAt;
    }
}
