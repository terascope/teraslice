'use strict';

const _ = require('lodash');

function _iterateState(clusterState, cb) {
    // I clone here, because the code below accidentally modifies clusterState.
    // Not sure if this is the best chouice.
    return _.chain(_.cloneDeep(clusterState))
        .filter((node) => node.state === 'connected')
        .map((node) => {
            const workers = node.active.filter(cb);

            return workers.map((worker) => {
                worker.node_id = node.node_id;
                worker.hostname = node.hostname;
                return worker;
            });
        })
        .flatten()
        .value();
}

function findAllSlicers(clusterState) {
    return _iterateState(
        clusterState,
        (worker) => worker.assignment === 'execution_controller'
    );
}

function findWorkersByExecutionID(clusterState, exId) {
    return _iterateState(
        clusterState,
        (worker) => worker.assignment === 'worker' && worker.ex_id === exId
    );
}

function findSlicersByExecutionID(clusterState, exIdDict) {
    return _iterateState(
        clusterState,
        (worker) => worker.assignment === 'execution_controller' && exIdDict[worker.ex_id]
    );
}

module.exports = {
    _iterateState, // Exporting so it can be tested
    findAllSlicers,
    findWorkersByExecutionID,
    findSlicersByExecutionID,
};
