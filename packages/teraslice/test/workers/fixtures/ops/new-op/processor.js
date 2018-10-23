'use strict';

const { MapProcessor } = require('../../..');

class ExampleMap extends MapProcessor {
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

module.exports = ExampleMap;
