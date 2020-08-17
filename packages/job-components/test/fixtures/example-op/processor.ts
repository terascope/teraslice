import {
    DataEntity,
    BatchProcessor,
    times,
    DataWindow
} from '../../../src';

export default class ExampleBatch extends BatchProcessor {
    _initialized = false;
    _shutdown = false;
    _flushing = false;

    async initialize(): Promise<void> {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown(): Promise<void> {
        this._shutdown = true;
        return super.shutdown();
    }

    async onBatch(input: DataWindow): Promise<DataWindow> {
        if (this.opConfig.test_flush && this._flushing) {
            return times(30, () => DataEntity.make({ flush: true }));
        }

        return input.map((data) => DataEntity.make({
            ...data,
            touchedAt: new Date().toISOString(),
        }));
    }

    onFlushStart(): void {
        this._flushing = true;
    }

    onFlushEnd(): void {
        this._flushing = false;
    }
}
