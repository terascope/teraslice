'use strict';

const times = require('lodash/times');
const uniqueId = require('lodash/uniqueId');
const Promise = require('bluebird');
const { ParallelSlicer } = require('@terascope/job-components');

class ExampleSlicer extends ParallelSlicer {
    async newSlicer() {
        const { countPerSlicer } = this.opConfig;
        const records = times(countPerSlicer, () => ({ id: uniqueId('slicer-') }));

        return async () => {
            await Promise.delay(0);
            return records.shift();
        };
    }
}

module.exports = ExampleSlicer;
