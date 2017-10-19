'use strict';

const Promise = require('bluebird');
const insertAnalyzers = require('../../utils/analytics').insertAnalyzers;
const parseError = require('../../utils/error_utils').parseError;

/*
 * This module defines the job execution context on the worker nodes.
 */
module.exports = function module(context) {
    const opRunner = require('./op')(context);
    const isSlicer = process.env.assignment === 'slicer';
    const job = _parseJob(process.env.job);
    const needAssets = job.assets && job.assets.length > 0;
    const maxRetries = job.max_retries;
    const assetPath = job.assets ? context.sysconfig.teraslice.assets_directory : null;
    const jobAssets = job.assets ? job.assets : [];

    /*
     * This sets up the APIs intended for use by custom readers / processors.
     */
    function _registerContextAPI() {
        /*
         * Returns the first op that matches name.
         */
        function getOpConfig(name) {
            return job.operations.find(op => op._op === name);
        }

        context.apis.registerAPI('job_runner', {
            getOpConfig
        });
    }

    function _instantiateJob() {
        let slicer = null;
        const reporter = null;
        let queue = [];

        if (context.sysconfig.teraslice.reporter) {
            throw new Error('reporters are not functional at this time, please do not set one in the configuration');
        }

        function jobApi() {
            return {
                analytics: job.analytics,
                reader: queue[0],
                jobs: job.operations,
                queue,
                jobConfig: job,
                max_retries: maxRetries,
                reporter,
                slicer
            };
        }

        if (isSlicer) {
            return Promise.resolve(opRunner.load(job.operations[0]._op, assetPath, jobAssets))
                .then((_op) => {
                    slicer = _op;
                    return jobApi();
                });
        }

        return Promise.map(job.operations, (opConfig, index) => {
            const op = opRunner.load(opConfig._op, assetPath, jobAssets);
            if (index === 0) {
                return op.newReader(context, opConfig, job);
            }

            return op.newProcessor(context, opConfig, job);
        })
            .then((_queue) => {
                queue = _queue;
                if (job.analytics) {
                    queue = insertAnalyzers(queue);
                }
                return jobApi();
            });
    }

    function initialize(events, logger) {
        return new Promise(((resolve, reject) => {
            let gettingJob = true;
            let gettingJobInterval;

            events.on('worker:assets_loaded', (ipcMessage) => {
                if (ipcMessage.error) {
                    logger.error(`Error while loading assets, error: ${ipcMessage.error}`);
                    events.removeAllListeners('worker:assets_loaded');
                    reject(ipcMessage.error);
                } else {
                    gettingJobInterval = setInterval(() => {
                        if (!gettingJob) {
                            gettingJob = true;
                            Promise.resolve(_instantiateJob())
                                .then((jobInstance) => {
                                    clearInterval(gettingJobInterval);
                                    events.removeAllListeners('worker:assets_loaded');
                                    resolve(jobInstance);
                                })
                                .catch((err) => {
                                    clearInterval(gettingJobInterval);
                                    events.removeAllListeners('worker:assets_loaded');
                                    logger.error('error initializing job after loading assets', err.message);
                                    reject(err.message);
                                });
                        }
                    }, 100);
                }
            });

            Promise.resolve(_instantiateJob())
                .then((jobInstance) => {
                    events.removeAllListeners('worker:assets_loaded');
                    clearInterval(gettingJobInterval);

                    _registerContextAPI();

                    resolve(jobInstance);
                })
                .catch((err) => {
                    // if this errors, then we will wait for the events to fire to start job
                    if (!needAssets) {
                        // error out if there are no assets and job cannot initialize straight away
                        reject(parseError(err));
                    } else {
                        gettingJob = false;
                    }
                });
        }));
    }


    function _parseJob(processJob) {
        if (processJob) {
            return JSON.parse(processJob);
        }

        return undefined;
    }

    function shutdown() {
        return Promise.resolve(true);
    }

    // Expose internal functions for unit testing.
    function __test_context(tempContext) {
        if (tempContext) context = tempContext;

        return {
            _parseJob
        };
    }

    const api = {
        initialize,
        shutdown,
        __test_context
    };

    return api;
};
