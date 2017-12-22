'use strict';

const Promise = require('bluebird');
const parseError = require('error_parser');
const _ = require('lodash');

module.exports = function module(executionModules) {
    const context = executionModules.context;
    const messaging = executionModules.messaging;
    const executionAnalytics = executionModules.executionAnalytics;
    const exStore = executionModules.exStore;
    const stateStore = executionModules.stateStore;
    const engine = executionModules.engine;
    const events = context.apis.foundation.getSystemEvents();
    const numOfSlicersToRecover = executionModules.executionContext.config.slicers;

    let recoverExecution = process.env.recover_execution;
    let exId = process.env.ex_id;
    let jobId = process.env.job_id;

    const logger = context.apis.foundation.makeLogger({ module: 'execution_recovery', ex_id: exId, job_id: jobId });

    const retryState = {};

    function initialize() {
        // if an error occurred while in recovery, fail the job as a whole
        events.once('slice:failure', _recoveryFailure);
        events.on('slice:success', _sliceComplete);

        // once we have fully recovered, clean up event listners
        events.once('execution:recovery:complete', () => {
            events.removeListener('slice:failure', _recoveryFailure);
            events.removeListener('slice:success', _sliceComplete);
        });
    }

    function _sliceComplete(sliceData) {
        delete retryState[sliceData.slice.slice_id];
    }

    function _recoveryFailure() {
        messaging.send({
            to: 'cluster_master',
            message: 'execution:recovery:failed',
            ex_id: exId
        });
        const slicerAnalytics = executionAnalytics.getAnalytics();
        const errorMeta = exStore.failureMetaData('there were errors processing a slice in recovery mode', slicerAnalytics);
        exStore.setStatus(exId, 'failed', errorMeta);
    }

    function _getSlicerStartingPosition() {
        const recoveredSlices = [];
        for (let i = 0; i < numOfSlicersToRecover; i += 1) {
            recoveredSlices.push(stateStore.executionStartingSlice(recoverExecution, i));
        }
        return Promise.all(recoveredSlices);
    }

    function _setId(slice) {
        retryState[slice.slice_id] = true;
    }

    function _fetchIncompleteSlices(slicerID) {
        return stateStore.recoverSlices(recoverExecution, slicerID)
            .then((slices) => {
                slices.forEach(_setId);
                return slices;
            });
    }

    function _recoveryBatchCompleted() {
        return Object.keys(retryState).length === 0;
    }

    function _retryState() {
        return _.cloneDeep(retryState);
    }

    function _waitForRecoveryBatchCompletion() {
        return new Promise((resolve) => {
            const checkingBatch = setInterval(() => {
                if (_recoveryBatchCompleted()) {
                    clearInterval(checkingBatch);
                    resolve();
                }
            }, 100);
        });
    }

    function recoverSlices() {
        const startingID = 0;
        return new Promise((resolve, reject) => {
            function retrieveSlices(slicerID) {
                _fetchIncompleteSlices(slicerID)
                    .then((slices) => {
                        if (slices.length === 0) {
                            const nextID = slicerID + 1;
                            // all slicers have been recovered
                            if (nextID > numOfSlicersToRecover) {
                                logger.warn(`The recovered data for execution: ${exId} has successfully been enqueued`);
                                _waitForRecoveryBatchCompletion()
                                    .then(() => {
                                        events.emit('execution:recovery:complete');
                                        resolve(_getSlicerStartingPosition());
                                    });
                            } else {
                                retrieveSlices(nextID);
                            }
                        } else {
                            slices.forEach(slice => engine.enqueueSlice(slice));
                            _waitForRecoveryBatchCompletion()
                                .then(() => retrieveSlices(slicerID));
                        }
                    })
                    .catch(err => reject(parseError(err)));
            }

            retrieveSlices(startingID);
        });
    }

    function testContext(config) {
        recoverExecution = config.recover_execution;
        exId = config.ex_id;
        jobId = config.job_id;

        return {
            _retryState,
            _recoveryBatchCompleted,
            _setId,
            _waitForRecoveryBatchCompletion,
            _sliceComplete
        };
    }


    return {
        initialize,
        recoverSlices,
        __test_context: testContext
    };
};
