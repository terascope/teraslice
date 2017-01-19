'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var dateMath = require('datemath-parser');
var _ = require('lodash');
var processInterval = require('./../../utils/elastic_utils').processInterval;
var buildQuery = require('./../../utils/elastic_utils').buildQuery;
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

    function checkElasticsearch(client, opConfig, logger) {
        if (client) {
            return client.cluster.stats({})
                .then(function(data) {
                    var version = data.nodes.versions[0];

                    if (checkVersion(version)) {
                        return client.indices.getSettings({})
                            .then(function(results) {
                                if (results[opConfig.index]) {
                                    var data = results[opConfig.index].settings.index.max_result_window;
                                    var window = data ? data : 10000;

                                    logger.warn(`max_result_window for index: ${opConfig.index} is set at ${window} . On very large indices it is possible that a slice can not be divided to stay below this limit. If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. Increasing max_result_window in the Elasticsearch index settings will resolve the problem.`);
                                }
                                else {
                                    return Promise.reject('index specified in reader does not exist')
                                }
                            }).catch(function(err) {
                                var errMsg = elasticError(err);
                                logger.error(errMsg);
                                return Promise.reject(errMsg)
                            })
                    }
                });
        }
        else {
            return Promise.reject('no client is available for slicer')
        }
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
            var ms = dateMath.parse(date);
            result = moment(ms)
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
        return client.search(query)
            .then(function(data) {
                if (data.hits.hits.length === 0) {
                    return Promise.reject(`No data found in index ${opConfig.index}, please verify index,check the query parameter and other configurations for elasticsearch_reader`);
                }

                if (data.hits.hits[0] && data.hits.hits[0]._source[opConfig.date_field_name] === undefined) {
                    return Promise.reject(`date_field_name: "${opConfig.date_field_name}" for index: ${opConfig.index} does not exist`);
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
                var errMsg = elasticError(err);
                logger.error(errMsg);
                return Promise.reject(errMsg);
            });

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

    function determineSlice(client, config, dateParams, slicer_id, isExpandedSlice) {
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
                    return Promise.resolve(determineSlice(client, config, clonedParams, slicer_id, false))
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
                        event.emit('slicer recursion');
                        logger.trace(`slicer: ${slicer_id} is recursing ${JSON.stringify(dateParams)}`);
                        return determineSlice(client, config, dateParams, slicer_id, isExpandedSlice)
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
                        return determineSlice(client, config, dateParams, slicer_id, true)
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
                return determineSlice(client, opConfig, dateParams, slicer_id, false)
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
                        var errMessage = elasticError(err);
                        logger.error('error while getting next slice', errMessage);
                        var startKey = dateParams.start.format(dateFormat);

                        if (!retry[startKey]) {
                            retry[startKey] = 1;
                            sliceDate(msg)
                        }
                        else {
                            retry[startKey] += 1;
                            if (retry[startKey] > numOfRetries) {
                                return Promise.reject(`max_retries met for slice, start: ${startKey}`, errMessage);
                            }
                            else {
                                sliceDate(msg)
                            }
                        }
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
                return determineSlice(client, opConfig, dateParams, slicer_id, false)
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
                                var errMessage = elasticError(err);
                                logger.error('error while getting next slice', errMessage);
                                var startKey = data.start.format(dateFormat);

                                if (!retry[startKey]) {
                                    retry[startKey] = 1;
                                    sliceDate(msg)
                                }
                                else {
                                    retry[startKey] += 1;
                                    if (retry[startKey] > numOfRetries) {
                                        return Promise.reject(`max_retries met for slice, start: ${startKey}`, errMessage);
                                    }
                                    else {
                                        sliceDate(msg)
                                    }
                                }
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

        var query = buildQuery(opConfig, range);

        //duplication
        return new Promise(function(resolve, reject) {
            client.search(query)
                .then(function(results) {
                    if (results._shards.failed > 0) {
                        var reasons = _.uniq(_.flatMap(results._shards.failures, function(shard) {
                            return shard.reason.type
                        }));

                        if (reasons.length > 1 || reasons[0] !== 'es_rejected_execution_exception') {
                            var errorReason = reasons.join(' | ');
                            logger.error(`Multiple elasticsearch errors occurred while determining count of slice: ${errorReason}`);
                            reject(errorReason)
                        }
                        else {
                            // Spot to recurse in the future, will reject for now
                            var errorReason = reasons.join(' | ');
                            logger.error(`elasticsearch error occurred while determining count of slice: ${errorReason}`);
                            reject(errorReason)
                        }
                    }
                    else {
                        resolve(results.hits.total)
                    }
                })
                .catch(function(err) {
                    var errMsg = elasticError(err);
                    logger.error(`error while processing count of slice`, errMsg);
                    reject(errMsg)
                });
        })
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
        return checkElasticsearch(client, opConfig, context.logger)
            .then(function() {
                return getDates(context, opConfig)
                    .then(function(esDates) {
                        return getInterval(opConfig, esDates).then(function(interval) {
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