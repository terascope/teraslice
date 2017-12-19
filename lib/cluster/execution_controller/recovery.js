'use strict';

const Promise = require('bluebird');

module.exports = function module(executionModules) {
    const context = executionModules.context;
    const messaging = executionModules.messaging;
    const executionAnalytics = executionModules.executionAnalytics;
    const exStore = executionModules.exStore;
    const stateStore = executionModules.stateStore;
    const recoverExecution = process.env.recover_execution;
    const events = context.apis.foundation.getSystemEvents();
    const exId = process.env.ex_id;

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
        const errorMeta = exStore.failureMeta('there were errors processing a slice in recovery mode', slicerAnalytics);
        exStore.setStatus(exId, 'failed', errorMeta);
    }

    function getSlicerStartingPosition(numOfSlicersToRecover) {
        const recoveredSlices = [];
        for (let i = 0; i < numOfSlicersToRecover; i += 1) {
            recoveredSlices.push(stateStore.executionStartingSlice(recoverExecution, i));
        }
        return Promise.all(recoveredSlices);
    }

    function _setId(slice) {
        retryState[slice.slice_id] = true;
    }

    function fetchIncompleteSlices(slicerID) {
        return stateStore.recoverSlices(recoverExecution, slicerID)
            .then((slices) => {
                slices.forEach(_setId);
                return slices;
            });
    }

    function recoveryComplete() {
        return Object.keys(retryState).length === 0;
    }

    return {
        initialize,
        fetchIncompleteSlices,
        getSlicerStartingPosition,
        recoveryComplete
    };
};
