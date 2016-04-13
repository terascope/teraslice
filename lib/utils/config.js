'use strict';

var moment = require('moment');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var Queue = require('./queue');
var emitter = require('./events');

var jobSchema = require('../config/schemas/job').jobSchema;
var analyzeStats = require('./analytics').analyzeStats;
var walk = require('./file_utils').walk;

var canShutDown = false;

emitter.on('shutdown', function() {
    canShutDown = true;
});

var argv = require('yargs')
    .alias('j', 'job')
    .alias('r', 'retry')
    .argv;

function findLogFile(context, id) {
    var path = context.sysconfig.terafoundation.log_path;
    var bool = false;

    if (path.charAt[path.length - 1] !== '/') {
        path += '/';
    }

    walk(path, function(filePath, rootDir, filename) {
        if (filename.match(id)) {
            bool = true;
        }
    });

    return bool;
}

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

function validateNumOfWorkers(context) {
    var job = validateOperation(context, jobSchema, getJob(process.env.job), false);
    var logger = context.logger;
    var sysWorkers = context.sysconfig.terafoundation.workers;

    if (job.workers > sysWorkers) {
        logger.warn(' The number of workers specified on the job ( ' + job.workers + ' ) is higher than what has ' +
            'been allocated in the config file at terafoundation.workers ( ' + sysWorkers + ' ). The job will run ' +
            'using ' + sysWorkers + 'workers. If ' + job.workers + ' are required adjust the value set for ' +
            'terafoundation.workers in the system configuration. ');
        return sysWorkers
    }

    return job.workers;
}

function sendProcessMessage(cluster, id, message) {

    if (cluster.workers[id].state !== 'disconnected') {
        cluster.workers[id].send(message);
    }
    else {
        return;
    }
}

module.exports = {
    getClient: getClient,
    validateNumOfWorkers: validateNumOfWorkers,
    compareDates: compareDates,
    sendProcessMessage: sendProcessMessage
};