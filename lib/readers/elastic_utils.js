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

module.exports = {
    dateOptions: dateOptions,
    processInterval: processInterval
};