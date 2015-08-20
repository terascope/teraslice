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
    var config = schema.load(jobConfig).validate(/*{strict: true}*/);
    return config.getProperties();
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

    //top level job validation occurs, but not operations
    var validJob = validateOperation(jobSchema, job);
    var validOpConfig = [];

    job.operations.forEach(function(jobConfig, i){
        //Reader
        if (i === 0) {
            reader = getPath('readers', jobConfig.op, opPath);
            readerConfig = validateOperation(reader.schema(), jobConfig);
            validOpConfig.push(readerConfig)
            queue.push(reader.newReader.bind(null,context, readerConfig));
        }
        //Sender
        else if (i === job.operations.length - 1) {
            sender = getPath('senders', jobConfig.op, opPath);
            senderConfig = validateOperation(sender.schema(), jobConfig);
            validOpConfig.push(senderConfig)
            queue.push(sender.newSender.bind(null,context, senderConfig));
        }
        //Processor
        else {
            var processor = getPath('processors', jobConfig.op, opPath);
           var processConfig = validateOperation(processor.schema(), jobConfig);
            validOpConfig.push(processConfig);
            queue.push(processor.newProcessor.bind(null, context, processConfig));
        }
    });

    //now the operations are correctly validated, the entire job is now properly validated
    validJob.operations = validOpConfig;

    //need to pass in fully validated job to function in queue
    validJob.operations.forEach(function(opConfig, i){
        queue[i](validJob);
    });

    var scheduler = lifecycle(validJob);
    var max_retries = validJob.max_retries;

    if (job.analytics) {
        queue = insertAnalyzers(queue);
    }

    return {
        analytics: validJob.analytics,
        reader: reader,
        sender: sender,
        jobs: validJob.operations,
        queue: queue,
        readerConfig: readerConfig,
        scheduler: scheduler,
        jobConfig: validJob,
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