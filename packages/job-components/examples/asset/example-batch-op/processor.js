'use strict';

const { BatchProcessor } = require('@terascope/job-components');

class ExampleBatchProcessor extends BatchProcessor {
    onBatch(batch) {
        return batch.map((data) => {
            data.batchedAt = new Date().toISOString();
            return data;
        });
    }
}

module.exports = ExampleBatchProcessor;
