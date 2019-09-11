import { DataEntity, Fetcher, DataWindow } from '../../../src';

export default class ExampleFetcher extends Fetcher {
    _initialized = false;
    _shutdown = false;

    async initialize(): Promise<void> {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown(): Promise<void> {
        this._shutdown = true;
        return super.shutdown();
    }

    async fetch(): Promise<DataWindow> {
        const result = DataWindow.make();
        for (let i = 0; i < 10; i++) {
            result.push(DataEntity.make({
                id: i,
                data: [Math.random(), Math.random(), Math.random()],
            }));
        }
        return result;
    }
}
