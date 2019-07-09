'use strict';

const { ParallelSlicer, pDelay, times } = require('@terascope/job-components');

class ExampleSlicer extends ParallelSlicer {
    async newSlicer(id) {
        const { countPerSlicer } = this.opConfig;
        const records = times(countPerSlicer, i => ({ id: `slicer-${id}-${i}` }));

        return async () => {
            await pDelay(0);
            return records.shift();
        };
    }
}

module.exports = ExampleSlicer;
