'use strict';

var moment = require('moment');
var fs = require('fs');
var path = require('path');
var convict = require('convict');
var _ = require('lodash');
var convictFormats = require('./convict_utils');
var lineByLine = require('n-readlines');
var Queue = require('./queue');
var emitter = require('./events');

var jobSchema = require('../../jobSchema').jobSchema;
var commonSchema = require('../../jobSchema').commonSchema;
var insertAnalyzers = require('./analytics').insertAnalyzers;
var analyzeStats = require('./analytics').analyzeStats;

var cpuCount = require('os').cpus().length;
var workerCount = 0;
var processDone = 0;

var _context;
var canShutDown = false;

emitter.on('shutdown', function() {
    canShutDown = true;
});

var argv = require('yargs')
    .alias('j', 'job')
    .alias('r', 'retry')
    .argv;

function getJob() {
    var jobFile;
    jobFile = process.cwd() + '/job.json';

    if (argv.job) {
        jobFile = argv.job;
    }

    if (jobFile.charAt(0) !== '/' && jobFile.slice(0, 2) !== './') {
        jobFile = process.cwd() + '/' + jobFile;
    }

    if (jobFile.indexOf('.') === 0) {
        jobFile = process.cwd() + '/' + jobFile;
    }

    if (!fs.existsSync(jobFile)) {
        throw new Error("Could not find a usable job.json at path: " + jobFile);
    }

    return require(jobFile);
}

function isString(str) {
    var type = typeof str;

    if (type !== 'string') {
        throw new Error('Error: please verify that ops_directory in config and _op for each job operations are strings')
    }
}

function getPath(type, opConfig, opPath) {

    [type, opConfig, opPath].map(isString);

    var firstPath = path.join(opPath, type, opConfig);

    if (!firstPath.match(/.js/)) {
        firstPath += '.js';
    }

    var nextPath = '../' + type + '/' + opConfig;

    try {
        if (fs.existsSync(firstPath)) {
            return require(firstPath);
        }
        else {
            return require(nextPath);
        }
    }
    catch (e) {
        throw new Error('Could not retrieve code for: ' + opConfig + '\n' + e);
    }

}

function hasSchema(obj, name) {
    if (!obj.schema || typeof obj.schema !== 'function') {
        throw new Error(name + ' needs to have a method named "schema"')
    }
    else {
        if (typeof obj.schema() !== 'object') {
            throw new Error(name + 'schema needs to return an object')
        }
    }

}

function validateOperation(opSchema, job, isOp) {
    var schema = isOp ? _.merge(opSchema, commonSchema) : opSchema;
    var config = convict(schema);
    config.load(job);

    if (_context.cluster.isMaster) {
        config.validate(/*{strict: true}*/);
    }

    return config.getProperties();
}

function initializeLogger(context, job, loggerName) {
    var makeLogger = context.foundation.makeLogger;
    return makeLogger(loggerName, job.name);
}

function initializeWorkers(context, validJob) {
    if (validJob.progressive_start) {
        var interval = Math.floor(validJob.progressive_start / validJob.workers) * 1000;

        var rampUp = setInterval(function() {
            var workers = Object.keys(context.cluster.workers);

            if (workers.length < validJob.workers) {
                context.foundation.startWorkers(1);
            }
            else {
                clearInterval(rampUp);
            }
        }, interval)

    }
    else {
        context.foundation.startWorkers(validJob.workers);
    }
}

function writeToStateFile(stateName, msg, prefix) {
    //get file descriptor, needed for flush

    //TODO review this code here
    var fd = fs.openSync(stateName, 'a');
    fs.appendFileSync(stateName, prefix + '__' + JSON.stringify(msg) + '\n');
    //flushing data here
    fs.fsyncSync(fd);
}

function createStateFile() {

}

