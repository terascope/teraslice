'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var fs = require('fs');
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
    dateFormat: dateFormat,
    dateFormatSeconds: dateFormatSeconds,
    logState: logState,
    filterResponse: filterResponse,
    warn: warn
};