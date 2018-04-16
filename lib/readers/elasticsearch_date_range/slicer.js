'use strict';

const Promise = require('bluebird');
const moment = require('moment');
const _ = require('lodash');
const dateMath = require('datemath-parser');
const dateOptions = require('./../../utils/date_utils').dateOptions;
const dateFormatMS = require('./../../utils/date_utils').dateFormat;
const dateFormatS = require('./../../utils/date_utils').dateFormatSeconds;
const parseError = require('error_parser');
const retryModule = require('../../utils/error_utils').retryModule;

function newSlicer(context, opConfig, executionContext, retryData, logger, client) {
    const events = context.apis.foundation.getSystemEvents();
    const executionConfig = executionContext.config;
    const isPersistent = executionConfig.lifecycle === 'persistent';
    const slicers = [];
    const timeResolution = dateOptions(opConfig.time_resolution);
    const retryError = retryModule(logger, executionConfig.max_retries);
    const dateFormat = timeResolution === 'ms' ? dateFormatMS : dateFormatS;

    const elasticsearch = require('elasticsearch_api')(client, logger, opConfig);

    function checkElasticsearch(esClient) {
        if (esClient) {
            // regex searches for zero or more chars preceding a '*' , zero or more chars after
            // before a ':' then any amount of chars before and after another '*'
            // =>  ie  es_d*:2017-domains*
            const wildCardRegex = RegExp(/\*/g);
            const isWildCardRegexSearch = opConfig.index.match(wildCardRegex);
            // We cannot reliable search
            if (isWildCardRegexSearch !== null) {
                logger.warn(`Running a regex or cross cluster search for ${opConfig.index}, there is no reliable way to verify index and max_result_window`);
                return Promise.resolve(true);
            }
            return elasticsearch.version();
        }

        return Promise.reject('no client is available for slicer');
    }

    function processInterval(str, esDates) {
        if (!moment(new Date(str)).isValid()) {
            // one or more digits, followed by one or more letters, case-insensitive
            const regex = /(\d+)(\D+)/i;
            const interval = regex.exec(str);

            if (interval === null) {
                throw new Error('elasticsearch_reader interval and/or delay are incorrectly formatted. Needs to follow ' +
                    '[number][letter\'s] format, e.g. "12s"');
            }

            // dont need first parameter, its the full string
            interval.shift();
            interval[1] = dateOptions(interval[1]);
            return compareInterval(interval, esDates);
        }

        throw new Error('elasticsearch_reader interval and/or delay are incorrectly formatted. Needs to follow ' +
                '[number][letter\'s] format, e.g. "12s"');
    }

    function compareInterval(interval, esDates) {
        if (esDates) {
            const datesDiff = esDates.limit.diff(esDates.start);
            const intervalDiff = moment.duration(Number(interval[0]), interval[1]).as('milliseconds');

            if (intervalDiff > datesDiff) {
                if (opConfig.time_resolution === 's') {
                    return [Math.ceil(datesDiff / 1000), 's'];
                }
                return [datesDiff, 'ms'];
            }
        }

        return interval;
    }

    function _parseDate(date) {
        let result;

        if (moment(new Date(date)).isValid()) {
            result = moment(new Date(date));
        } else {
            const ms = dateMath.parse(date);
            result = moment(ms);
        }

        return result;
    }

    function getIndexDate(date, order) {
        const sortObj = {};
        let givenDate = null;
        let query = null;

        if (date) {
            givenDate = _parseDate(date);
            query = elasticsearch.buildQuery(
                opConfig,
                { count: 1, start: opConfig.start, end: opConfig.end }
            );
        } else {
            const sortOrder = order === 'start' ? 'asc' : 'desc';

            sortObj[opConfig.date_field_name] = { order: sortOrder };

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

        // using this query to catch potential errors even if a date is given already
        return elasticsearch.search(query)
            .then((results) => {
                const data = _.get(results, 'hits.hits[0]._source', results[0]);
                if (data === undefined) {
                    return Promise.reject(`could not parse date ranges for index: ${opConfig.index}, please verify either the date_field_name or the connection specified on the job`);
                }

                if (data[opConfig.date_field_name] === undefined) {
                    return Promise.reject(`date_field_name: "${opConfig.date_field_name}" for index: ${opConfig.index} does not exist, data: ${JSON.stringify(data)}, results: ${JSON.stringify(results)}`);
                }

                if (givenDate) {
                    return givenDate;
                }

                if (order === 'start') {
                    return _parseDate(data[opConfig.date_field_name]);
                }

                // end date is non-inclusive, adding 1s so range will cover it
                const newDate = data[opConfig.date_field_name];
                const time = moment(newDate).add(1, timeResolution);
                return _parseDate(time.format(dateFormat));
            });
    }

    function updateJob(dates) {
        // this sends actual dates to execution context so that it can keep
        // track of them for recoveries
        if (!opConfig.start || !opConfig.end) {
            const operations = JSON.parse(process.env.job).operations;
            operations.shift();
            const update = {
                start: dates.start.format(dateFormat),
                end: dates.limit.format(dateFormat)
            };
            const updatedOpConfig = Object.assign({}, opConfig, update);

            operations.unshift(updatedOpConfig);
            events.emit('slicer:execution:update', { update: operations });
        }
    }

    function getDates() {
        return Promise.resolve(getIndexDate(opConfig.start, 'start'))
            .then(startDate => Promise.resolve(getIndexDate(opConfig.end, 'end'))
                .then((endDate) => {
                    const finalDates = { start: startDate, limit: endDate };
                    logger.info(`slicer: ${executionConfig.ex_id} start and end times are ${JSON.stringify(finalDates)}`);
                    return finalDates;
                }));
    }

    function splitTime(start, end, limit) {
        let diff = Math.floor(end.diff(start) / 2);

        if (moment(start).add(diff, 'ms').isAfter(limit)) {
            diff = moment(limit).diff(start);
        }

        if (timeResolution === 'ms') {
            return diff;
        }

        const secondDiff = Math.floor(diff / 1000);
        return secondDiff;
    }

    function determineSlice(dateParams, slicerId, isExpandedSlice) {
        return getCount(dateParams)
            .then((count) => {
                const intervalNum = dateParams.interval[0];
                const intervalUnit = dateParams.interval[1];
                if (count > dateParams.size) {
                    // if size is to big after increasing slice, use alternative division behavior
                    if (isExpandedSlice) {
                    // recurse down to the appropriate size
                        const cloneDates = {
                            interval: dateParams.interval,
                            limit: dateParams.limit
                        };
                        const newStart = moment(dateParams.end).subtract(intervalNum, intervalUnit);
                        cloneDates.start = newStart;

                        // get diff from new start
                        const diff = splitTime(cloneDates.start, dateParams.end, dateParams.limit);
                        cloneDates.end = moment(cloneDates.start).add(diff, timeResolution);
                        // return the zero range start with the correct end

                        return Promise.resolve(determineSlice(cloneDates, slicerId, false))
                            .then(recursedData => ({
                                start: dateParams.start,
                                end: recursedData.end,
                                count: recursedData.count
                            }));
                    }

                    // find difference in milliseconds and divide in half
                    const diff = splitTime(dateParams.start, dateParams.end, dateParams.limit);
                    const newEnd = moment(dateParams.start).add(diff, timeResolution);

                    // prevent recursive call if difference is one millisecond
                    if (diff <= 0) {
                        return { start: dateParams.start, end: dateParams.end, count };
                    }

                    // recurse to find smaller chunk
                    dateParams.end = newEnd;
                    events.emit('slicer:slice:recursion');
                    logger.trace(`slicer: ${slicerId} is recursing ${JSON.stringify(dateParams)}`);

                    return determineSlice(dateParams, slicerId, isExpandedSlice);
                }

                // interval is only passed in with once mode, it will expand slices to prevent
                // counts of 0
                if (count === 0 && dateParams.interval) {
                    // increase the slice range to find documents
                    const newEnd = moment(dateParams.end).add(intervalNum, intervalUnit);
                    if (newEnd.isSameOrAfter(dateParams.limit)) {
                        const diff = splitTime(dateParams.start, dateParams.end, dateParams.limit);
                        const newSplitEnd = moment(dateParams.start).add(diff, timeResolution);
                        dateParams.end = newSplitEnd;
                    } else {
                        dateParams.end = newEnd;
                    }
                    events.emit('slicer:slice:range_expansion');
                    return determineSlice(dateParams, slicerId, true);
                }

                return { start: dateParams.start, end: dateParams.end, count };
            })
            .catch((err) => {
                const errMessage = parseError(err);
                logger.error('error with determine slice:', errMessage);
                return Promise.reject(errMessage);
            });
    }

    function getIdData(promiseOfSlicerArray) {
        const list = [];

        return new Promise(((resolve, reject) => {
            promiseOfSlicerArray.then((slicerArray) => {
                const slicer = slicerArray[0];
                function iterate() {
                    Promise.resolve(slicer())
                        .then((data) => {
                            if (data) {
                                list.push(_.cloneDeep(data));
                                return iterate();
                            }

                            resolve(list);
                        })
                        .catch((err) => {
                            // retries happen at the idSlicer level
                            const errMessage = parseError(err);
                            logger.error('error trying to subslice by key on getIdData:', errMessage);
                            reject(errMessage);
                        });
                }

                iterate();
            });
        }));
    }


    function makeKeyList(data) {
        const idConfig = Object.assign({}, opConfig, { starting_key_depth: 0 });
        const idSlicer = require('../id_slicer')(context, client, executionContext, idConfig, logger, null, data);
        return getIdData(idSlicer);
    }

    function nextChunk(dates, slicerId, retryDataObj) {
        const shouldDivideByID = opConfig.subslice_by_key;
        const threshold = opConfig.subslice_key_threshold;
        const intervalNum = opConfig.interval[0];
        const intervalUnit = opConfig.interval[1];
        const dateParams = {};

        dateParams.size = opConfig.size;
        dateParams.interval = opConfig.interval;
        dateParams.start = moment(dates.start);

        if (retryDataObj && retryDataObj.lastSlice && retryDataObj.lastSlice.end) {
            dateParams.start = moment(retryDataObj.lastSlice.end);
        }

        dateParams.limit = moment(dates.end);
        dateParams.end = moment(dateParams.start.format(dateFormat)).add(intervalNum, intervalUnit);
        logger.debug('all date configurations for date slicer', dateParams);
        // used to keep track of retried queries

        return function sliceDate(msg) {
            if (dateParams.start.isSameOrAfter(dateParams.limit)) {
                return null;
            }

            return determineSlice(dateParams, slicerId, false)
                .then((data) => {
                    dateParams.start = data.end;

                    if (moment(data.end).add(intervalNum, intervalUnit) > dateParams.limit) {
                        dateParams.end = moment(data.end).add(dateParams.limit - data.end);
                    } else {
                        dateParams.end = moment(data.end).add(intervalNum, intervalUnit);
                    }

                    if (shouldDivideByID && data.count >= threshold) {
                        logger.debug('date slicer is recursing by keylist');
                        return Promise.resolve(makeKeyList(data))
                            .then(results => results)
                            .catch((err) => {
                                const errMsg = parseError(err);
                                logger.error('error while subslicing by key', errMsg);
                                return Promise.reject(errMsg);
                            });
                    }

                    return {
                        start: data.start.format(dateFormat),
                        end: data.end.format(dateFormat),
                        count: data.count
                    };
                })
                .catch(err => retryError(dateParams.start.format(dateFormat), err, sliceDate, msg));
        };
    }

    function getMilliseconds(interval) {
        const times = { d: 86400000, h: 3600000, m: 60000, s: 1000, ms: 1 };

        return interval[0] * times[interval[1]];
    }

    function divideRange(start, end) {
        const numOfSlicers = executionConfig.slicers;
        const results = [];
        const startNum = Number(moment(start).format('x'));
        const endNum = Number(moment(end).format('x'));
        const range = (endNum - startNum) / numOfSlicers;

        const step = moment(start);

        for (let i = 0; i < numOfSlicers; i += 1) {
            const rangeObj = {
                start: step.format(dateFormat),
                end: step.add(range).format(dateFormat)
            };
            results.push(rangeObj);
        }

        // make sure that end of last segment is always correct
        const endingDate = end.format ? end.format(dateFormat) : moment(end).format(dateFormat);
        results[results.length - 1].end = endingDate;

        return results;
    }

    function getTimes() {
        const end = processInterval(opConfig.interval);
        const delayInterval = processInterval(opConfig.delay);
        const delayTime = getMilliseconds(end);
        const delayedEnd = moment().subtract(delayInterval[0], delayInterval[1]).format(dateFormat);
        const delayedStart = moment(delayedEnd).subtract(end[0], end[1]).format(dateFormat);
        const dateArray = divideRange(delayedStart, delayedEnd, { executionConfig });

        return dateArray.map((dates) => {
            dates.delayTime = delayTime;
            dates.interval = end;
            return dates;
        });
    }

    function awaitChunk(slicerDates, slicerId) {
        const shouldDivideByID = opConfig.subslice_by_key;
        const threshold = opConfig.subslice_key_threshold;

        const dateParams = {};
        dateParams.size = opConfig.size;
        dateParams.start = moment(slicerDates.start);
        dateParams.end = moment(slicerDates.end);

        const delayTime = slicerDates.delayTime;
        let startPoint = moment(slicerDates.start);
        let limit = moment(slicerDates.end);
        const interval = slicerDates.interval;
        const dateArray = [];

        logger.debug('all date configurations for date slicer', dateParams);

        // set a timer to add the next set it should process
        setInterval(() => {
            // keep a list of next batches in cases current batch is still running
            dateArray.push({
                startPoint: moment(startPoint).add(interval[0], interval[1]),
                limit: moment(limit).add(interval[0], interval[1])
            });
        }, delayTime);

        return function sliceDate(msg) {
            if (dateParams.start.isSameOrAfter(limit)) {
                // all done processing current chunk range, check for next range
                if (dateArray.length > 0) {
                    const newRange = dateArray.shift();
                    startPoint = newRange.startPoint;
                    limit = newRange.limit;
                    // make separate references to prevent mutating both at same time
                    dateParams.start = moment(newRange.startPoint);
                    dateParams.end = moment(newRange.limit);
                }
                return null;
            }

            return determineSlice(dateParams, slicerId, false)
                .then((data) => {
                    dateParams.start = data.end;

                    if (moment(data.end).add(interval[0], interval[1]).isAfter(limit)) {
                        dateParams.end = moment(data.end).add(limit - data.end);
                    } else {
                        dateParams.end = moment(data.end).add(interval[0], interval[1]);
                    }

                    if (shouldDivideByID && data.count >= threshold) {
                        logger.debug('date slicer is recursing by keylist');
                        return Promise.resolve(makeKeyList(data))
                            .then(results => results)
                            .catch((err) => {
                                const errMsg = parseError(err);
                                logger.error('error while subslicing by key', errMsg);
                                return Promise.reject(errMsg);
                            });
                    }

                    return {
                        start: data.start.format(dateFormat),
                        end: data.end.format(dateFormat),
                        count: data.count
                    };
                })
                .catch(err => retryError(dateParams.start.format(dateFormat), err, sliceDate, msg));
        };
    }

    function getCount(dates, key) {
        const end = dates.end ? dates.end : dates.limit;
        const range = {
            start: dates.start.format(dateFormat),
            end: end.format(dateFormat)
        };

        if (key) {
            range.key = key;
        }

        const query = elasticsearch.buildQuery(opConfig, range);

        return elasticsearch.count(query);
    }

    function getInterval(esDates) {
        if (opConfig.interval !== 'auto') {
            return Promise.resolve(processInterval(opConfig.interval, esDates));
        }

        return getCount(esDates)
            .then((count) => {
                const numOfSlices = Math.ceil(count / opConfig.size);
                const timeRangeMilliseconds = esDates.limit.diff(esDates.start);
                const millisecondInterval = Math.floor(timeRangeMilliseconds / numOfSlices);

                if (timeResolution === 's') {
                    let seconds = Math.floor(millisecondInterval / 1000);
                    if (seconds < 1) {
                        seconds = 1;
                    }
                    return [seconds, 's'];
                }

                return [millisecondInterval, 'ms'];
            });
    }

    if (isPersistent) {
        const dataIntervals = getTimes();

        dataIntervals.forEach((dates, index) => {
            slicers.push(awaitChunk(dates, index));
        });

        return Promise.resolve(slicers);
    }

    return checkElasticsearch(client)
        .then(() => getDates()
            .then((esDates) => {
                // query with no results
                if (esDates.start == null) {
                    logger.warn(`No data was found in index: ${opConfig.index} using query: ${opConfig.query}`);
                    // slicer will run and complete when a null is returned
                    return [function () {
                        return null;
                    }];
                }
                return getInterval(esDates)
                    .then((interval) => {
                        // TODO: the interval should be updated to the ex
                        const dateRange = divideRange(esDates.start, esDates.limit);
                        // nextChunk pulls config off of opConfig, not executionConfig so
                        // executionConfig is not mutated
                        opConfig.interval = interval;
                        updateJob(esDates);
                        dateRange.forEach((dates, index) => {
                            slicers.push(nextChunk(dates, index, retryData[index]));
                        });

                        return slicers;
                    });
            }));
}

module.exports = newSlicer;
