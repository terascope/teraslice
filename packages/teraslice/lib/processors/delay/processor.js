'use strict';

const Promise = require('bluebird');
const { BatchProcessor } = require('@terascope/job-components');

class Delay extends BatchProcessor {
    async onBatch(data) {
        await Promise.delay(this.opConfig.ms);
        return data;
    }
}

module.exports = Delay;
