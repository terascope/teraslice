'use strict';

const { <%= type %>Processor } = require('@terascope/job-components');

class <%= name %> extends <%= type %>Processor {
    <%= typeFunc %>(batch) {
        return batch.map((data) => {
            data.batchedAt = new Date().toISOString();
            return data;
        });
    }
}

module.exports = <%= name %>;
