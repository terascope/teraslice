'use strict';
var insertAnalyzers = require('./analytics').insertAnalyzers;
var workerCount = require('os').cpus().length;
var processDone = 0;
var moment = require('moment');
var fs = require('fs');

var _context;

var argv = require('yargs')
    .alias('j', 'job')
    .argv;

function getJob() {
    var jobFile;
    jobFile = process.cwd() + '/job.json';

    if (argv.job) {
        jobFile = argv.job;
    }

    if (jobFile.indexOf('.') === 0) {
        jobFile = process.cwd() + '/' + jobFile;
    }

    if (!fs.existsSync(jobFile)) {
        throw new Error("Could not find a usable job.json at path: " + jobFile);
    }
     return require(jobFile);
}

function initializeJob(context) {
    _context = context;

    var job = getJob();

    var scheduler = lifecycle(job);

    var jobQueue = job.process.slice();
    var readerConfig = jobQueue.shift();
    var senderConfig = jobQueue.pop();

    var reader = require('../readers/' + readerConfig.op);
    var sender = require('../senders/' + senderConfig.op);
    var processors = jobQueue.map(function(job) {
        return require('../processors/' + job.op)
    });

    var queue = [];
    queue.push(reader.newReader(context, readerConfig, job));

    //using mutated jobQueue to provide opConfig
    processors.forEach(function(job, i) {
        queue.push(job.newProcessor(context, jobQueue[i], job))
    });
    queue.push(sender.newSender(context, senderConfig, job));

    if (job.analytics) {
        queue = insertAnalyzers(queue);
    }

    return {
        analytics: job.analytics,
        reader: reader,
        sender: sender,
        processors: processors,
        jobs: job.process,
        queue: queue,
        readerConfig: readerConfig,
        scheduler: scheduler

    };
}

function sendMessage(id, message) {
    _context.cluster.workers[id].send(message);
}


function lifecycle(job) {
    if (job.lifecycle === 'once') {
        return once;
    }
    if (job.lifecycle === 'periodic') {
        return periodic;
    }
    if (job.lifecycle === 'persistent') {
        return persistent;
    }
}

function periodic(msg) {

}

function persistent(reader, start) {
    var nextSlice = reader;
    var start = start;
    var logger = _context.logger;

    return function(msg) {
        if (msg.message === 'ready') {
            Promise.resolve(nextSlice(msg))
                .then(function(data) {
                    //not null or undefined
                    if (data != null) {
                        sendMessage(msg.id, {message: 'data', data: data})
                    }

                })

        }
    }
}


function once(reader, start) {
    var nextSlice = reader;
    var start = start;
    var logger = _context.logger;

    return function(msg) {
        if (msg.message === 'ready') {
            Promise.resolve(nextSlice(msg))
                .then(function(data) {
                    //not null or undefined
                    if (data != null) {
                        sendMessage(msg.id, {message: 'data', data: data})
                    }
                    else {
                        processDone++;
                        if (processDone === workerCount) {

                            var end = moment();
                            var time = (end - start ) / 1000;

                            logger.info('processing has finished in ' + time + ' seconds, will now exit');
                            process.exit()
                        }
                    }
                })

        }
    }
}


module.exports = {
    initializeJob: initializeJob
};