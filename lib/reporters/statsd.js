'use strict';

var analytics = require('../utils/analytics');

function nameFormat(str) {
    var name = str.trim();

    return name.replace(' ', '_');
}

module.exports = function(context, jobConfig, data) {
    var statsd = context.foundation.getConnection({type: 'statsd', cached: true}).client;
    var name = 'teraslice.' + nameFormat(jobConfig.name);
    var _in = '.processed.in';
    var _out = '.processed.out';
    var _time = '.processed.time';
    var length = jobConfig.operations.length;
    var totalTime = data.time.reduce(function(prev, current) {
        return prev + current;
    }, 0);

    //job level stats
    statsd.increment(name + _time, totalTime);
    statsd.increment(name + _in, data.size[0]);

    //
    statsd.increment(name + _out, data.size[data.size.length - 1]);

    jobConfig.operations.forEach(function(config, i) {
        var opName = '.' + nameFormat(config._op);

        statsd.increment(name + opName + _time, data.time[i]);

        if (i !== 0) {
            statsd.increment(name + opName + _in, data.size[i - 1]);
        }

        if (i !== length - 1) {
            statsd.increment(name + opName + _out, data.size[i]);
        }
    });

};