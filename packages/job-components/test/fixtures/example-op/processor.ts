import { MapProcessor, DataEntity } from '../../../src';

export default class ExampleMap extends MapProcessor {
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

    map(data: DataEntity) {
        data.touchedAt = new Date().toISOString();
        return data;
    }
}
