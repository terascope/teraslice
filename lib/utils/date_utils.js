'use strict';

var moment = require('moment');

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


//"2016-01-19T13:33:09.356-07:00"
var dateFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";

//2016-06-29T12:44:57-07:00
var dateFormatSeconds = "YYYY-MM-DDTHH:mm:ssZ";

function timeseriesIndex(timeseriesFormat, index, dateStr) {
    var timestamp = new Date().toISOString();
    var formatter = {'daily': 10, 'monthly': 7, 'yearly': 4};
    if (!dateStr) {
        dateStr = timestamp;
    }
    return {index: `${index}-${dateStr.slice(0, formatter[timeseriesFormat]).replace(/-/g, '.')}`, timestamp: timestamp}
}

module.exports = {
    dateOptions: dateOptions,
    dateFormat: dateFormat,
    dateFormatSeconds: dateFormatSeconds,
    timeseriesIndex: timeseriesIndex
};