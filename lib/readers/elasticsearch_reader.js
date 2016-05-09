'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var processInterval = require('./../utils/elastic_utils').processInterval;
var getClient = require('../utils/config').getClient;
var buildQuery = require('./../utils/elastic_utils').buildQuery;
var buildRangeQuery = require('./../utils/elastic_utils').buildRangeQuery;
var dateFormat = require('./../utils/elastic_utils').dateFormat;
var parser = require('datemath-parser');
var _ = require('lodash');


function newReader(context, opConfig, jobConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');

    if (opConfig.full_response) {

        return function(msg) {
            var query = buildQuery(opConfig, msg);
            return client.search(query);
        }
    }
    else {
        return function(msg) {
            return new Promise(function(resolve, reject) {
                var query = buildQuery(opConfig, msg);
                client.search(query).then(function(data) {
                    resolve(data.hits.hits.map(function(data) {
                        return data._source
                    }))
                });
            })
        }
    }
}

function checkElasticsearch(client, opConfig, logger) {
    return client.cluster.stats({}).then(function(data) {
        var version = data.nodes.versions[0];

        if (checkVersion(version)) {
            return client.indices.getSettings({}).then(function(results) {
                //TODO needs error handling if index doesn't exist
                var data = results[opConfig.index].settings.index.max_result_window;
                var window = data ? data : 10000;

                logger.info(' max_result_window for index: ' + opConfig.index + ' is set at ' + window + '. On very' +
                    ' large indices it is possible that a slice can not be divided to stay below this limit. ' +
                    'If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. ' +
                    'Increasing max_result_window in the Elasticsearch index settings will resolve the problem. ');
            }).catch(function() {
                logger.error('index specified in reader does not exist')
            })
        }
    });
}

function checkVersion(str) {
    var num = Number(str.replace(/\./g, ''));
    return num >= 210;
}

function parseDate(date) {
    var result;

    if (moment(new Date(date)).isValid()) {
        result = moment(new Date(date));
    }
    else {
        try {
            var ms = parser.parse(date);
            result = moment(date)
        }
        catch (e) {
            throw new Error('elasticsearch_reader start and/or end dates are invalid')
        }
    }

    return result;
}

function getIndexDate(opConfig, client, date, order) {
    //if an actual date is given, no need to query
    if (date) {
        return parseDate(date)
    }
    var sortObj = {};
    var sortOrder = order === 'start' ? 'asc' : 'desc';

    sortObj[opConfig.date_field_name] = {order: sortOrder};

    var query = {
        index: opConfig.index,
        size: 1,
        body: {
            sort: [
                sortObj
            ]
        }
    };

    if (opConfig.query) {
        query.q = opConfig.query;
    }

    return client.search(query).then(function(data) {
        if (order === 'start') {
            return parseDate(data.hits.hits[0]._source[opConfig.date_field_name])
        }
        else {
            //end date is non-inclusive, adding 1s so range will cover it
            var date = data.hits.hits[0]._source[opConfig.date_field_name];
            var time = moment(date).add(1, 's');
            return parseDate(time.format(dateFormat));
        }
    }).catch(function(e) {
        throw new Error('Could not retrieve ' + order + ' date for index: ' + e)
    });

}

function getDates(context, opConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');
    return Promise.resolve(getIndexDate(opConfig, client, opConfig.start, 'start'))
        .then(function(startDate) {
            return Promise.resolve(getIndexDate(opConfig, client, opConfig.end, 'end'))
                .then(function(endDate) {
                    return {start: startDate, limit: endDate};
                });
        });
}

