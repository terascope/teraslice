'use strict';

var Promise = require('bluebird');
var moment = require('moment');
var fs = require('fs');
var dataSchema = require('./data_utils');
var parser = require('datemath-parser');

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

function checkVersion(str) {
    var num = Number(str.replace(/\./g, ''));
    return num >= 210;
}

function getTimes(opConfig) {
    var interval = processInterval(opConfig.interval);
    var delayInterval = processInterval(opConfig.delay);
    var delayTime = getDelayTime(interval);

    var delayedStart = moment().subtract(delayInterval[0], delayInterval[1]).format(dateFormat);

    return {
        start: moment(delayedStart),
        end: moment(delayedStart).add(interval[0], interval[1]),
        limit: moment(delayedStart).add(interval[0], interval[1]),
        interval: interval,
        delayTime: delayTime
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

function checkElasticsearch(client, opConfig, logger) {
    client.cluster.stats({}).then(function(data) {
        var version = data.nodes.versions[0];

        if (checkVersion(version)) {
            client.indices.getSettings({}).then(function(results) {
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

function determineSlice(client, config, start, end, size) {
    return client.count({
        index: config.index,
        body: buildRangeQuery(config, {start: start.format(dateFormat), end: end.format(dateFormat)})
    })
        .then(function(data) {
            if (data.count > size) {
                //find difference in milliseconds and divide in half
                var diff = Math.floor(end.diff(start) / 2);
                var newEnd = moment(start).add(diff, 'ms');

                //prevent recursive call if difference is one millisecond
                if (diff < 2) {
                    return {start: start, end: newEnd, count: data.count};
                }
                else {
                    return determineSlice(client, config, start, newEnd, size)
                }

            }
            else {

                return {start: start, end: end, count: data.count};
            }
        })
        .catch(function(e) {
            console.log('index: "' + config.index + '" does not exist \n', e.body);
            process.exit();
        })
}

function recursiveSend(client, dataArray, limit) {
    var fnArray = [];

    while (dataArray.length) {
        var end = dataArray.length > limit ? limit : dataArray.length;
        var data = dataArray.splice(0, end);
        fnArray.push(client.bulk({body: data}))
    }

    return Promise.all(fnArray);
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


function getDates(opConfig) {

    if (!opConfig.start || !opConfig.end) {
        throw  new Error('elasticsearch_reader start and/or end are not set')
    }

    var start = parseDate(opConfig.start);
    var limit = parseDate(opConfig.end);

    return {start: start, limit: limit}
}

function getDelayTime(interval) {
    var times = {d: 86400000, h: 3600000, m: 60000, s: 1000, ms: 1};

    return interval[0] * times[interval[1]]
}
//"2016-01-19T13:33:09.356-07:00"
var dateFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";

module.exports = {
    dateOptions: dateOptions,
    processInterval: processInterval,
    checkVersion: checkVersion,
    getTimes: getTimes,
    buildRangeQuery: buildRangeQuery,
    buildQuery: buildQuery,
    checkElasticsearch: checkElasticsearch,
    determineSlice: determineSlice,
    recursiveSend: recursiveSend,
    getSchema: getSchema,
    parsedSchema: parsedSchema,
    dateFormat: dateFormat,
    getDates: getDates,
    getDelayTime: getDelayTime
};