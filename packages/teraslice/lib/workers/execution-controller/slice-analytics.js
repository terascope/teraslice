import _ from 'lodash';
import { makeLogger } from '../helpers/terafoundation.js';

export default function _sliceAnalytics(context, executionContext) {
    const logger = makeLogger(context, 'slice_analytics');

    const events = context.apis.foundation.getSystemEvents();

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
            average: 0
        });
        sliceAnalytics.size.push({
            min: 0,
            max: 0,
            sum: 0,
            total: 0,
            average: 0
        });
        sliceAnalytics.memory.push({
            min: 0,
            max: 0,
            sum: 0,
            total: 0,
            average: 0
        });
    }

    function addStat(input, stat) {
        if (!_.has(input, stat) || !_.has(sliceAnalytics, stat)) {
            logger.warn(`unsupported stat "${stat}"`);
            return;
        }

        for (let i = 0; i < operations.length; i += 1) {
            const val = input[stat][i];
            if (!_.isSafeInteger(val)) {
                return;
            }

            sliceAnalytics[stat][i].sum += val;
            sliceAnalytics[stat][i].total += 1;

            const {
                min, max, total, sum
            } = sliceAnalytics[stat][i];

            sliceAnalytics[stat][i].min = min !== 0 ? _.min([val, min]) : val;
            sliceAnalytics[stat][i].max = max !== 0 ? _.max([val, max]) : val;
            sliceAnalytics[stat][i].average = _.round(sum / total, 2);
        }
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

    function getStats() {
        return sliceAnalytics;
    }

    function onSliceSuccess({ analytics }) {
        if (analytics) {
            addStats(analytics);
        }
    }

    events.on('slice:success', onSliceSuccess);

    async function shutdown() {
        events.removeListener('slice:success', onSliceSuccess);
    }

    return {
        addStats,
        analyzeStats,
        getStats,
        shutdown
    };
};
