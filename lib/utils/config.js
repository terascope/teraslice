'use strict';

var moment = require('moment');
var _ = require('lodash');

var emitter = require('./events');

var canShutDown = false;

emitter.on('shutdown', function() {
    canShutDown = true;
});

var argv = require('yargs')
    .alias('j', 'job')
    .alias('r', 'retry')
    .argv;


function compareDates(prev, accum) {
    var firstDate;
    var secondDate;

    if (accum.end) {
        secondDate = new Date(accum.end)
    }

    if (prev.end) {
        firstDate = new Date(prev.end);
    }

    if (secondDate && firstDate) {
        if (secondDate > firstDate) {
            return accum;
        }
        else {
            return prev;
        }
    }

    if (secondDate && !firstDate) {
        return accum;
    }

    if (!secondDate && firstDate) {
        return prev;
    }
}

function getClient(context, opConfig, type) {
    var clientConfig = {};
    clientConfig.type = type;

    if (opConfig.hasOwnProperty('connection')) {
        clientConfig.endpoint = opConfig.connection ? opConfig.connection : 'default';
        clientConfig.cached = opConfig.connection_cache !== undefined ? opConfig.connection_cache : true;

    }
    else {
        clientConfig.endpoint = 'default';
        clientConfig.cached = true;
    }

    return context.foundation.getConnection(clientConfig).client;
}


module.exports = {
    getClient: getClient,
    compareDates: compareDates,
};