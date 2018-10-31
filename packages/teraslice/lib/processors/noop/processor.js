'use strict';

const { BatchProcessor } = require('@terascope/job-components');

class Noop extends BatchProcessor {
    async onBatch(data) {
        return data;
    }
}

module.exports = Noop;
