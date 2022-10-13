import {
    pRaceWithTimeout, logError, cloneDeep,
    Queue
} from '@terascope/utils';
import { makeLogger } from '../helpers/terafoundation';

export default function recoveryModule(context, stateStore, executionContext) {
    const events = context.apis.foundation.getSystemEvents();
    const slicersToRecover = executionContext.config.slicers;
    const recoveryQueue = new Queue();

    const cleanupType = executionContext.config.recovered_slice_type;
    const recoverExecution = executionContext.config.recovered_execution;
    const autorecover = Boolean(executionContext.config.autorecover);
    const { exId } = executionContext;

    let recoverComplete = true;
    let isShutdown = false;

    const logger = makeLogger(context, 'execution_recovery');

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
        return Object.values(retryState).every((v) => v === false);
    }

    function _retryState() {
        return cloneDeep(retryState);
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

    async function shutdown() {
        let checkInterval;

        try {
            await pRaceWithTimeout(
                new Promise((resolve) => {
                    checkInterval = setInterval(() => {
                        if (recoverComplete) {
                            resolve();
                        }
                    }, 100);
                }),
                context.sysconfig.teraslice.shutdown_timeout,
                (err) => { logError(logger, err); }
            );
        } finally {
            isShutdown = true;
            clearInterval(checkInterval);
        }
    }

    function recoveryComplete() {
        return recoverComplete;
    }

    /**
     * Whether or not the execution will continue to process
     * slices after recovering.
     *
     * @returns {boolean}
    */
    function exitAfterComplete() {
        if (autorecover) return false;
        if (!cleanupType) return false;
        return true;
    }

    function testContext() {
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
        getSlice,
        getSlices,
        sliceCount,
        exitAfterComplete,
        recoveryComplete,
        handle,
        shutdown,
        __test_context: testContext
    };
}
