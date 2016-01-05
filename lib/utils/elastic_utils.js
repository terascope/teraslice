'use strict';

var Promise = require('bluebird');
var moment = require('moment');

function dateOptions(value) {

    var timeInterval = value.toLowerCase();
    var options = {
        months: 'M', month: 'M', mo: 'M', mos: 'M',
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
    var interval = str.split("_");
    interval[1] = dateOptions(interval[1]);
    return interval;
}

function checkVersion(str) {
    var num = Number(str.replace(/\./g, ''));
    return num >= 210;
}

function getTimes(obj) {
    var date = new Date();
    var time = moment(date).seconds(0).millisecond(0).toISOString();
    var startInterval = processInterval(obj.start);
    var endInterval = processInterval(obj.end);

    var start = moment(time).add(startInterval[0], startInterval[1]);
    var end = moment(time).add(endInterval[0], endInterval[1]);

    return {start: start.toISOString(), end: end.toISOString()}
}

function findInterval(obj) {
    var results = [];
    var start = processInterval(obj.start);
    var end = processInterval(obj.end);
    var num = end[0] - start[0];

    //starting point is inclusive so add one
    results.push(num + 1);
    results.push(end[1]);

    return results;
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
            })
        }
    });
}

function determineSlice(client, config, start, end, size) {
    return client.count({
        index: config.index,
        body: buildRangeQuery(config, {start: start.format(), end: end.format()})
    })
        .then(function(data) {
            if (data.count > size) {
                //find difference in milliseconds and divide in half
                var diff = Math.floor(end.diff(start) / 2);
                //must return an over sized chunk if time cannot split
                if (diff === 0) {
                    return {start: start, end: end, count: data.count};
                }
                else {
                    var newEnd = moment(start).add(diff, 'ms');
                    //prevent recursive call if newEnd is same as start
                    if (start.format() === newEnd.format()) {
                        return {start: start, end: end, count: data.count};
                    }
                    else {
                        return determineSlice(client, config, start, newEnd, size)
                    }
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

module.exports = {
    dateOptions: dateOptions,
    processInterval: processInterval,
    checkVersion: checkVersion,
    getTimes: getTimes,
    findInterval: findInterval,
    buildRangeQuery: buildRangeQuery,
    buildQuery: buildQuery,
    checkElasticsearch: checkElasticsearch,
    determineSlice: determineSlice
};