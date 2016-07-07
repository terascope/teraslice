var Promise = require('bluebird');
var moment = require('moment');
var parser = require('datemath-parser');
var _ = require('lodash');
var processInterval = require('./../../utils/elastic_utils').processInterval;
var buildQuery = require('./../../utils/elastic_utils').buildQuery;
var buildRangeQuery = require('./../../utils/elastic_utils').buildRangeQuery;
var dateOptions = require('./../../utils/elastic_utils').dateOptions;
var dateFormatMS = require('./../../utils/elastic_utils').dateFormat;
var dateFormatS = require('./../../utils/elastic_utils').dateFormatSeconds;
var getKeyArray = require('../../utils/id_utils').getKeyArray;
var swapLastTwo = require('../../utils/id_utils').swapLastTwo;
var transformIds = require('../../utils/id_utils').transformIds;
var event = require('../../utils/events');


function newSlicer(context, job, retryData, client) {
    var opConfig = job.readerConfig;
    var jobConfig = job.jobConfig;
    var isPersistent = jobConfig.lifecycle === 'persistent';
    var slicers = [];
    var logger = job.jobConfig.logger;

    var time_resolution = dateOptions(opConfig.time_resolution);

    var dateFormat = time_resolution === 'ms' ? dateFormatMS : dateFormatS;

    function checkElasticsearch(client, opConfig, logger) {
        return client.cluster.stats({})
            .then(function(data) {
                var version = data.nodes.versions[0];

                if (checkVersion(version)) {
                    return client.indices.getSettings({}).then(function(results) {

                        var data = results[opConfig.index].settings.index.max_result_window;
                        var window = data ? data : 10000;

                        logger.info(` max_result_window for index: ${opConfig.index} is set at ${window} . On very
                             large indices it is possible that a slice can not be divided to stay below this limit. 
                            If that occurs an error will be thrown by Elasticsearch and the slice can not be processed. 
                            Increasing max_result_window in the Elasticsearch index settings will resolve the problem. `);
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
                        var finalDates = {start: startDate, limit: endDate};
                        logger.info(`slicer: ${job.jobConfig.job_id} start and end times are ${JSON.stringify(finalDates)}`)
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

    function determineSlice(client, config, dateParams, isExpandedSlice) {
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
                    return Promise.resolve(determineSlice(client, config, clonedParams, false))
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
                        logger.info(`slicer is recursing ${JSON.stringify(dateParams)}`);
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

    function makeKeyList(opConfig, data) {
        var multiplier = opConfig.subslice_key_multiplier;
        var results = [];
        var keyArray = getKeyArray(opConfig);
        var transformedKeyArray = transformIds(opConfig, keyArray);

        function recurse(arr) {
            return Promise.all(arr.map(function(key) {
                    return getCount(opConfig, data, key)
                        .then(function(count) {
                            if (count >= opConfig.size * multiplier) {
                                return recurse(keyArray.map(function(str) {
                                    return swapLastTwo(key + str)
                                }))
                            }
                            else {
                                if (count !== 0) {
                                    results.push({
                                        start: data.start.format(dateFormat),
                                        end: data.end.format(dateFormat),
                                        count: count,
                                        key: key
                                    });
                                }
                            }
                        })
                })
            );
        }

        return recurse(transformedKeyArray)
            .then(function() {
                return results;
            });
    }

    function nextChunk(opConfig, client, jobConfig, dates, retryData) {
        var multiplier = opConfig.subslice_key_multiplier;
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

                            if (data.count >= threshold && data.count >= opConfig.size * multiplier) {
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

        //make sure that end of last segment is always correct
        results[results.length - 1].end = end;

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

    function awaitChunk(opConfig, client, jobConfig, slicerDates) {
        var multiplier = opConfig.subslice_key_multiplier;
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

                            if (data.count >= threshold && data.count >= opConfig.size * multiplier) {
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
                    );
            }
        };
    }

    function getCount(opConfig, dates, key) {
        var end = dates.end ? dates.end : dates.limit;
        var range = {
            start: dates.start.format(dateFormat),
            end: end.format(dateFormat)
        };

        if (key) {
            range.key = key;
        }

        var query = {
            index: opConfig.index,
            body: buildRangeQuery(opConfig, range),
            size: 0
        };


        if (opConfig.query) {
            query.q = opConfig.query;
        }
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
                            logger.error(errorReason);
                            reject(errorReason)
                        }
                        else {
                            // Spot to recurse in the future, will reject for now
                            var errorReason = reasons.join(' | ');
                            logger.error(errorReason);
                            reject(errorReason)
                        }
                    }
                    else {
                        resolve(results.hits.total)
                    }
                })
                .catch(function(err) {
                    var errMsg = JSON.stringify(err);
                    logger.error(errMsg);
                    reject(errMsg)
                });
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