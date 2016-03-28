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
var walk = require('./file_utils').walk;

var canShutDown = false;

var uuid = require('uuid');

function addID(job, job_id) {
    var id = job_id ? job_id : uuid.v4();
    job.__id = id;
    return job;
}

emitter.on('shutdown', function() {
    canShutDown = true;
});

var argv = require('yargs')
    .alias('j', 'job')
    .alias('r', 'retry')
    .argv;

function getJob(processJob) {
    var jobFile;
    jobFile = process.cwd() + '/job.json';

    if (processJob) {
        return JSON.parse(processJob)
    }

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

//this is only used in single_node master
function getJobWithID(context) {
    var logger = context.logger;
    var job = getJob();
    var retry = argv.retry;
    var jobWithID;

    if (retry) {
        if (typeof retry !== 'string') {
            throw new Error('id given for retry is not formatted correctly')
        }
        else {
            var wasFound = findLogFile(context, retry);

            if (wasFound) {
                jobWithID = addID(job, retry);
            }
            else {
                throw new Error('No log file was found for id: ' + retry)
            }
        }
    }
    else {
        //generate an id
        jobWithID = addID(job);
    }
    logger.info('Job: ', job.name, ' has been initiated, id: ', job.__id);
    return JSON.stringify(jobWithID);
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

function validateOperation(context, opSchema, job, isOp) {
    var schema = isOp ? _.merge(opSchema, commonSchema) : opSchema;
    var config = convict(schema);
    config.load(job);

    if (context.cluster.isMaster) {
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

//TODO review if it gets right client when there are multiple
function writeToStateES(context) {
    var opConfig = context.sysconfig.teraslice.cluster.logs;
    var client = getClient(context, opConfig, 'elasticsearch');
    var logger = context.logger;
    return function(stateName, msg, prefix) {

        var query = {
            index: stateName,
            type: 'logs',
            id: msg.start,
            body: {
                msg: msg,
                state: prefix
            }
        };

        client.index(query)
            .catch(function(e) {
                logger.error('Could not index state update query \n', query, '\n Error thrown: ', e)
            });

    }
}

function writeToState(context) {
    if (context.sysconfig.teraslice.cluster) {
        return writeToStateES(context)
    }
    else {
        return writeToStateFS
    }
}

function writeToStateFS(stateName, msg, prefix) {
    //TODO review this code here
    var fd = fs.openSync(stateName, 'a');
    fs.appendFileSync(stateName, prefix + '__' + JSON.stringify(msg) + '\n');
    //flushing data here
    fs.fsyncSync(fd);
}

function stateLogFS(context, job, retry) {
    var path = context.sysconfig.terafoundation.log_path;

    if (path.charAt[path.length - 1] !== '/') {
        path += '/';
    }
    var name = makeLogName(context, job, 'state');
    var stateName = path + name;

    //Create file if it does not exist
    try {
        fs.accessSync(stateName);

        if (!retry) {
            fs.writeFileSync(stateName, '');
        }
    }
    catch (e) {
        fs.writeFileSync(stateName, '');
    }

    return stateName;
}

function makeLogName(context, job, suffix) {
    var sysconfig = context.sysconfig;
    var name = 'teraslice';

    if (sysconfig.teraslice.cluster && sysconfig.teraslice.cluster.name) {
        name = sysconfig.teraslice.cluster.name;
    }

    var fullName = name + '_' + job.__id + '-' + job.name + '__' + suffix;

    return fullName.trim().replace(' ', '').toLowerCase();
}

function stateLogES(context, job, retry) {
    return makeLogName(context, job, 'state')
}

function stateLog(context, job, retry) {
    if (context.sysconfig.teraslice.cluster) {
        return stateLogES(context, job, retry)
    }
    else {
        return stateLogFS(context, job, retry)
    }
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

            if (sliceLog[0] === 'error') {
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

function getStartFromESLog(context, opConfig, stateName) {
    var client = getClient(context, opConfig, 'elasticsearch');
    var retryQueue = new Queue;

    var startQuery = {
        index: stateName,
        body: {
            aggs: {
                start_date: {
                    max: {
                        field: 'msg.end'
                    }
                }
            }
        }
    };

    var retryQuery = {
        index: stateName,
        body: {
            query: {
                bool: {
                    must_not: {
                        match: {
                            state: 'completed'
                        }
                    }
                }
            }
        }
    };

    return new Promise(function(resolve, reject) {
        client.search(retryQuery).then(function(data) {
            data.hits.hits.forEach(function(doc) {
                retryQueue.enqueue(doc._source.msg)
            });
            client.search(startQuery).then(function(newStart) {
                resolve({retryQueue: retryQueue, startFrom: newStart.aggregations.start_date.value_as_string})
            })
        }).catch(function(e) {
            throw new Error('An error has occurred accessing the state log for retry: ' + e)
        });
    })

}

function checkIfRetry(context, opConfig, singleNodeRetry, clusterRetry, stateName) {
    if (singleNodeRetry) {
        return getStartFromLog(stateName);
    }
    if (clusterRetry) {
        return getStartFromESLog(context, opConfig, stateName);
    }
    return false;
}

function initializeJob(context) {
    var opPath = context.sysconfig.teraslice.ops_directory;
    var job = getJob(process.env.job);
    var reader;
    var sender;
    var readerConfig;
    var senderConfig;
    var queue = [];


    convictFormats.forEach(function(obj) {
        convict.addFormat(obj)
    });

    //top level job validation occurs, but not operations
    var validJob = validateOperation(context, jobSchema, job, false);

    var stateName = stateLog(context, job, argv.retry);
    var analyticsName = makeLogName(context, job, 'analytics');

    //generate workers
    if (context.cluster.isMaster) {
        initializeWorkers(context, validJob);
    }

    //TODO verify how the opConfig getting passed is correct
    return Promise.resolve(checkIfRetry(context, job.operations[0], argv.retry, process.env.jobRetry, stateName))
        .then(function(logData) {
            var validOpConfig = [];

            job.operations.forEach(function(jobConfig, i) {
                //Reader
                if (i === 0) {
                    reader = getPath('readers', jobConfig._op, opPath);
                    hasSchema(reader, jobConfig._op);
                    readerConfig = validateOperation(context, reader.schema(), jobConfig, true);
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
                    senderConfig = validateOperation(context, sender.schema(), jobConfig, true);
                    validOpConfig.push(senderConfig);
                    queue.push(sender.newSender.bind(null, context, senderConfig));
                }
                //Processor
                else {
                    var processor = getPath('processors', jobConfig._op, opPath);
                    hasSchema(processor, jobConfig._op);
                    var processConfig = validateOperation(context, processor.schema(), jobConfig, true);
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
                logData: logData,
                analyticsName: analyticsName
            };
        });
}

function transferLogs(logger, name) {
    logger.info('Transferring logs');
    var destPath = name.replace('_state', '_completed');

    fs.renameSync(name, destPath);
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

function persistent(context, slicer, workerQueue, job, sendMessage, writeToStateFile, io, event) {
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
                        sendMessage(worker.id, 'slice', {message: 'data', data: data})
                    }
                    isProcessing = false;
                })

        }
    }
}

function once(context, slicer, workerQueue, job, sendMessage, writeToStateFile, io, event) {
    var isProcessing = false;
    var retryQueue = false;
    var processDone = 0;
    var clusterShutdown = context.sysconfig.teraslice.cluster ? true : false;

    if (job.logData && job.logData.retryQueue) {
        retryQueue = job.logData.retryQueue;
    }

    return function() {
        if (!isProcessing) {
            isProcessing = true;
            var worker = workerQueue.dequeue();

            if (retryQueue && retryQueue.size()) {
                var retryData = retryQueue.dequeue();
                sendMessage(worker.id, 'slice', {message: 'data', data: retryData});
                isProcessing = false;
            }
            else {
                Promise.resolve(slicer(worker))
                    .then(function(data) {
                        //not null or undefined
                        if (data != null) {
                            writeToStateFile(job.stateName, data, 'start');
                            sendMessage(worker.id, 'slice', {message: 'data', data: data});
                        }
                        else {
                            if (clusterShutdown) {
                                event.emit('job finished')
                            }
                            else {
                                processDone++;

                                if (processDone >= Object.keys(io.sockets.sockets).length) {
                                    event.emit('job finished')
                                }
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
        clientConfig.cached = opConfig.connection_cache !== undefined ? opConfig.connection_cache : true;

    }
    else {
        clientConfig.endpoint = 'default';
        clientConfig.cached = true;
    }

    return context.foundation.getConnection(clientConfig).client;
}

function logFinishedJob(context, start, job, analyticsData) {
    var end = moment();
    var time = (end - start ) / 1000;
    var logger = job.jobConfig.logger;

    if (job.jobConfig.analytics) {
        analyzeStats(logger, job.jobConfig.operations, analyticsData);
    }

    logger.info('job ' + job.jobConfig.name + ' has finished in ' + time + ' seconds');

    if (context.sysconfig.teraslice.cluster) {
        //TODO do the calc stuff
    }
    else {
        transferLogs(logger, job.stateName);
    }
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
    transferLogs: transferLogs,
    logFinishedJob: logFinishedJob,
    validateNumOfWorkers: validateNumOfWorkers,
    initializeLogger: initializeLogger,
    initializeWorkers: initializeWorkers,
    stateLog: stateLog,
    compareDates: compareDates,
    getStartFromLog: getStartFromLog,
    writeToState: writeToState,
    makeLogName: makeLogName,
    addID: addID,
    getJobWithID: getJobWithID,
    sendProcessMessage: sendProcessMessage
};