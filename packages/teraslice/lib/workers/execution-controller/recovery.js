'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const Queue = require('@terascope/queue');

function recovery(context, stateStore, executionContext) {
    const events = context.apis.foundation.getSystemEvents();
    const slicersToRecover = executionContext.config.slicers;
    const recoveryQueue = new Queue();

    const cleanupType = executionContext.config.recovered_slice_type;
    const recoverExecution = executionContext.config.recovered_execution;
    const { exId, jobId } = executionContext;

    let recoverComplete = true;
    let isShutdown = false;

    const logger = context.apis.foundation.makeLogger({
        module: 'execution_recovery',
        ex_id: exId,
        job_id: jobId,
    });

    const retryState = {};

    function initialize() {
        events.on('slice:success', _sliceComplete);
        recoverComplete = false;

        // once we have fully recovered, clean up event listners
        events.once('execution:recovery:complete', () => {
            events.removeListener('slice:success', _sliceComplete);
        });
    }

    function _sliceComplete(sliceData) {
        retryState[sliceData.slice.slice_id] = false;
    }

    function getSlicerStartingPosition() {
        if (exitAfterComplete()) return Promise.resolve([]);

        const recoveredSlices = [];
        for (let i = 0; i < slicersToRecover; i += 1) {
            recoveredSlices.push(stateStore.executionStartingSlice(recoverExecution, i));
        }
        return Promise.all(recoveredSlices);
    }

    function _setId(slice) {
        retryState[slice.slice_id] = true;
    }

    async function _processIncompleteSlices(slicerID) {
        const slices = await stateStore.recoverSlices(recoverExecution, slicerID, cleanupType);
        slices.forEach((slice) => {
            _setId(slice);
            recoveryQueue.enqueue(slice);
        });

        return slices.length;
    }

    function _recoveryBatchCompleted() {
        return _.every(retryState, v => v === false);
    }

    function _retryState() {
        return _.cloneDeep(retryState);
    }

    function _waitForRecoveryBatchCompletion() {
        return new Promise((resolve) => {
            const checkingBatch = setInterval(() => {
                if (_recoveryBatchCompleted()) {
                    clearInterval(checkingBatch);
                    events.emit('execution:recovery:complete');
                    recoverComplete = true;
                    resolve();
                    return;
                }

                if (isShutdown) {
                    clearInterval(checkingBatch);
                    recoverComplete = false;
                    resolve();
                }
            }, 100);
        });
    }

    let slicerID = 0;

    async function handle() {
        if (recoverComplete) return true;

        const recoveredSlicesCount = await _processIncompleteSlices(slicerID);
        if (recoveredSlicesCount === 0) {
            slicerID++;
            // all slicers have been recovered
            if (slicerID > slicersToRecover) {
                logger.warn(`recovered data for execution: ${exId} has successfully been enqueued`);
                await _waitForRecoveryBatchCompletion();
                return true;
            }
        }

        await _waitForRecoveryBatchCompletion();

        return false;
    }

    function getSlice() {
        if (recoveryQueue.size() > 0) {
            return recoveryQueue.dequeue();
        }
        return null;
    }

    function getSlices(max = 1) {
        const count = max > sliceCount() ? sliceCount() : max;

        const slices = [];

        for (let i = 0; i < count; i++) {
            const slice = recoveryQueue.dequeue();
            if (!slice) return slices;

            slices.push(slice);
        }

        return slices;
    }

    function sliceCount() {
        return recoveryQueue.size();
    }

    function shutdown() {
        let checkInterval;

        return new Promise((resolve) => {
            checkInterval = setInterval(() => {
                if (recoverComplete) {
                    resolve();
                }
            }, 100);
        })
            .timeout(context.sysconfig.teraslice.shutdown_timeout)
            .finally(() => {
                isShutdown = true;
                clearInterval(checkInterval);
            });
    }

    function recoveryComplete() {
        return recoverComplete;
    }

    // if cleanup is set, it implies that it should not continue after recovery
    function exitAfterComplete() {
        return cleanupType != null;
    }

    function testContext() {
        return {
            _retryState,
            _recoveryBatchCompleted,
            _setId,
            _waitForRecoveryBatchCompletion,
            _sliceComplete,
        };
    }

    return {
        getSlicerStartingPosition,
        initialize,
        getSlice,
        getSlices,
        sliceCount,
        exitAfterComplete,
        recoveryComplete,
        handle,
        shutdown,
        __test_context: testContext,
    };
}

module.exports = recovery;
