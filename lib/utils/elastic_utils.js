'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var fs = require('fs');
var dataSchema = require('./data_utils');
var _ = require('lodash');
var elasticError = require('./error_utils').elasticError;

function dateOptions(value) {
    var options = {
        year: 'y', years: 'y', 'y': 'y',
        months: 'M', month: 'M', mo: 'M', mos: 'M', M: 'M',
        weeks: 'w', week: 'w', wks: 'w', wk: 'w', w: 'w',
        days: 'd', day: 'd', d: 'd',
        hours: 'h', hour: 'h', hr: 'h', hrs: 'h', h: 'h',
        minutes: 'm', minute: 'm', min: 'm', mins: 'm', m: 'm',
        seconds: 's', second: 's', s: 's',
        milliseconds: 'ms', millisecond: 'ms', ms: 'ms'
    };

    if (options[value]) {
        return options[value];
    }
    else {
        throw new Error('date interval is not formatted correctly')
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

function buildRangeQuery(source, obj) {
    var date_field_name = source.date_field_name;
    var dateObj = {};

    dateObj[date_field_name] = {
        gte: obj.start,
        lt: obj.end
    };

    var body;

    if (obj.key) {
        body = {
            query: {
                bool: {
                    must: [
                        {range: dateObj},
                        {wildcard: {_uid: obj.key}}
                    ]
                }
            }
        }
    }
    else {
        body = {
            query: {
                range: dateObj
            }
        };
    }

    return body;
}

function buildQuery(source, msg) {

    var query = {
        index: source.index,
        size: msg.count,
        body: buildRangeQuery(source, msg)
    };

    if (source.query) {
        query.q = source.query;
    }

    return query;
}

function parsedSchema(opConfig) {
    var schema = false;

    if (opConfig.json_schema) {
        var firstPath = opConfig.json_schema;
        var nextPath = process.cwd() + '/' + opConfig.json_schema;

        try {
            if (fs.existsSync(firstPath)) {
                schema = require(firstPath);
            }
            else {
                schema = require(nextPath);
            }
        }
        catch (e) {
            throw new Error('Could not retrieve code for: ' + opConfig + '\n' + e);
        }
    }
    else {
        return dataSchema(opConfig, schema);
    }
}

function logState(state_store) {
    return function(jobConfig, slice, status, error) {
        if (jobConfig.lifecycle !== "persistent") {
            return state_store.log(jobConfig.ex_id, slice, status, error)
                .then(function(results) {
                    return results
                })
                .catch(function(err) {
                    var errMsg = elasticError(err);
                    jobConfig.logger.error(`Error when saving state record, error: ${errMsg}`);
                    return Promise.reject(errMsg)
                });
        }
        else {
            return Promise.resolve(true)
        }
    }
}

function warn(logger, msg) {
    var loggerFn = _.throttle(function() {
        logger.warn(msg)
    }, 5000);

    return loggerFn;
}

function filterResponse(logger, data, results) {
    var nonRetriableError = false;
    var reason = '';
    var retry = [];
    var items = results.items;

    for (var i = 0; i < items.length; i++) {
        //key could either be create or delete etc, just want the actual data at the value spot
        var item = _.values(items[i])[0];
        if (item.error) {
            if (item.error.type === 'es_rejected_execution_exception') {
                if (i === 0) {
                    retry.push(data[0], data[1])
                }
                else {
                    retry.push(data[i * 2], data[i * 2 + 1])
                }
            }
            else {
                if (item.error.type !== 'document_already_exists_exception' && item.error.type !== 'document_missing_exception') {
                    nonRetriableError = true;
                    reason = `${item.error.type}--${item.error.reason}`;
                    break;
                }
            }
        }
    }

    if (nonRetriableError) {
        return {data: [], error: nonRetriableError, reason: reason};
    }

    return {data: retry, error: false};
}


//"2016-01-19T13:33:09.356-07:00"
var dateFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";

//2016-06-29T12:44:57-07:00
var dateFormatSeconds = "YYYY-MM-DDTHH:mm:ssZ";

module.exports = {
    dateOptions: dateOptions,
    processInterval: processInterval,
    compareInterval: compareInterval,
    buildRangeQuery: buildRangeQuery,
    buildQuery: buildQuery,
    parsedSchema: parsedSchema,
    dateFormat: dateFormat,
    dateFormatSeconds: dateFormatSeconds,
    logState: logState,
    filterResponse: filterResponse,
    warn: warn
};