function stateLog(context, job, retry) {
    var path = context.sysconfig.terafoundation.log_path + '/';
    var start = path + "__" + job.name.replace(' ', '') + '_state';

    //Create file if it does not exist
    try {
        fs.accessSync(start);

        if (!retry) {
            fs.writeFileSync(start, '');
        }
    }
    catch (e) {
        fs.writeFileSync(start, '');
    }

    return start;
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

function getStartFromLog(stateName) {
    var start = new lineByLine(stateName);
    var retryQueue = new Queue;

    var logList = {};
    var line;
    var startFrom;

    while (line = start.next()) {
        if (line.length) {
            var sliceLog = line.toString('ascii').split('__');
            var slice = JSON.parse(sliceLog[1]);

            if (sliceLog[0] === 'start') {
                logList[sliceLog[1]] = true;
            }

            if (sliceLog[0] === 'completed') {
                delete logList[sliceLog[1]];
            }

            if (startFrom) {
                startFrom = compareDates(startFrom, slice)
            }
            else {
                startFrom = slice;
            }

        }
    }
    if (!startFrom) {
        return false;
    }

    for (var notCompleted in logList) {
        retryQueue.enqueue(JSON.parse(notCompleted));
    }

    return {startFrom: startFrom.end, retryQueue: retryQueue};
}

function initializeJob(context) {
    _context = context;
    var opPath = process.cwd() + '/lib';

    if (context.sysconfig.teraslice && context.sysconfig.teraslice.ops_directory) {
        opPath = context.sysconfig.teraslice.ops_directory;
    }

    var job = getJob();
    var reader;
    var sender;
    var readerConfig;
    var senderConfig;
    var queue = [];

    convictFormats.forEach(function(obj) {
        convict.addFormat(obj)
    });

    //top level job validation occurs, but not operations
    var validJob = validateOperation(jobSchema, job, false);

    var stateName = stateLog(context, job, argv.retry);

    //generate workers
    if (context.cluster.isMaster) {
        initializeWorkers(context, validJob);
    }

    if (argv.retry) {
        var logData = getStartFromLog(stateName);
    }

    //set number of workers to track for shutdown sequence
    workerCount = validJob.workers ? validJob.workers : cpuCount;

    var validOpConfig = [];

    job.operations.forEach(function(jobConfig, i) {
        //Reader
        if (i === 0) {
            reader = getPath('readers', jobConfig._op, opPath);
            hasSchema(reader, jobConfig._op);
            readerConfig = validateOperation(reader.schema(), jobConfig, true);
            //if retry, set start to end of last completion
            if (logData) {
                readerConfig.start = logData.startFrom
            }
            validOpConfig.push(readerConfig);
            queue.push(reader.newReader.bind(null, context, readerConfig));
        }
        //Sender
        else if (i === job.operations.length - 1) {
            sender = getPath('senders', jobConfig._op, opPath);
            hasSchema(sender, jobConfig._op);
            senderConfig = validateOperation(sender.schema(), jobConfig, true);
            validOpConfig.push(senderConfig);
            queue.push(sender.newSender.bind(null, context, senderConfig));
        }
        //Processor
        else {
            var processor = getPath('processors', jobConfig._op, opPath);
            hasSchema(processor, jobConfig._op);
            var processConfig = validateOperation(processor.schema(), jobConfig, true);
            validOpConfig.push(processConfig);
            queue.push(processor.newProcessor.bind(null, context, processConfig));
        }
    });

    //now the operations are correctly validated, the entire job is now properly validated
    validJob.operations = validOpConfig;

    validJob.logger = initializeLogger(context, validJob, 'job_logger');

    //need to pass in fully validated job to function in queue
    var jobQueue = queue.map(function(fn) {
        return fn(validJob);
    });

    var scheduler = lifecycle(validJob);
    var max_retries = validJob.max_retries;

    var reporter = null;

    if (context.sysconfig.teraslice && context.sysconfig.teraslice.reporter) {
        reporter = getPath('reporters', context.sysconfig.teraslice.reporter, opPath);
    }

    if (job.analytics) {
        jobQueue = insertAnalyzers(jobQueue);
    }

    return {
        analytics: validJob.analytics,
        reader: reader,
        sender: sender,
        jobs: validJob.operations,
        queue: jobQueue,
        readerConfig: readerConfig,
        scheduler: scheduler,
        jobConfig: validJob,
        max_retries: max_retries,
        reporter: reporter,
        stateName: stateName,
        logData: logData
    };
}

/*function sendMessage(cluster, id, message) {
 if (cluster.workers[id].state !== 'disconnected') {
 cluster.workers[id].send(message);
 }
 }*/

function transferLogs(logger, name) {
    logger.info('Transferring logs');
    var destPath = name.replace('_state', '_completed');

    return new Promise(function(resolve, reject) {
        var source = fs.createReadStream(name);
        var dest = fs.createWriteStream(destPath);
        var fd;

        source.once('open', function(fileD) {
            fd = fileD;
        });

        source.pipe(dest);

        source.on('end', function() {
            logger.info('Log transfer complete');

            fs.fsync(fd, function() {
                fs.unlinkSync(name);
                resolve()
            });

        });
    })
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

function genericPersistent() {
    var nextSlice = slicer;
    var start = start;
    var isProcessing = false;

    return function() {
        if (!isProcessing) {
            isProcessing = true;
            var worker = workerQueue.dequeue();

            Promise.resolve(nextSlice(worker))
                .then(function(data) {
                    //not null or undefined
                    if (data != null) {
                        sendMessage(_context.cluster, worker.id, {message: 'data', data: data})
                    }
                    isProcessing = false;
                })

        }
    }
}
//TODO refactor this
function persistent(slicer, start, workerQueue, job, analyticsData) {
    var start = start;
    var logger = job.jobConfig.logger;
    var isProcessing = false;

    return function() {

        if (!isProcessing) {
            isProcessing = true;

            Promise.resolve(slicer())
                .then(function(data) {
                    //not null or undefined
                    if (data != null) {
                        var worker = workerQueue.dequeue();
                        writeToStateFile(job.stateName, data, 'start');
                        sendMessage(_context.cluster, worker.id, {message: 'data', data: data})
                    }
                    isProcessing = false;
                })

        }
    }
}

function once(slicer, workerQueue, job, sendMessage, workerConnections, event) {
    var isProcessing = false;
    var retryQueue = false;
    var processDone = 0;

    if (job.logData && job.logData.retryQueue) {
        retryQueue = job.logData.retryQueue;
    }

    return function() {

        if (!isProcessing) {
            isProcessing = true;
            var worker = workerQueue.dequeue();

            //has slice key when worker has completed its job, save to disk
            if (worker.slice) {
                writeToStateFile(job.stateName, worker.slice, 'completed');
            }

            if (retryQueue && retryQueue.size()) {
                var retryData = retryQueue.dequeue();
                sendMessage(worker.id, {message: 'data', data: retryData});
                isProcessing = false;
            }
            else {
                Promise.resolve(slicer(worker))
                    .then(function(data) {
                        //not null or undefined
                        if (data != null) {
                            writeToStateFile(job.stateName, data, 'start');
                            sendMessage(worker.id, {message: 'data', data: data});
                        }
                        else {
                            processDone++;
                            //TODO review if workerConnection is necessary here
                            if (processDone === Object.keys(workerConnections).length) {
                                event.emit('job finished')
                            }
                        }
                        isProcessing = false;
                    })
            }
        }

    }
}

function getClient(context, opConfig, type) {
    var clientConfig = {};
    clientConfig.type = type;

    if (opConfig.hasOwnProperty('connection')) {
        clientConfig.endpoint = opConfig.connection ? opConfig.connection : 'default';
        clientConfig.cached = opConfig.connection_cache ? opConfig.connection_cache : true;

    }
    else {
        clientConfig.endpoint = 'default';
        clientConfig.cached = true;
    }

    return context.foundation.getConnection(clientConfig).client;
}

function logFinishedJob(start, job, analyticsData) {
    var end = moment();
    var time = (end - start ) / 1000;
    var logger = job.jobConfig.logger;

    if (job.jobConfig.analytics) {
        analyzeStats(logger, job.jobConfig.operations, analyticsData);
    }

    logger.info('job ' + job.jobConfig.name + ' has finished in ' + time + ' seconds');

    Promise.resolve(transferLogs(logger, job.stateName)).then(function() {
        process.send({message: 'job finished'})
    });
}


module.exports = {
    initializeJob: initializeJob,
    getJob: getJob,
    isString: isString,
    getPath: getPath,
    hasSchema: hasSchema,
    validateOperation: validateOperation,
    lifecycle: lifecycle,
    periodic: periodic,
    persistent: persistent,
    once: once,
    getClient: getClient,
    writeToStateFile: writeToStateFile,
    transferLogs: transferLogs,
    logFinishedJob: logFinishedJob
};