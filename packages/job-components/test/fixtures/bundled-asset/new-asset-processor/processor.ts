import { DataEntity, times } from '@terascope/core-utils';
import { BatchProcessor } from '../../../../src/index.js';

export class AssetProcessorExampleBatch extends BatchProcessor {
    _initialized = false;
    _shutdown = false;
    _flushing = false;
    newAssetProcessor = true;

    async initialize(): Promise<void> {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown(): Promise<void> {
        this._shutdown = true;
        return super.shutdown();
    }

    async onBatch(input: DataEntity[]): Promise<DataEntity[]> {
        if (this.opConfig.test_flush && this._flushing) {
            return times(30, () => DataEntity.make({ flush: true }));
        }

        return input.map((data) => DataEntity.make({
            ...data,
            touchedAt: new Date().toISOString(),
            isNewProcessor: true
        }));
    }

    onFlushStart(): void {
        this._flushing = true;
    }

    onFlushEnd(): void {
        this._flushing = false;
    }
}
