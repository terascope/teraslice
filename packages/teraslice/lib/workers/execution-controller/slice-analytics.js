'use strict';

const _ = require('lodash');

module.exports = function _sliceAnalytics(context, executionContext) {
    const exId = executionContext.ex_id || process.env.ex_id;
    const jobId = executionContext.job_id || process.env.job_id;

    const logger = context.apis.foundation.makeLogger({
        module: 'slice_analytics',
        ex_id: exId,
        job_id: jobId
    });

    const { operations } = executionContext.config;

    // create a container to hold all the slice analytics for this execution
    const sliceAnalytics = {
        time: [],
        size: [],
        memory: []
    };

    for (let i = 0; i < operations.length; i += 1) {
        sliceAnalytics.time.push({
            min: 0,
            max: 0,
            sum: 0,
            total: 0,
            average: 0,
        });
        sliceAnalytics.size.push({
            min: 0,
            max: 0,
            sum: 0,
            total: 0,
            average: 0,
        });
        sliceAnalytics.memory.push({
            min: 0,
            max: 0,
            sum: 0,
            total: 0,
            average: 0,
        });
    }

    function addStat(input, stat) {
        if (!_.has(input, stat) || !_.has(sliceAnalytics, stat)) {
            logger.warn(`unsupported stat "${stat}"`);
            return;
        }

        input[stat].forEach((val, index) => {
            if (!_.isSafeInteger(val)) {
                return;
            }

            sliceAnalytics[stat][index].sum += val;
            sliceAnalytics[stat][index].total += 1;

            const {
                min,
                max,
                total,
                sum
            } = sliceAnalytics[stat];

            if (min === 0 || min > val) {
                sliceAnalytics[stat][index].min = val;
            }
            if (max === 0 || max > val) {
                sliceAnalytics[stat][index].max = val;
            }
            sliceAnalytics[stat][index].average = _.round((sum / total), 2);
        });
    }

    function addStats(data) {
        addStat(data, 'time');
        addStat(data, 'memory');
        addStat(data, 'size');
    }

    function analyzeStats() {
        logger.info('calculating statistics');


        for (let i = 0; i < operations.length; i += 1) {
            const name = operations[i]._op;
            const time = sliceAnalytics.time[i];
            const size = sliceAnalytics.size[i];
            const memory = sliceAnalytics.memory[i];

            logger.info(`
operation ${name}
average completion time of: ${time.average} ms, min: ${time.min} ms, and max: ${time.max} ms
average size: ${size.average}, min: ${size.min}, and max: ${size.max}
average memory: ${memory.average}, min: ${memory.min}, and max: ${memory.max}
            `);
        }
    }

    function testContext() {
        return { sliceAnalytics };
    }

    return {
        addStats,
        analyzeStats,
        __test_context: testContext
    };
};
