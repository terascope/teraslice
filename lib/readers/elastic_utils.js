'use strict';

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

module.exports = {
    dateOptions: dateOptions,
    processInterval: processInterval,
    checkVersion: checkVersion,
    getTimes: getTimes,
    findInterval: findInterval,
    buildRangeQuery: buildRangeQuery,
    buildQuery: buildQuery
};