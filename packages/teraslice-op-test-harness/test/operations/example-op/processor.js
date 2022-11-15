import { MapProcessor } from '@terascope/job-components';

export default class ExampleMap extends MapProcessor {
    async initialize() {
        this.initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this.shutdown = true;
        return super.shutdown();
    }

    map(data) {
        data.touchedAt = new Date().toISOString();
        return data;
    }
}
