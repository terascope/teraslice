'use strict';
var moment = require('moment');
var Promise = require('bluebird');

function analyze(fn) {

    return function(obj, data, msg) {
        var start = moment();
        var end;

        return Promise.resolve(fn(data, msg))
            .then(function(result) {
                end = moment();
                obj.time.push(end - start);
                if (result) {
                    if (result.hits && result.hits.hits) {
                        obj.size.push(result.hits.hits.length);
                    }
                    else if (result.length) {
                        obj.size.push(result.length);
                    }
                    else {
                        //need to account for senders
                        obj.size.push(0);
                    }
                }
                return result;
            });
    }
}

function insertAnalyzers(array) {
    return array.map(function(fn) {
        return analyze(fn);
    })
}

function statContainer(ops) {
    var obj = {time: [], size: []};

    for (var i = 0; i < ops.length; i++) {
        obj.time.push([]);
        obj.size.push([]);
    }

    return obj;
}

function addStats(obj, data) {

    data.time.forEach(function(duration, index) {
        obj.time[index].push(duration)
    });

    data.size.forEach(function(len, index) {
        obj.size[index].push(len)
    });
}

function calculateStats(array) {
    var max = Number.NEGATIVE_INFINITY;
    var min = Number.POSITIVE_INFINITY;
    var total = array.length;

    var sum = array.reduce(function(prev, num) {

        if (num > max) {
            max = num;
        }
        if (num < min) {
            min = num
        }
        return prev + num
    }, 0);

    var average = (sum / total).toFixed(2);

    return {max: max, min: min, average: average};
}

function analyzeStats(logger, operations, obj) {
    logger.info('calculating statistics');

    var time = obj.time.map(function(arr) {
        return calculateStats(arr);
    });

    var size = obj.size.map(function(arr) {
        return calculateStats(arr);
    });

    time.forEach(function(data, index) {
        logger.info('operation ' + operations[index]._op + '\n average completion time of: ' + data.average + ' ms, ' +
            'min: ' + data.min + ' ms, and max: ' + data.max + 'ms \n' +
            ' average size : ' + size[index].average + ', min: ' + size[index].min + ', and max: ' + size[index].max)
    });

}

module.exports = {
    analyze: analyze,
    insertAnalyzers: insertAnalyzers,
    statContainer: statContainer,
    addStats: addStats,
    analyzeStats: analyzeStats
};