'use strict';

var fs = require('fs');
var Promise = require('bluebird');

var exceptions = require('../../utils/exceptions');
var insertAnalyzers = require('../../utils/analytics').insertAnalyzers;

/*
 * This module defines the job execution context on the worker nodes.
 */
module.exports = function(context) {
    var logger = context.logger;
    var op_runner = require('./op')(context);

    function initialize() {
        var job = getJob(process.env.job);
        var max_retries = job.max_retries;
        var slicer = null;
        var reporter = null;

        job.logger = initializeLogger(job, 'job_logger');

        //generate workers
        if (context.cluster.isMaster) {
            initializeWorkers(job);
        }

        var queue = job.operations.map(function(opConfig, index) {
            var op = op_runner.load(opConfig._op);
            if (index === 0) {
                slicer = op;
                return op.newReader(context, opConfig, job)
            }
            else {
                return op.newProcessor(context, opConfig, job);
            }
        });
        //TODO review this below
        if (context.sysconfig.teraslice && context.sysconfig.teraslice.reporter) {
            reporter = getPath('reporters', context.sysconfig.teraslice.reporter, opPath);
        }

        if (job.analytics) {
            queue = insertAnalyzers(queue);
        }

        return {
            analytics: job.analytics,
            reader: queue[0],
            jobs: job.operations,
            queue: queue,
            jobConfig: job,
            max_retries: max_retries,
            reporter: reporter,
            slicer: slicer
        };
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
        if (processJob) {
            return JSON.parse(processJob)
        }
    }

    function shutdown() {
        return Promise.resolve(true);
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

    var api = {
        initialize: initialize,
        shutdown: shutdown,
        __test_context: __test_context
    };

    return Promise.resolve(api);
};
