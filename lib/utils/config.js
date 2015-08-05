'use strict';

//TODO need to validate config & vary config by system
function processConfig(jobs) {
    var sourcePath = jobs[0].source;
    var sourceSystem = sourcePath.system;
    var destinationSystem = jobs[0].destination.system;
    var source = './utils/' + sourceSystem;
    var destination = './utils/' + destinationSystem;

    return {
        sourceCode: source,
        destinationCode: destination,
        source: jobs[0].source,
        destination: jobs[0].destination
    };

}

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

function getClient(str, context) {
    var client;
    try {
        client = context[str].default;
    }
    catch(e){
        client = null;
    }
    return client
}

module.exports = {
    processConfig: processConfig,
    getClient: getClient,
    processInterval: processInterval,
    dateOptions: dateOptions
};