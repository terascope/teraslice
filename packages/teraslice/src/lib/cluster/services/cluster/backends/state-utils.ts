import _ from 'lodash';
import type { ClusterState } from '../../../../../interfaces.js';

export function iterateState(clusterState: ClusterState, cb: (input: any) => boolean) {
    // I clone here, because the code below accidentally modifies clusterState.
    // Not sure if this is the best choice.

    return _.chain(_.cloneDeep(clusterState))
        .filter((node) => node.state === 'connected')
        .map((node) => {
            const workers = node.active.filter(cb);

            return workers.map((worker: any) => {
                worker.node_id = node.node_id;
                worker.hostname = node.hostname;
                return worker;
            });
        })
        .flatten()
        .value();
}

export function findAllSlicers(clusterState: ClusterState) {
    return iterateState(
        clusterState,
        (worker) => worker.assignment === 'execution_controller'
    );
}

export function findWorkersByExecutionID(clusterState: ClusterState, exId: string) {
    return iterateState(
        clusterState,
        (worker) => worker.assignment === 'worker' && worker.ex_id === exId
    );
}

export function findSlicersByExecutionID(clusterState: ClusterState, exIdDict: any) {
    return iterateState(
        clusterState,
        (worker) => worker.assignment === 'execution_controller' && exIdDict[worker.ex_id]
    );
}
