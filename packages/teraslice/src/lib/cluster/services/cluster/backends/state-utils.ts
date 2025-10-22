import { cloneDeep } from '@terascope/core-utils';
import type { ClusterState, WorkProcessNode } from '../../../../../interfaces.js';

export function iterateState(
    clusterState: ClusterState,
    cb: (input: any) => boolean
): WorkProcessNode[] {
    // I clone here, because the code below accidentally modifies clusterState.
    // Not sure if this is the best choice.
    const state = cloneDeep(clusterState);

    return Object.values(state)
        .filter((node) => node.state === 'connected')
        .flatMap((node) => {
            const workers = node.active.filter(cb);

            return workers.map((worker: any) => {
                worker.node_id = node.node_id;
                worker.hostname = node.hostname;
                return worker;
            });
        });
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
