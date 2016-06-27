var Promise = require('bluebird');
var moment = require('moment');
var processInterval = require('./../../utils/elastic_utils').processInterval;
var buildQuery = require('./../../utils/elastic_utils').buildQuery;
var buildRangeQuery = require('./../../utils/elastic_utils').buildRangeQuery;
var dateFormat = require('./../../utils/elastic_utils').dateFormat;
var parser = require('datemath-parser');
var _ = require('lodash');
var event = require('../../utils/events');

var base64url = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o,', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '\-', '_'];

function newSlicer(context, job, retryData, client) {
    var opConfig = job.readerConfig;
    var jobConfig = job.jobConfig;
    var isPersistent = jobConfig.lifecycle === 'persistent';
    var slicers = [];

    function checkElasticsearch(client, opConfig, logger) {
        return client.cluster.stats({}).then(function(data) {
            var version = data.nodes.versions[0];

            if (checkVersion(version)) {
                return client.indices.getSettings({}).then(function(results) {

                    var data = results[opConfig.index].settings.index.max_result_window;
                    var window = data ? data : 10000;

                    logger.info(' max_result_window for index: ' + opConfig.index + ' is set at ' + window + '. On very' +
                        ' large indices it is possible that a slice can not be divided to stay below this limit. ' +
                        'If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. ' +
                        'Increasing max_result_window in the Elasticsearch index settings will resolve the problem. ');
                }).catch(function() {
                    throw new Error('index specified in reader does not exist');
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

        var sortObj = {};
        var givenDate = null;
        var query = null;

        if (date) {
            givenDate = parseDate(date);
            query = buildQuery(opConfig, {count: 1, start: opConfig.start, end: opConfig.end})
        }

        else {
            var sortOrder = order === 'start' ? 'asc' : 'desc';

            sortObj[opConfig.date_field_name] = {order: sortOrder};

            query = {
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
        }

        //using this query to catch potential errors even if a date is given already
        return client.search(query).then(function(data) {

            if (data.hits.hits.length === 0) {
                throw new Error('No data found, please check the query parameter, ' +
                    'start/end dates and/or date-field_name in elasticsearch_reader config');
            }

            if (data.hits.hits[0]._source[opConfig.date_field_name] === undefined) {
                throw new Error('date_field_name: "' + opConfig.date_field_name + '" for index: ' +
                    '' + opConfig.index + ' does not exist');
            }

            if (givenDate) {
                return givenDate;
            }

            if (order === 'start') {
                return parseDate(data.hits.hits[0]._source[opConfig.date_field_name])
            }
            else {
                //end date is non-inclusive, adding 1s so range will cover it
                var date = data.hits.hits[0]._source[opConfig.date_field_name];
                var time = moment(date).add(1, 's');
                return parseDate(time.format(dateFormat));
            }
        }).catch(function(err) {
            throw new Error(err.stack);
        });

    }

    function getDates(context, opConfig) {
        return Promise.resolve(getIndexDate(opConfig, client, opConfig.start, 'start'))
            .then(function(startDate) {
                return Promise.resolve(getIndexDate(opConfig, client, opConfig.end, 'end'))
                    .then(function(endDate) {
                        return {start: startDate, limit: endDate};
                    });
            });
    }

    function determineSlice(client, config, dateParams, isExpandedSlice) {
        return getCount(config, dateParams).then(function(count) {

            if (count > dateParams.size) {
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
                        return {start: dateParams.start, end: newEnd, count: count};
                    }
                    else {
                        //recurse to find smaller chunk
                        dateParams.end = newEnd;
                        event.emit('slicer recursion');
                        return determineSlice(client, config, dateParams, isExpandedSlice)
                    }
                }
            }
            else {
                //interval is only passed in with once mode, expand slice to prevent slices of count 0
                if (count === 0 && dateParams.interval) {

                    //if end is same or after limit return limit as end
                    if (dateParams.end.isSameOrAfter(dateParams.limit)) {
                        return {start: dateParams.start, end: dateParams.limit, count: count};
                    }
                    else {
                        //increase the slice range to find documents
                        var newEnd = moment(dateParams.end).add(dateParams.interval[0], dateParams.interval[1]);
                        dateParams.end = newEnd;
                        event.emit('zero slice reduction');
                        return determineSlice(client, config, dateParams, true)
                    }
                }
                else {
                    return {start: dateParams.start, end: dateParams.end, count: count};
                }
            }
        })
            .catch(function(err) {
                console.log('index: "' + config.index + '" does not exist \n', err.stack);

                //TODO flesh this out
                //process.exit();
            })
    }

    function nextChunk(opConfig, client, jobConfig, dates, retryData) {
        var multiplier = opConfig.subslice_key_multiplier;
        var dateParams = {};
        dateParams.size = opConfig.size;
        dateParams.interval = opConfig.interval;
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

                            if (data.count >= 100000 /*&& data.count >= opConfig.size * multiplier*/) {
                                return _.map(base64url, function(key) {
                                    return {
                                        start: data.start.format(dateFormat),
                                        end: data.end.format(dateFormat),
                                        count: data.count,
                                        key: opConfig.type + '#' + key + '*'
                                    }
                                })
                            }
                            else {
                                return {
                                    start: data.start.format(dateFormat),
                                    end: data.end.format(dateFormat),
                                    count: data.count
                                }
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
        var end = processInterval(opConfig.interval);
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
        var multiplier = opConfig.subslice_key_multiplier;
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

                            if (data.count >= 100000 && data.count >= opConfig.size * multiplier) {
                                return _.map(base64url, function(key) {
                                    return {
                                        start: data.start.format(dateFormat),
                                        end: data.end.format(dateFormat),
                                        count: data.count,
                                        key: key
                                    }
                                })
                            }
                            else {
                                return {
                                    start: data.start.format(dateFormat),
                                    end: data.end.format(dateFormat),
                                    count: data.count
                                }
                            }
                        }
                    );
            }
        };
    }

    function getCount(opConfig, dates) {
        var end = dates.end ? dates.end : dates.limit;
        var query = {
            index: opConfig.index,
            body: buildRangeQuery(opConfig, {
                start: dates.start.format(dateFormat),
                end: end.format(dateFormat)
            })
        };

        if (opConfig.query) {
            query.q = opConfig.query;
        }

        return client.count(query).then(function(data) {
            return data.count;
        })
    }

    function getInterval(opConfig, esDates) {
        if (opConfig.interval !== 'auto') {
            return Promise.resolve(processInterval(opConfig.interval))
        }
        else {
            return getCount(opConfig, esDates).then(function(count) {
                var numOfSlices = Math.ceil(count / opConfig.size);
                var timeRangeMilliseconds = esDates.limit.diff(esDates.start);
                var millisecondInterval = Math.floor(timeRangeMilliseconds / numOfSlices);

                return [millisecondInterval, 'ms'];
            });
        }
    }

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
                    .then(function(esDates) {
                        return getInterval(opConfig, esDates).then(function(interval) {
                            var dateRange = divideRange(esDates.start, esDates.limit, job);
                            //nextChunk pulls config off of opConfig, not jobConfig so jobConfig is not mutated
                            opConfig.interval = interval;

                            dateRange.forEach(function(dates, index) {
                                slicers.push(nextChunk(opConfig, client, jobConfig, dates, retryData[index]));
                            });

                            return slicers;
                        })
                    })
            })

    }
}

module.exports = newSlicer;