function determineSlice(client, config, dateParams, isExpandedSlice) {
    return client.count({
        index: config.index,
        body: buildRangeQuery(config, {
            start: dateParams.start.format(dateFormat),
            end: dateParams.end.format(dateFormat)
        })
    })
        .then(function(data) {
            if (data.count > dateParams.size) {
                //if size is to big after increasing slice, use alternative division behavior
                if (isExpandedSlice) {
                    //recurse down to the appropriate size
                    var clonedParams = _.assign({}, dateParams);
                    clonedParams.start = moment(dateParams.end).subtract(dateParams.interval[0], dateParams.interval[1]);

                    //get diff from new start
                    var diff = Math.floor(dateParams.end.diff(clonedParams.start) / 2);
                    clonedParams.end = moment(clonedParams.start).add(diff, 'ms');

                    //return the zero range start with the correct end
                    return Promise.resolve(determineSlice(client, config, clonedParams, false))
                        .then(function(recursedData) {
                            return {start: dateParams.start, end: recursedData.end, count: recursedData.count};
                        });
                }
                else {
                    //find difference in milliseconds and divide in half
                    var diff = Math.floor(dateParams.end.diff(dateParams.start) / 2);
                    var newEnd = moment(dateParams.start).add(diff, 'ms');

                    //prevent recursive call if difference is one millisecond
                    if (diff < 2) {
                        return {start: dateParams.start, end: newEnd, count: data.count};
                    }
                    else {
                        //recurse to find smaller chunk
                        dateParams.end = newEnd;
                        return determineSlice(client, config, dateParams, isExpandedSlice)
                    }
                }
            }
            else {
                //interval is only passed in with once mode, expand slice to prevent slices of count 0
                if (data.count === 0 && dateParams.interval) {

                    //if end is same or after limit return limit as end
                    if (dateParams.end.isSameOrAfter(dateParams.limit)) {
                        return {start: dateParams.start, end: dateParams.limit, count: data.count};
                    }
                    else {
                        //increase the slice range to find documents
                        var newEnd = moment(dateParams.end).add(dateParams.interval[0], dateParams.interval[1]);
                        dateParams.end = newEnd;
                        return determineSlice(client, config, dateParams, true)
                    }
                }
                else {
                    return {start: dateParams.start, end: dateParams.end, count: data.count};
                }
            }
        })
        .catch(function(err) {
            console.log('index: "' + config.index + '" does not exist \n', err.stack);

            //TODO flesh this out
            process.exit();
        })
}

function nextChunk(opConfig, client, jobConfig, dates, retryData) {
    var dateParams = {};
    dateParams.size = opConfig.size;
    dateParams.interval = processInterval(opConfig.interval);
    dateParams.start = moment(dates.start);

    if (retryData && retryData.lastSlice && retryData.lastSlice.end) {
        dateParams.start = moment(retryData.lastSlice.end);
    }

    dateParams.limit = moment(dates.end);
    dateParams.end = moment(dateParams.start.format(dateFormat)).add(dateParams.interval[0], dateParams.interval[1]);

    return function(msg) {
        if (dateParams.start.isSameOrAfter(dateParams.limit)) {
            return null;
        }
        else {
            return determineSlice(client, opConfig, dateParams, false)
                .then(function(data) {
                    dateParams.start = data.end;
                    if (moment(data.end).add(dateParams.interval[0], dateParams.interval[1]) > dateParams.limit) {
                        dateParams.end = moment(data.end).add(dateParams.limit - data.end);
                    }
                    else {
                        dateParams.end = moment(data.end).add(dateParams.interval[0], dateParams.interval[1]);
                    }
                    return {
                        start: data.start.format(dateFormat),
                        end: data.end.format(dateFormat),
                        count: data.count
                    }
                }
            );
        }
    };

}

function getMilliseconds(interval) {
    var times = {d: 86400000, h: 3600000, m: 60000, s: 1000, ms: 1};

    return interval[0] * times[interval[1]]
}

function divideRange(start, end, job) {
    var numOfSlicers = job.jobConfig.slicers;
    var results = [];
    var startNum = Number(moment(start).format('x'));
    var endNum = Number(moment(end).format('x'));
    var range = (endNum - startNum) / numOfSlicers;

    var step = moment(start);

    for (var i = 0; i < numOfSlicers; i++) {
        var rangeObj = {start: step.format(dateFormat), end: step.add(range).format(dateFormat)};
        results.push(rangeObj);
    }

    return results;
}

function getTimes(opConfig, jobConfig) {
    var end = processInterval(opConfig.end);
    var delayInterval = processInterval(opConfig.delay);

    var delayTime = getMilliseconds(end);

    var delayedEnd = moment().subtract(delayInterval[0], delayInterval[1]).format(dateFormat);
    var delayedStart = moment(delayedEnd).subtract(end[0], end[1]).format(dateFormat);

    var dateArray = divideRange(delayedStart, delayedEnd, {jobConfig: jobConfig});

    return dateArray.map(function(dates) {
        dates.delayTime = delayTime;
        dates.interval = end;
        return dates;
    });
}

