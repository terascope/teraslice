'use strict';

const _ = require('lodash');

function getMemoryUsage() {
    return process.memoryUsage().heapUsed;
}

function analyzeOp(fn, index) {
    if (!_.isFunction(fn)) throw new Error('Operation analytics requires a valid op function');
    if (!_.isNumber(index)) throw new Error('Operation analytics requires a valid index');
    return (obj, data, logger, msg) => {
        const start = Date.now();
        let end;
        let startingMemory = getMemoryUsage();

        function compareMemoryUsage() {
            const used = getMemoryUsage();
            const diff = used - startingMemory;
            // set the starting point for next op based off of what is used
            startingMemory = used;
            return diff;
        }

        return Promise.resolve(fn(data, logger, msg))
            .then((result) => {
                end = Date.now();
                obj.time[index] = (end - start);
                obj.memory[index] = compareMemoryUsage();
                const results = _.get(result, 'hits.hits', result);
                if (_.isArray(results)) {
                    obj.size[index] = _.size(results);
                } else {
                    obj.size[index] = 0;
                }
                return result;
            });
    };
}

function logOpStats(logger, slice, analyticsData) {
    const str = 'analytics for slice ';
    let dataStr = '';

    if (typeof slice === 'string') {
        dataStr = `${slice}, `;
    } else {
        _.forOwn(slice, (value, key) => {
            dataStr += `${key} : ${value} `;
        });
    }
    _.forOwn(analyticsData, (value, key) => {
        dataStr += `${key} : ${value} `;
    });

    logger.info(str + dataStr);
}

module.exports = { logOpStats, analyzeOp, getMemoryUsage };
