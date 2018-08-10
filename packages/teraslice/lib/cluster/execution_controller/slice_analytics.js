'use strict';

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
    const sliceAnalytics = { time: [], size: [], memory: [] };

    for (let i = 0; i < operations.length; i += 1) {
        sliceAnalytics.time.push([]);
        sliceAnalytics.size.push([]);
        sliceAnalytics.memory.push([]);
    }

    function addStats(data) {
        data.time.forEach((duration, index) => {
            sliceAnalytics.time[index].push(duration);
        });

        data.size.forEach((len, index) => {
            sliceAnalytics.size[index].push(len);
        });

        data.memory.forEach((mem, index) => {
            sliceAnalytics.memory[index].push(mem);
        });
    }

    function _calculateStats(array) {
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;
        const total = array.length;

        const sum = array.reduce((prev, num) => {
            if (num > max) {
                max = num;
            }
            if (num < min) {
                min = num;
            }
            return prev + num;
        }, 0);

        const average = (sum / total).toFixed(2);

        return { max, min, average };
    }

    function analyzeStats() {
        logger.info('calculating statistics');

        const time = sliceAnalytics.time.map(arr => _calculateStats(arr));
        const size = sliceAnalytics.size.map(arr => _calculateStats(arr));
        const memory = sliceAnalytics.memory.map(arr => _calculateStats(arr));

        time.forEach((data, index) => {
            logger.info(`
operation ${operations[index]._op}
average completion time of: ${data.average} ms, min: ${data.min} ms, and max: ${data.max} ms
average size : ${size[index].average}, min: ${size[index].min}, and max: ${size[index].max}
average memory : ${memory[index].average}, min: ${memory[index].min}, and max: ${memory[index].max}
             `);
        });
    }

    function testContext() {
        return { sliceAnalytics, _calculateStats };
    }

    return {
        addStats,
        analyzeStats,
        __test_context: testContext
    };
};
