'use strict';

const Promise = require('bluebird');
const parseError = require('@terascope/error-parser');
const moment = require('moment');
const _ = require('lodash');
const path = require('path');
const { OperationLoader, registerApis } = require('@terascope/job-components');
const { existsSync } = require('../../utils/file_utils');

/*
 * This module defines the job execution context on the worker nodes.
 */
module.exports = function module(context, config = {}) {
    // used for testing so we dont have to pollute the process env in testing
    const {
        processAssignment = context.__test_assignment || process.env.assignment,
        execution = _parseJob(context.__test_job || process.env.job),
    } = config;

    const isSlicer = processAssignment === 'execution_controller';
    const assetPath = execution.assets ? context.sysconfig.teraslice.assets_directory : null;
    const jobAssets = execution.assets ? execution.assets : [];

    const opLoader = new OperationLoader({
        assetPath,
        terasliceOpPath: path.join(__dirname, '..', '..'),
        opPath: _.get(context, 'sysconfig.teraslice.ops_directory'),
    });

    registerApis(context, execution);

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
                .then(() => opLoader.load(execution.operations[0]._op, jobAssets))
                .then((_op) => {
                    slicer = _op;
                    return executionApi();
                });
        }

        return Promise.map(execution.operations, (opConfig, index) => {
            const op = opLoader.load(opConfig._op, jobAssets);
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

    function _waitForAssets(events, logger) {
        const _hasAssets = () => {
            if (_.isEmpty(execution.assets)) {
                // no assets specified
                return true;
            }
            if (!assetPath) {
                // no assets directory specified
                return true;
            }
            if (!existsSync(assetPath)) {
                // return if assets exist
                return false;
            }
            return _.every(jobAssets, assetID => existsSync(path.join(assetPath, assetID)));
        };
        if (_hasAssets()) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            let intervalId;
            const assetsLoadedEvent = (ipcMessage) => {
                if (ipcMessage.error) {
                    if (intervalId) clearInterval(intervalId);
                    logger.error(`Error while loading assets, error: ${ipcMessage.error}`);
                    events.removeListener('execution:assets_loaded', assetsLoadedEvent);
                    reject(ipcMessage.error);
                    return;
                }
                intervalId = setInterval(() => {
                    if (_hasAssets()) {
                        events.removeListener('execution:assets_loaded', assetsLoadedEvent);
                        clearInterval(intervalId);
                        resolve();
                    }
                }, 100);
            };

            events.on('execution:assets_loaded', assetsLoadedEvent);
        });
    }

    function initialize(events, logger) {
        return _waitForAssets(events, logger)
            .then(_instantiateJob)
            .catch(err => Promise.reject(parseError(err)));
    }

    function getMemoryUsage() {
        return process.memoryUsage().heapUsed;
    }

    function analyze(fn, index) {
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
                    obj.time[index] = (end - start);
                    obj.memory[index] = compareMemoryUsage();
                    if (result) {
                        if (result.hits && result.hits.hits) {
                            obj.size[index] = result.hits.hits.length;
                        } else if (result.length) {
                            obj.size[index] = result.length;
                        } else {
                            // need to account for senders
                            obj.size[index] = 0;
                        }
                    }
                    return result;
                });
        };
    }
    // we pass in the index so that the stat gets sent to the proper place despite retries
    function insertAnalyzers(array) {
        return array.map((fn, ind) => analyze(fn, ind));
    }


    function _parseJob(processJob) {
        return JSON.parse(processJob);
    }

    function shutdown() {
        return Promise.resolve(true);
    }

    // Expose internal functions for unit testing.
    function __testContext() {
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
        __test_context: __testContext
    };

    return api;
};
