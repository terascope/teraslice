'use strict';

const Promise = require('bluebird');
const parseError = require('error_parser');
const _ = require('lodash');
const Queue = require('queue');

module.exports = function module(context, messaging, executionAnalytics, exStore, stateStore, executionContext) {
    const events = context.apis.foundation.getSystemEvents();
    const numOfSlicersToRecover = executionContext.config.slicers;
    const recoveryQueue = new Queue();

    let recoverExecution = process.env.recover_execution;
    let exId = process.env.ex_id;
    let jobId = process.env.job_id;
    let recoverComplete = true;

    const logger = context.apis.foundation.makeLogger({ module: 'execution_recovery', ex_id: exId, job_id: jobId });

    const retryState = {};

    function initialize() {
        // if an error occurred while in recovery, fail the job as a whole
        events.once('slice:failure', _recoveryFailure);
        events.on('slice:success', _sliceComplete);
        recoverComplete = false;
        // once we have fully recovered, clean up event listners
        events.once('execution:recovery:complete', () => {
            events.removeListener('slice:failure', _recoveryFailure);
            events.removeListener('slice:success', _sliceComplete);
        });

        recoverSlices()
            .catch(_recoveryFailure);
    }

    function _sliceComplete(sliceData) {
        delete retryState[sliceData.slice.slice_id];
    }

    function _recoveryFailure(_errMsg) {
        const errMsg = _errMsg.error || _errMsg;
        const slicerAnalytics = executionAnalytics.getAnalytics();
        const errorMeta = exStore.failureMetaData(errMsg, slicerAnalytics);
        logger.error(errMsg);

        exStore.setStatus(exId, 'failed', errorMeta)
            .then(() => {
                messaging.send({
                    to: 'cluster_master',
                    message: 'execution:error:terminal',
                    ex_id: exId,
                    payload: { set_status: true }
                });
            });
    }

    function getSlicerStartingPosition() {
        const recoveredSlices = [];
        for (let i = 0; i < numOfSlicersToRecover; i += 1) {
            recoveredSlices.push(stateStore.executionStartingSlice(recoverExecution, i));
        }
        return Promise.all(recoveredSlices);
    }

    function _setId(slice) {
        retryState[slice.slice_id] = true;
    }

    function _processIncompleteSlices(slicerID) {
        return stateStore.recoverSlices(recoverExecution, slicerID)
            .then((slices) => {
                slices.forEach((slice) => {
                    _setId(slice);
                    recoveryQueue.enqueue(slice);
                });

                return slices.length;
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
                _processIncompleteSlices(slicerID)
                    .then((recoveredSlicesCount) => {
                        if (recoveredSlicesCount === 0) {
                            const nextID = slicerID + 1;
                            // all slicers have been recovered
                            if (nextID > numOfSlicersToRecover) {
                                logger.warn(`The recovered data for execution: ${exId} has successfully been enqueued`);
                                _waitForRecoveryBatchCompletion()
                                    .then(() => {
                                        events.emit('execution:recovery:complete');
                                        recoverComplete = true;
                                        resolve(true);
                                    });
                            } else {
                                retrieveSlices(nextID);
                            }
                        } else {
                            _waitForRecoveryBatchCompletion()
                                .then(() => retrieveSlices(slicerID));
                        }
                    })
                    .catch(err => reject(parseError(err)));
            }

            retrieveSlices(startingID);
        });
    }

    function newSlicer() {
        return Promise.resolve([() => new Promise((resolve) => {
            if (recoveryQueue.size()) {
                resolve(recoveryQueue.dequeue());
            } else {
                const checkingQueue = setInterval(() => {
                    if (recoveryQueue.size()) {
                        clearInterval(checkingQueue);
                        resolve(recoveryQueue.dequeue());
                    }
                    if (recoverComplete) {
                        clearInterval(checkingQueue);
                        resolve(null);
                    }
                }, 100);
            }
        })]);
    }

    function recoveryComplete() {
        return recoverComplete;
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
        __test_context: testContext,
        newSlicer,
        getSlicerStartingPosition,
        recoveryComplete
    };
};
