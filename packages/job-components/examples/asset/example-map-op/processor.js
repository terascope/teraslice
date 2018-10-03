'use strict';

const { Processor } = require('@terascope/job-components');

class MapProcessor extends Processor {
    onData(data) {
        data.touchedAt = new Date().toISOString();
        return data;
    }
}

module.exports = MapProcessor;
