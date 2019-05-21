import { DataEntity, BatchProcessor, times } from '../../../src';

export default class ExampleBatch extends BatchProcessor {
    _initialized = false;
    _shutdown = false;
    _flushing = false;

    async initialize() {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }

    async onBatch(input: DataEntity[]) {
        if (this.opConfig.test_flush && this._flushing) {
            return times(30, () => DataEntity.make({ flush: true }));
        }

        return input.map(data => {
            return DataEntity.make({
                ...data,
                touchedAt: new Date().toISOString(),
            });
        });
    }

    beforeFlush() {
        this._flushing = true;
    }

    afterFlush() {
        this._flushing = false;
    }
}
