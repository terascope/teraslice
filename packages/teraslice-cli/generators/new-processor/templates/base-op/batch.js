'use strict';

const { BatchProcessor } = require('@terascope/job-components');

class <%= name %> extends BatchProcessor {
    onBatch(dataArray) {
        // example code, processor code goes here
        dataArray.forEach((doc) => {
            doc.type = this.opConfig.type;
        });
        return dataArray;
    }
}

module.exports = <%= name %>;