function awaitChunk(opConfig, client, jobConfig, slicerDates) {
    var dateParams = {};
    dateParams.size = opConfig.size;
    dateParams.start = moment(slicerDates.start);
    dateParams.end = moment(slicerDates.end);

    var delayTime = slicerDates.delayTime;
    var startPoint = moment(slicerDates.start);
    var limit = moment(slicerDates.end);
    var interval = slicerDates.interval;
    var dateArray = [];

    //set a timer to add the next set it should process
    setInterval(function() {
        //keep a list of next batches in cases current batch is still running
        dateArray.push({
            startPoint: moment(startPoint).add(interval[0], interval[1]),
            limit: moment(limit).add(interval[0], interval[1])
        });
    }, delayTime);

    return function(msg) {
        if (dateParams.start.isSameOrAfter(limit)) {
            //all done processing current chunk range, check for next range
            if (dateArray.length > 0) {
                var newRange = dateArray.shift();
                startPoint = newRange.startPoint;
                limit = newRange.limit;
                //make separate references to prevent mutating both at same time
                dateParams.start = moment(newRange.startPoint);
                dateParams.end = moment(newRange.limit);
            }
            return null;
        }
        else {
            return determineSlice(client, opConfig, dateParams, false)
                .then(function(data) {
                    dateParams.start = data.end;

                    if (moment(data.end).add(interval[0], interval[1]).isAfter(limit)) {
                        dateParams.end = moment(data.end).add(limit - data.end);

                    }
                    else {
                        dateParams.end = moment(data.end).add(interval[0], interval[1]);
                    }

                    return {start: data.start.format(dateFormat), end: data.end.format(dateFormat), count: data.count}
                }
            );
        }
    };
}

function newSlicer(context, job, retryData) {
    var opConfig = job.readerConfig;
    var jobConfig = job.jobConfig;
    var client = getClient(context, opConfig, 'elasticsearch');
    var isPersistent = jobConfig.lifecycle === 'persistent';
    var slicers = [];

    if (isPersistent) {
        var dataIntervals = getTimes(opConfig, jobConfig);

        dataIntervals.forEach(function(dates) {
            slicers.push(awaitChunk(opConfig, client, jobConfig, dates));
        });

        return Promise.resolve(slicers);
    }
    else {
        return checkElasticsearch(client, opConfig, context.logger)
            .then(function() {
                return getDates(context, opConfig)
            })
            .then(function(esDates) {
                var dateRange = divideRange(esDates.start, esDates.limit, job);

                dateRange.forEach(function(dates, index) {
                    slicers.push(nextChunk(opConfig, client, jobConfig, dates, retryData[index]));
                });

                return slicers;
            })
    }
}


function schema() {
    return {
        index: {
            doc: 'Which index to read from',
            default: '',
            format: 'required_String'

        },
        size: {
            doc: 'The limit to the number of docs pulled in a chunk, if the number of docs retrieved ' +
            'by the interval exceeds this number, it will cause the function to recurse to provide a smaller batch',
            default: 5000,
            format: 'integer'
        },
        start: {
            doc: 'The start date (ISOstring or in ms) to which it will read from ',
            default: null,
            format: 'optional_String'
        },
        end: {
            doc: 'The end date (ISOstring or in ms) to which it will read to',
            default: null,
            format: 'optional_String'
        },
        interval: {
            doc: 'The time interval in which it will read from, the number must be separated from the unit of time ' +
            'by an underscore. The unit of time may be months, weeks, days, hours, minutes, seconds, millesconds ' +
            'or their appropriate abbreviations',
            default: '5m',
            format: String
        },
        full_response: {
            doc: 'Set to true to receive the full Elasticsearch query response including index metadata.',
            default: false,
            format: Boolean
        },
        date_field_name: {
            doc: 'field name where the date of the doc is located',
            default: '',
            format: 'required_String'
        },
        delay: {
            doc: 'used for persistent',
            default: '30s'
        }
    };
}

var parallelSlicers = true;

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema,
    parallelSlicers: parallelSlicers
};
