'use strict';

const moment = require('moment');
const Promise = require('bluebird');

function getMemoryUsage() {
    return process.memoryUsage().heapUsed;
}

function analyze(fn) {
    return (obj, data, logger, msg) => {
        const start = moment();
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
                end = moment();
                obj.time.push(end - start);
                obj.memory.push(compareMemoryUsage());
                if (result) {
                    if (result.hits && result.hits.hits) {
                        obj.size.push(result.hits.hits.length);
                    } else if (result.length) {
                        obj.size.push(result.length);
                    } else {
                        // need to account for senders
                        obj.size.push(0);
                    }
                }
                return result;
            });
    };
}

function insertAnalyzers(array) {
    return array.map(fn => analyze(fn));
}

function statContainer(ops) {
    const obj = { time: [], size: [], memory: [] };

    for (let i = 0; i < ops.length; i += 1) {
        obj.time.push([]);
        obj.size.push([]);
        obj.memory.push([]);
    }

    return obj;
}

function addStats(obj, data) {
    data.time.forEach((duration, index) => {
        obj.time[index].push(duration);
    });

    data.size.forEach((len, index) => {
        obj.size[index].push(len);
    });

    data.memory.forEach((mem, index) => {
        obj.memory[index].push(mem);
    });
}

function calculateStats(array) {
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

function analyzeStats(logger, operations, obj) {
    logger.info('calculating statistics');

    const time = obj.time.map(arr => calculateStats(arr));
    const size = obj.size.map(arr => calculateStats(arr));
    const memory = obj.memory.map(arr => calculateStats(arr));

    time.forEach((data, index) => {
        logger.info(`
operation ${operations[index]._op}
average completion time of: ${data.average} ms, min: ${data.min} ms, and max: ${data.max} ms
average size : ${size[index].average}, min: ${size[index].min}, and max: ${size[index].max}
average memory : ${memory[index].average}, min: ${memory[index].min}, and max: ${memory[index].max}
             `);
    });
}


module.exports = {
    analyze,
    insertAnalyzers,
    statContainer,
    addStats,
    analyzeStats,
    calculateStats
};
