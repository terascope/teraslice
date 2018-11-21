'use strict';

/* eslint-disable no-console */

const _ = require('lodash');
const { BatchProcessor } = require('@terascope/job-components');

class Stdout extends BatchProcessor {
    async onBatch(data) {
        if (this.opConfig.limit === 0) {
            console.log(data);
        } else {
            console.log(_.take(data, this.opConfig.limit));
        }
        return data;
    }
}

module.exports = Stdout;
