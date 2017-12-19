'use strict';

const Promise = require('bluebird');
const parseError = require('error_parser');
const moment = require('moment');

/*
 * This module defines the job execution context on the worker nodes.
 */
module.exports = function module(context) {
    const opRunner = require('./op')(context);
    const isSlicer = process.env.assignment === 'execution_controller';
    const execution = _parseJob(process.env.job);
    const needAssets = execution.assets && execution.assets.length > 0;
    const maxRetries = execution.max_retries;
    const assetPath = execution.assets ? context.sysconfig.teraslice.assets_directory : null;
    const jobAssets = execution.assets ? execution.assets : [];

    /*
     * This sets up the APIs intended for use by custom readers / processors.
     */
    function _registerContextAPI() {
        /*
         * Returns the first op that matches name.
         */
        function getOpConfig(name) {
            return execution.operations.find(op => op._op === name);
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
        // TODO fix released api
        function jobApi() {
            return {
                analytics: execution.analytics,
                reader: queue[0],
                queue,
                config: execution,
                max_retries: maxRetries,
                reporter,
                slicer
            };
        }

        if (isSlicer) {
            return Promise.resolve(opRunner.load(execution.operations[0]._op, assetPath, jobAssets))
                .then((_op) => {
                    slicer = _op;
                    return jobApi();
                });
        }

        return Promise.map(execution.operations, (opConfig, index) => {
            const op = opRunner.load(opConfig._op, assetPath, jobAssets);
            if (index === 0) {
                return op.newReader(context, opConfig, execution);
            }

            return op.newProcessor(context, opConfig, execution);
        })
            .then((_queue) => {
                queue = _queue;
                if (execution.analytics) {
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

    function getMemoryUsage() {
        return process.memoryUsage().heapUsed;
    }

    function analyze(fn) {
        return (obj, data, logger, msg) => {
            const start = moment();
            let end;
            let startingMemory = getMemoryUsage();

            function compareMemoryUsage() {
                const used = getMemoryUsage();
                const diff = used - startingMemory;
                // set the starting point for next op based off of what is used
                startingMemory = used;
                return diff;
            }

            return Promise.resolve(fn(data, logger, msg))
                .then((result) => {
                    end = moment();
                    obj.time.push(end - start);
                    obj.memory.push(compareMemoryUsage());
                    if (result) {
                        if (result.hits && result.hits.hits) {
                            obj.size.push(result.hits.hits.length);
                        } else if (result.length) {
                            obj.size.push(result.length);
                        } else {
                            // need to account for senders
                            obj.size.push(0);
                        }
                    }
                    return result;
                });
        };
    }

    function insertAnalyzers(array) {
        return array.map(fn => analyze(fn));
    }


    function _parseJob(processJob) {
        return JSON.parse(processJob);
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
