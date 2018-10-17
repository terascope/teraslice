'use strict';

const { MapProcessor } = require('@terascope/job-components');

class ExampleMap extends MapProcessor {
    map(data) {
        data.touchedAt = new Date().toISOString();
        return data;
    }
}

module.exports = ExampleMap;
