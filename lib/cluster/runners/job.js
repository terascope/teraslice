'use strict';

var _ = require('lodash');
var fs = require('fs');

var Promise = require('bluebird');

var exceptions = require('../../utils/exceptions');

var insertAnalyzers = require('../../utils/analytics').insertAnalyzers;

/*
 * This module defines the job execution context on the worker nodes.
 */
module.exports = function(context) {
    var logger = context.logger;

    var state_store = require('../storage/state')(context);

    var job_validator = require('../../config/validators/job')(context);

    var op_runner = require('./op')(context);

    function initialize() {
        var job = getJob(process.env.job);
        var reader;
        var sender;
        var readerConfig;
        var queue = [];

        var validJob = job_validator.validate(job);

        //generate workers
        if (context.cluster.isMaster) {
            initializeWorkers(validJob);
        }

        return state_store.recoveryContext(job.job_id, process.env.recover_job)
            .then(function(logData) {

                validJob.operations.forEach(function(opConfig, i) {
                    //Reader
                    if (i === 0) {
                        reader = op_runner.load('readers', opConfig._op);
                        readerConfig = opConfig;

                        //if retry, set start to end of last completion
                        if (logData && logData.startFrom) {
                            readerConfig.start = logData.startFrom
                        }
                        queue.push(reader.newReader.bind(null, context, readerConfig));
                    }
                    //Sender
                    else if (i === job.operations.length - 1) {
                        sender = op_runner.load('senders', opConfig._op);
                        queue.push(sender.newSender.bind(null, context, opConfig));
                    }
                    //Processor
                    else {
                        var processor = op_runner.load('processors', opConfig._op);
                        queue.push(processor.newProcessor.bind(null, context, opConfig));
                    }
                });

                validJob.logger = initializeLogger(validJob, 'job_logger');

                //need to pass in fully validated job to function in queue
                var jobQueue = queue.map(function(fn) {
                    return fn(validJob);
                });

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
                    jobConfig: validJob,
                    max_retries: max_retries,
                    reporter: reporter,
                    logData: logData
                };
            });
    }


    function initializeWorkers(validJob) {
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

    function initializeLogger(job, loggerName) {
        var makeLogger = context.foundation.makeLogger;
        return makeLogger(loggerName, job.name);
    }

    function getJob(processJob) {
        var jobFile;
        jobFile = process.cwd() + '/job.json';

        if (processJob) {
            return JSON.parse(processJob)
        }

        /*if (argv.job) {
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

        return require(jobFile);*/
    }

    // Expose internal functions for unit testing.
    function __test_context(temp_context) {
        if (temp_context) context = temp_context;

        return {
            initializeWorkers: initializeWorkers,
            initializeLogger: initializeLogger,
            getJob: getJob
        }
    }

    return {
        initialize: initialize,
        __test_context: __test_context
    }
}

