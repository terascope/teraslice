import { Fetcher } from '../../..';

export default class ExampleFetcher extends Fetcher {
    _initialized = false;
    _shutdown = false;

    async initialize() {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }

    async fetch() {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [
                    Math.random(),
                    Math.random(),
                    Math.random(),
                ]
            });
        }
        return result;
    }
}
