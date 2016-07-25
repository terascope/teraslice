'use strict';

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

function getOpConfig(job, name){
    return job.jobConfig.operations.filter(function(op){
        return op._op === name;
    })[0]
}

function getClient(context, config, type) {
    var clientConfig = {};
    clientConfig.type = type;

    if (config && config.hasOwnProperty('connection')) {
        clientConfig.endpoint = config.connection ? config.connection : 'default';
        clientConfig.cached = config.connection_cache !== undefined ? config.connection_cache : true;

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
    getOpConfig: getOpConfig
};