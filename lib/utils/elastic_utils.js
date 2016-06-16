'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var fs = require('fs');
var dataSchema = require('./data_utils');

function dateOptions(value) {
    var timeInterval = value.toLowerCase();
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

    if (options[timeInterval]) {
        return options[timeInterval];
    }
    else {
        throw new Error('date interval is not formatted correctly')
    }
}

function processInterval(str) {
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
        return interval;
    }
    else {
        throw  new Error('elasticsearch_reader interval and/or delay are incorrectly formatted. Needs to follow ' +
            '[number][letter\'s] format, e.g. "12s"')
    }
}

function buildRangeQuery(source, obj) {
    var date_field_name = source.date_field_name;
    var dateObj = {};

    dateObj[date_field_name] = {
        gte: obj.start,
        lt: obj.end
    };

    var body = {
        query: {
            filtered: {
                filter: {
                    range: dateObj
                }
            }
        }
    };

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

function getSchema(config) {

    if (config.json_schema) {
        var firstPath = config.json_schema;
        var nextPath = process.cwd() + '/' + config.json_schema;

        try {
            if (fs.existsSync(firstPath)) {
                return {schema: require(firstPath), isDefault: false};
            }
            else {
                return {schema: require(nextPath), isDefault: false};
            }
        }
        catch (e) {
            throw new Error('Could not retrieve code for: ' + opConfig + '\n' + e);
        }
    }
    else {
        return {schema: dataSchema, isDefault: true};
    }
}

function parsedSchema(opConfig) {
    var results = getSchema(opConfig);
    var schema = results.schema;
    var created = schema.properties.created;

    if (results.isDefault) {
        if (opConfig.format) {
            created.format = opConfig.format;
        }

        if (opConfig.start) {
            created.start = opConfig.start;
        }

        if (opConfig.end) {
            created.end = opConfig.end;
        }
    }

    return schema;
}

function logState(state_store) {
    return function(jobConfig, slice, status, error) {
        if (jobConfig.lifecycle !== "persistent") {
            return state_store.log(jobConfig.job_id, slice, status, error)
                .catch(function(err) {
                    jobConfig.logger.error("Error when saving state record: " + err)
                });
        }
        else {
            return Promise.resolve(true)
        }
    }
}


//"2016-01-19T13:33:09.356-07:00"
var dateFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";

module.exports = {
    dateOptions: dateOptions,
    processInterval: processInterval,
    buildRangeQuery: buildRangeQuery,
    buildQuery: buildQuery,
    getSchema: getSchema,
    parsedSchema: parsedSchema,
    dateFormat: dateFormat,
    logState: logState
};