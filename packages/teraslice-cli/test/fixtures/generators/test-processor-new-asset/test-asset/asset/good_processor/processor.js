'use strict';

const { MapProcessor } = require('@terascope/job-components');

class GoodProcessor extends MapProcessor {
    map(batch) {
        return batch.map((data) => {
            data.batchedAt = new Date().toISOString();
            return data;
        });
    }
}

module.exports = GoodProcessor;
