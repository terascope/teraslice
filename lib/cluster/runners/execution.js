'use strict';

const Promise = require('bluebird');
const parseError = require('error_parser');
const moment = require('moment');

/*
 * This module defines the job execution context on the worker nodes.
 */
module.exports = function module(context) {
    const opRunner = require('./op')(context);
    let isSlicer = process.env.assignment === 'execution_controller';
    let execution = _parseJob(process.env.job);
    let needAssets = execution.assets && execution.assets.length > 0;
    let assetPath = execution.assets ? context.sysconfig.teraslice.assets_directory : null;
    let jobAssets = execution.assets ? execution.assets : [];


    /*
     * Returns the first op that matches name.
     */
    function getOpConfig(name) {
        return execution.operations.find(op => op._op === name);
    }

    /*
     * This sets up the APIs intended for use by custom readers / processors.
     */

    context.apis.registerAPI('job_runner', {
        getOpConfig
    });


    function _instantiateJob() {
        let slicer = null;
        const reporter = null;
        let queue = [];

        if (context.sysconfig.teraslice.reporter) {
            throw new Error('reporters are not functional at this time, please do not set one in the configuration');
        }
        // TODO fix released api
        function executionApi() {
            return {
                reader: queue[0],
                queue,
                config: execution,
                reporter,
                slicer
            };
        }

        if (isSlicer) {
            return Promise.resolve()
                .then(() => opRunner.load(execution.operations[0]._op, assetPath, jobAssets))
                .then((_op) => {
                    slicer = _op;
                    return executionApi();
                })
                .catch(err => Promise.reject(err));
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
                return executionApi();
            });
    }

    function initialize(events, logger) {
        return new Promise(((resolve, reject) => {
            let gettingJob = true;
            let gettingJobInterval;

            events.on('execution:assets_loaded', (ipcMessage) => {
                if (ipcMessage.error) {
                    logger.error(`Error while loading assets, error: ${ipcMessage.error}`);
                    events.removeAllListeners('execution:assets_loaded');
                    reject(ipcMessage.error);
                } else {
                    gettingJobInterval = setInterval(() => {
                        if (!gettingJob) {
                            gettingJob = true;
                            Promise.resolve(_instantiateJob())
                                .then((jobInstance) => {
                                    clearInterval(gettingJobInterval);
                                    events.removeAllListeners('execution:assets_loaded');
                                    resolve(jobInstance);
                                })
                                .catch((err) => {
                                    clearInterval(gettingJobInterval);
                                    events.removeAllListeners('execution:assets_loaded');
                                    logger.error('error initializing execution after loading assets', err.message);
                                    reject(err.message);
                                });
                        }
                    }, 100);
                }
            });

            Promise.resolve(_instantiateJob())
                .then((jobInstance) => {
                    events.removeAllListeners('execution:assets_loaded');
                    clearInterval(gettingJobInterval);
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
    function __test_context(tempContext, process) {
        if (tempContext) context = tempContext;

        isSlicer = process.env.assignment === 'execution_controller';
        execution = _parseJob(process.env.job);
        needAssets = execution.assets && execution.assets.length > 0;
        assetPath = execution.assets ? context.sysconfig.teraslice.assets_directory : null;
        jobAssets = execution.assets ? execution.assets : [];

        return {
            _parseJob,
            analyze,
            insertAnalyzers,
            _instantiateJob,
            initialize
        };
    }

    const api = {
        initialize,
        insertAnalyzers,
        shutdown,
        __test_context
    };

    return api;
};
