'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var _ = require('lodash');
var dateOptions = require('./../../utils/elastic_utils').dateOptions;
var dateFormatMS = require('./../../utils/elastic_utils').dateFormat;
var dateFormatS = require('./../../utils/elastic_utils').dateFormatSeconds;
var event = require('../../utils/events');
var elasticError = require('../../utils/error_utils').elasticError;

function newSlicer(context, opConfig, job, retryData, logger, client) {
    var jobConfig = job.jobConfig;
    var isPersistent = jobConfig.lifecycle === 'persistent';
    var slicers = [];
    var numOfRetries = job.max_retries;
    var time_resolution = dateOptions(opConfig.time_resolution);

    var dateFormat = time_resolution === 'ms' ? dateFormatMS : dateFormatS;

    var elasticsearch = require('../../data_sources/elasticsearch')(client, logger, opConfig);

    function checkElasticsearch(client) {
        if (client) {
            return elasticsearch.version()
        }
        else {
            return Promise.reject('no client is available for slicer')
        }
    }

    function processInterval(str, esDates, opConfig) {
        if (!moment(new Date(str)).isValid()) {
            //one or more digits, followed by one or more letters, case-insensitive
            var regex = /(\d+)([a-z]+)/i;
            var interval = regex.exec(str);

            if (interval === null) {
                throw  new Error('elasticsearch_reader interval and/or delay are incorrectly formatted. Needs to follow ' +
                    '[number][letter\'s] format, e.g. "12s"')
            }

            //dont need first parameter, its the full string
            interval.shift();
            interval[1] = dateOptions(interval[1]);

            return compareInterval(interval, esDates, opConfig);
        }
        else {
            throw  new Error('elasticsearch_reader interval and/or delay are incorrectly formatted. Needs to follow ' +
                '[number][letter\'s] format, e.g. "12s"')
        }
    }

    function compareInterval(interval, esDates, opConfig) {
        if (esDates) {
            var datesDiff = esDates.limit.diff(esDates.start);
            var intervalDiff = moment.duration(Number(interval[0]), interval[1]).as('milliseconds');

            if (intervalDiff > datesDiff) {
                if (opConfig.time_resolution === 's') {
                    return [datesDiff / 1000, 's']
                }
                return [datesDiff, 'ms']
            }
        }

        return interval;
    }

    function getIndexDate(opConfig, client, date, order) {

        var sortObj = {};
        var givenDate = null;
        var query = null;

        if (date) {
            givenDate = elasticsearch.parseDate(date);
            query = elasticsearch.buildQuery(opConfig, {count: 1, start: opConfig.start, end: opConfig.end})
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
        return elasticsearch.autoDates(query, givenDate, order, dateFormat);
    }

    function updateJob(opConfig, dates) {
        var update = {};

        if (!opConfig.start) {
            update.start = dates.start;
        }

        if (!opConfig.end) {
            update.end = dates.limit;
        }

        //this sends actual dates to execution context so that it can keep track of them for recoveries
        if (update.hasOwnProperty('start') || update.hasOwnProperty('end')) {
            var operations = JSON.parse(process.env.job).operations;
            operations.shift();
            var updatedOpConfig = Object.assign({}, opConfig, update);
            operations.unshift(updatedOpConfig);

            event.emit('slicer:job:update', {update: operations})
        }
    }

    function getDates(context, opConfig) {
        return Promise.resolve(getIndexDate(opConfig, client, opConfig.start, 'start'))
            .then(function(startDate) {
                return Promise.resolve(getIndexDate(opConfig, client, opConfig.end, 'end'))
                    .then(function(endDate) {
                        var finalDates = {start: startDate, limit: endDate};
                        updateJob(opConfig, finalDates);
                        logger.info(`slicer: ${job.jobConfig.ex_id} start and end times are ${JSON.stringify(finalDates)}`);
                        return finalDates;
                    });
            });
    }

    function splitTime(start, end) {
        var diff = Math.floor(end.diff(start) / 2);

        if (time_resolution === 'ms') {
            return diff;
        }
        else {
            var secondDiff = Math.floor(diff / 1000);
            return secondDiff > 1 ? secondDiff : 1
        }
    }

    function determineSlice(config, dateParams, slicer_id, isExpandedSlice) {
        return getCount(config, dateParams).then(function(count) {
            if (count > dateParams.size) {
                //if size is to big after increasing slice, use alternative division behavior
                if (isExpandedSlice) {
                    //recurse down to the appropriate size
                    var clonedParams = _.assign({}, dateParams);
                    clonedParams.start = moment(dateParams.end).subtract(dateParams.interval[0], dateParams.interval[1]);

                    //get diff from new start
                    var diff = splitTime(clonedParams.start, dateParams.end);
                    clonedParams.end = moment(clonedParams.start).add(diff, time_resolution);

                    //return the zero range start with the correct end
                    return Promise.resolve(determineSlice(config, clonedParams, slicer_id, false))
                        .then(function(recursedData) {
                            return {start: dateParams.start, end: recursedData.end, count: recursedData.count};
                        });
                }
                else {
                    //find difference in milliseconds and divide in half
                    var diff = splitTime(dateParams.start, dateParams.end);
                    var newEnd = moment(dateParams.start).add(diff, time_resolution);

                    //prevent recursive call if difference is one millisecond
                    if (diff <= 1) {
                        return {start: dateParams.start, end: newEnd, count: count};
                    }
                    else {
                        //recurse to find smaller chunk
                        dateParams.end = newEnd;
                        event.emit('slicer:slice:recursion');
                        logger.trace(`slicer: ${slicer_id} is recursing ${JSON.stringify(dateParams)}`);
                        return determineSlice(config, dateParams, slicer_id, isExpandedSlice)
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
                        event.emit('slicer:slice:range_expansion');
                        return determineSlice(config, dateParams, slicer_id, true)
                    }
                }
                else {
                    return {start: dateParams.start, end: dateParams.end, count: count};
                }
            }
        })
            .catch(function(err) {
                var errMessage = elasticError(err);
                logger.error('error with determine slice:', errMessage);
                return Promise.reject(errMessage);
            })
    }

    function getIdData(arr) {
        let list = [];

        return new Promise(function(resolve, reject) {
            arr.then(results => {
                let p = results[0];

                function iterate() {
                    p().then(function(data) {
                        if (data) {
                            list.push(data);
                            iterate();
                        }
                        else {
                            resolve(list)
                        }
                    })
                }

                iterate();
            });
        })
    }

    function makeKeyList(opConfig, data) {
        var idConfig = Object.assign({}, opConfig, {key_depth: 18});

        let idSubslicer = require('../id_slicer')(client, job, idConfig, logger, null, data);
        return getIdData(idSubslicer)
    }

    function retryError(retry, dateObj, err, fn, msg) {
        var errMessage = elasticError(err);
        logger.error('error while getting next slice', errMessage);
        var startKey = dateObj.start.format(dateFormat);

        if (!retry[startKey]) {
            retry[startKey] = 1;
            fn(msg)
        }
        else {
            retry[startKey] += 1;
            if (retry[startKey] > numOfRetries) {
                return Promise.reject(`max_retries met for slice, start: ${startKey}`, errMessage);
            }
            else {
                fn(msg)
            }
        }
    }

    function nextChunk(opConfig, client, jobConfig, dates, slicer_id, retryData) {
        var shouldDivideByID = opConfig.subslice_by_key;
        var threshold = opConfig.subslice_key_threshold;
        var dateParams = {};
        dateParams.size = opConfig.size;
        dateParams.interval = opConfig.interval;
        dateParams.start = moment(dates.start);

        if (retryData && retryData.lastSlice && retryData.lastSlice.end) {
            dateParams.start = moment(retryData.lastSlice.end);
        }

        dateParams.limit = moment(dates.end);
        dateParams.end = moment(dateParams.start.format(dateFormat)).add(dateParams.interval[0], dateParams.interval[1]);
        logger.debug('all date configurations for date slicer', dateParams);
        //used to keep track of retried queries
        var retry = {};

        return function sliceDate(msg) {
            if (dateParams.start.isSameOrAfter(dateParams.limit)) {
                return null;
            }
            else {
                return determineSlice(opConfig, dateParams, slicer_id, false)
                    .then(function(data) {
                        dateParams.start = data.end;

                        if (moment(data.end).add(dateParams.interval[0], dateParams.interval[1]) > dateParams.limit) {
                            dateParams.end = moment(data.end).add(dateParams.limit - data.end);
                        }
                        else {
                            dateParams.end = moment(data.end).add(dateParams.interval[0], dateParams.interval[1]);
                        }

                        if (shouldDivideByID && data.count >= threshold) {
                            logger.debug('date slicer is recursing by keylist');
                            return Promise.resolve(makeKeyList(opConfig, data))
                                .then(function(results) {
                                    return results
                                });
                        }
                        else {
                            return {
                                start: data.start.format(dateFormat),
                                end: data.end.format(dateFormat),
                                count: data.count
                            }
                        }
                    })
                    .catch(function(err) {
                        return retryError(retry, dateParams, err, sliceDate, msg)
                    })
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

        //make sure that end of last segment is always correct
        results[results.length - 1].end = end.format(dateFormat);

        return results;
    }

    function getTimes(opConfig, jobConfig) {
        var end = processInterval(opConfig.interval);
        var delayInterval = processInterval(opConfig.delay);

        var delayTime = getMilliseconds(opConfig, end);

        var delayedEnd = moment().subtract(delayInterval[0], delayInterval[1]).format(dateFormat);
        var delayedStart = moment(delayedEnd).subtract(end[0], end[1]).format(dateFormat);

        var dateArray = divideRange(delayedStart, delayedEnd, {jobConfig: jobConfig});

        return dateArray.map(function(dates) {
            dates.delayTime = delayTime;
            dates.interval = end;
            return dates;
        });
    }

    function awaitChunk(opConfig, client, jobConfig, slicerDates, slicer_id) {
        var shouldDivideByID = opConfig.subslice_by_key;
        var threshold = opConfig.subslice_key_threshold;

        var dateParams = {};
        dateParams.size = opConfig.size;
        dateParams.start = moment(slicerDates.start);
        dateParams.end = moment(slicerDates.end);

        var delayTime = slicerDates.delayTime;
        var startPoint = moment(slicerDates.start);
        var limit = moment(slicerDates.end);
        var interval = slicerDates.interval;
        var dateArray = [];

        logger.debug('all date configurations for date slicer', dateParams);

        //used to keep track of retried queries
        var retry = {};

        //set a timer to add the next set it should process
        setInterval(function() {
            //keep a list of next batches in cases current batch is still running
            dateArray.push({
                startPoint: moment(startPoint).add(interval[0], interval[1]),
                limit: moment(limit).add(interval[0], interval[1])
            });
        }, delayTime);

        return function sliceDate(msg) {
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
                return determineSlice(opConfig, dateParams, slicer_id, false)
                    .then(function(data) {
                            dateParams.start = data.end;

                            if (moment(data.end).add(interval[0], interval[1]).isAfter(limit)) {
                                dateParams.end = moment(data.end).add(limit - data.end);

                            }
                            else {
                                dateParams.end = moment(data.end).add(interval[0], interval[1]);
                            }

                            if (shouldDivideByID && data.count >= threshold) {
                                logger.debug('date slicer is recursing by keylist');
                                return Promise.resolve(makeKeyList(opConfig, data))
                                    .then(function(results) {
                                        return results
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
                            .catch(function(err) {
                                return retryError(retry, dateParams, err, sliceDate, msg)
                            })
                    );
            }
        };
    }

    function getCount(opConfig, dates, key) {
        var end = dates.end ? dates.end : dates.limit;
        var range = {
            start: dates.start.format(dateFormat),
            end: end.format(dateFormat),
            count: 0
        };

        if (key) {
            range.key = key;
        }

        var query = elasticsearch.buildQuery(opConfig, range);

        return elasticsearch.search(query);
    }

    function getInterval(opConfig, esDates) {
        if (opConfig.interval !== 'auto') {
            return Promise.resolve(processInterval(opConfig.interval, esDates, opConfig))
        }
        else {
            return getCount(opConfig, esDates).then(function(count) {
                var numOfSlices = Math.ceil(count / opConfig.size);
                var timeRangeMilliseconds = esDates.limit.diff(esDates.start);
                var millisecondInterval = Math.floor(timeRangeMilliseconds / numOfSlices);

                if (time_resolution === 's') {
                    var seconds = Math.floor(millisecondInterval / 1000);
                    if (seconds < 1) {
                        seconds = 1;
                    }
                    return [seconds, 's'];

                }
                else {
                    return [millisecondInterval, 'ms'];
                }
            });
        }
    }

    if (isPersistent) {
        var dataIntervals = getTimes(opConfig, jobConfig);

        dataIntervals.forEach(function(dates, index) {
            slicers.push(awaitChunk(opConfig, client, jobConfig, dates, index));
        });

        return Promise.resolve(slicers);
    }
    else {
        return checkElasticsearch(client)
            .then(function() {
                return getDates(context, opConfig)
                    .then(function(esDates) {
                        //query with no results
                        if (esDates.start == null) {
                            logger.warn(`No data was found in index: ${opConfig.index} using query: ${opConfig.query}`);
                            //slicer will run and complete when a null is returned
                            return [function() {
                                return null
                            }]
                        }
                        return getInterval(opConfig, esDates)
                            .then(function(interval) {
                                var dateRange = divideRange(esDates.start, esDates.limit, job);
                                //nextChunk pulls config off of opConfig, not jobConfig so jobConfig is not mutated
                                opConfig.interval = interval;

                                dateRange.forEach(function(dates, index) {
                                    slicers.push(nextChunk(opConfig, client, jobConfig, dates, index, retryData[index]));
                                });

                                return slicers;
                            })
                    })
            })

    }
}

module.exports = newSlicer;