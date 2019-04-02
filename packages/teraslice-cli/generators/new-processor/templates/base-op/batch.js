'use strict';

const { BatchProcessor } = require('@terascope/job-components');

class <%= name %> extends BatchProcessor {
    constructor(...args) {
        super(...args);
        // the args are context, opConfig, executionConfig
        this.opConfig.type = 'string';
    }

    onBatch(dataArray) {
        dataArray.forEach((doc) => {
            doc.type = this.opConfig.type;
        });
        return dataArray;
    }
}

module.exports = <%= name %>;
