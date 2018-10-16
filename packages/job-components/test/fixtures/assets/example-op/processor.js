'use strict';

const { Processor } = require('../../../..');

class MapProcessor extends Processor {
    onData(data) {
        data.touchedAt = new Date().toISOString();
        return data;
    }
}

module.exports = MapProcessor;
