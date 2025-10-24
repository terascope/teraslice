import { DataEntity } from '@terascope/entity-utils';
import { Fetcher } from '../../../../src/index.js';

export class AssetExampleFetcher extends Fetcher {
    _initialized = false;
    _shutdown = false;
    isNewAssetFetcher = true;

    async initialize(): Promise<void> {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown(): Promise<void> {
        this._shutdown = true;
        return super.shutdown();
    }

    async fetch(): Promise<DataEntity[]> {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [Math.random(), Math.random(), Math.random()],
            });
        }
        return result as any[];
    }
}
