'use strict';

const { MapProcessor } = require('../../..');

class ExampleMap extends MapProcessor {
    map(data) {
        data.touchedAt = new Date().toISOString();
        return data;
    }
}

module.exports = ExampleMap;
