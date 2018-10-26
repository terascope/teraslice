'use strict';

const { BatchProcessor } = require('@terascope/job-components');

class Stdout extends BatchProcessor {
    async onBatch(data) {
        if (this.opConfig.limit === 0) {
            console.log(data); // eslint-disable-line
        } else {
            console.log(_.take(data, opConfig.limit)); // eslint-disable-line
        }
        return data;
    }
}

module.exports = Stdout;
