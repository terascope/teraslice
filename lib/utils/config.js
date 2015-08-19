'use strict';

var moment = require('moment');
var fs = require('fs');
var path = require('path');
var convict = require('convict');
var jobSchema = require('../../jobSchema');

var insertAnalyzers = require('./analytics').insertAnalyzers;
var workerCount = require('os').cpus().length;
var processDone = 0;

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

function retries(job) {
    if (job.max_retries !== false && job.max_retries !== null) {
        return job.max_retries ? job.max_retries : 3;
    }
    else {
        return null;
    }
}

function getPath(type, opconfig, opPath) {
    var firstPath = path.join(opPath, type, opconfig);
    firstPath += '.js';
    var nextPath = '../' + type + '/' + opconfig;

    try {
        if (fs.existsSync(firstPath)) {
            return require(firstPath);
        }
        else {

            return require(nextPath);
        }
    }
    catch (e) {
        throw new Error('Could not retrieve code for: ' + opconfig + '\n' + e);
    }

}

function validateOperation(schema, jobConfig) {
    schema.load(jobConfig).validate(/*{strict: true}*/)
}

function initializeJob(context) {
    _context = context;
    var opPath;

    if (context.sysconfig.teraslice && context.sysconfig.teraslice.ops_directory) {
        opPath = context.sysconfig.teraslice.ops_directory;
    }

    var job = getJob();
    var reader;
    var sender;
    var readerConfig;
    var senderConfig;
    var queue = [];

    validateOperation(jobSchema, job);

    job.process.forEach(function(jobConfig, i){
        //Reader
        if (i === 0) {
            reader = getPath('readers', jobConfig.op, opPath);
             readerConfig = jobConfig;
            validateOperation(reader.schema(), jobConfig);
            queue.push(reader.newReader(context, jobConfig, job));
        }
        //Sender
        else if (i === job.process.length - 1) {
            sender = getPath('senders', jobConfig.op, opPath);
            senderConfig = jobConfig;
            validateOperation(sender.schema(), jobConfig);
            queue.push(sender.newSender(context, jobConfig, job));
        }
        //Processor
        else {
            var processor = getPath('processors', jobConfig.op, opPath);
            validateOperation(processor.schema(), jobConfig);
            queue.push(processor.newProcessor(context, jobConfig, job));
        }
    });

    var scheduler = lifecycle(job);
    var max_retries = retries(job);

    if (job.analytics) {
        queue = insertAnalyzers(queue);
    }

    return {
        analytics: job.analytics,
        reader: reader,
        sender: sender,
       /* processors: processors,*/
        jobs: job.process,
        queue: queue,
        readerConfig: readerConfig,
        scheduler: scheduler,
        jobConfig: job,
        max_retries: max_retries

    };
}

function sendMessage(cluster, id, message) {
    cluster.workers[id].send(message);
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
                        sendMessage(_context.cluster, msg.id, {message: 'data', data: data})
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
                        sendMessage(_context.cluster, msg.id, {message: 'data', data: data})
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
    initializeJob: initializeJob,
    sendMessage: sendMessage
};