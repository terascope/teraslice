'use strict';

var Promise = require('bluebird');
var insertAnalyzers = require('../../utils/analytics').insertAnalyzers;
var parseError = require('../../utils/error_utils').parseError;

/*
 * This module defines the job execution context on the worker nodes.
 */
module.exports = function(context) {
    var op_runner = require('./op')(context);
    var isSlicer = process.env.assignment === 'slicer';
    var job = getJob(process.env.job);
    var needAssets = job.assets && job.assets.length > 0;
    var max_retries = job.max_retries;
    var assetPath = job.assets ? context.sysconfig.teraslice.assets_directory : null;
    var jobAssets = job.assets ? job.assets : [];
    
    function _instantiateJob() {
        var slicer = null;
        var reporter = null;
        var queue = [];

        if (context.sysconfig.teraslice.reporter) {
            throw new Error('reporters are not functional at this time, please do not set one in the configuration')
        }

        function jobApi() {
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

        if (isSlicer) {
            return Promise.resolve(op_runner.load(job.operations[0]._op, assetPath, jobAssets))
                .then(function(_op) {
                    slicer = _op;
                    return jobApi()
                });
        }
        else {
            return Promise.map(job.operations, function(opConfig, index) {
                var op = op_runner.load(opConfig._op, assetPath, jobAssets);
                if (index === 0) {
                    return op.newReader(context, opConfig, job)
                }
                else {
                    return op.newProcessor(context, opConfig, job);
                }
            })
                .then(function(_queue) {
                    queue = _queue;
                    if (job.analytics) {
                        queue = insertAnalyzers(queue);
                    }
                    return jobApi();
                });
        }
    }

    function initialize(events, logger) {
        return new Promise(function(resolve, reject) {
            var gettingJob = true;
            var gettingJobInterval;
            var job;

            events.on('worker:assets_loaded', function(ipcMessage) {
                if (ipcMessage.error) {
                    logger.error(`Error while loading assets, error: ${ipcMessage.error}`);
                    events.removeAllListeners('worker:assets_loaded');
                    reject(ipcMessage.error)
                }
                else {
                    gettingJobInterval = setInterval(function() {
                        if (!gettingJob) {
                            gettingJob = true;
                            Promise.resolve(_instantiateJob())
                                .then(function(job) {
                                    clearInterval(gettingJobInterval);
                                    events.removeAllListeners('worker:assets_loaded');
                                    resolve(job)
                                })
                                .catch(function(err) {
                                    clearInterval(gettingJobInterval);
                                    events.removeAllListeners('worker:assets_loaded');
                                    logger.error('error initializing job after loading assets', err.message);
                                    reject(err.message)
                                })
                        }
                    }, 100);

                }
            });

            Promise.resolve(_instantiateJob())
                .then(function(job) {
                    events.removeAllListeners('worker:assets_loaded');
                    clearInterval(gettingJobInterval);
                    resolve(job)
                })
                .catch(function(err) {
                    //if this errors, then we will wait for the events to fire to start job
                    if (needAssets) {
                        //error out if there are no assets and job cannot initialize straight away
                        reject(parseError(err))
                    }
                    else {
                        gettingJob = false;
                    }
                });
        })
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
