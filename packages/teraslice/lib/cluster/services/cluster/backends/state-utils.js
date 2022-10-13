import _ from 'lodash';

export function _iterateState(clusterState, cb) {
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

export function findAllSlicers(clusterState) {
    return _iterateState(
        clusterState,
        (worker) => worker.assignment === 'execution_controller'
    );
}

export function findWorkersByExecutionID(clusterState, exId) {
    return _iterateState(
        clusterState,
        (worker) => worker.assignment === 'worker' && worker.ex_id === exId
    );
}

export function findSlicersByExecutionID(clusterState, exIdDict) {
    return _iterateState(
        clusterState,
        (worker) => worker.assignment === 'execution_controller' && exIdDict[worker.ex_id]
    );
}
