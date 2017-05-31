'use strict';

var Promise = require('bluebird');
var insertAnalyzers = require('../../utils/analytics').insertAnalyzers;

/*
 * This module defines the job execution context on the worker nodes.
 */
module.exports = function(context) {
    var op_runner = require('./op')(context);
    var isSlicer = process.env.assignment === 'slicer';

    function initialize() {
        var job = getJob(process.env.job);
        var max_retries = job.max_retries;
        var slicer = null;
        var reporter = null;
        var queue = [];
        var assetPath = job.assets ? context.sysconfig.teraslice.assets_directory : null;
        var jobAssets = job.assets ? job.assets : [];

        if (isSlicer) {
            slicer = op_runner.load(job.operations[0]._op, assetPath, jobAssets);
        }
        else {
            queue = job.operations.map(function(opConfig, index) {
                var op = op_runner.load(opConfig._op, assetPath, jobAssets);
                if (index === 0) {
                    return op.newReader(context, opConfig, job)
                }
                else {
                    return op.newProcessor(context, opConfig, job);
                }
            });

            if (job.analytics) {
                queue = insertAnalyzers(queue);
            }
        }

        if (context.sysconfig.teraslice.reporter) {
            throw new Error('reporters are not functional at this time, please do not set one in the configuration')
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
            getJob: getJob
        }
    }

    var api = {
        initialize: initialize,
        shutdown: shutdown,
        __test_context: __test_context
    };

    return api;
};
