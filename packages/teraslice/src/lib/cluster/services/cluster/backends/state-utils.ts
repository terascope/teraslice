import _ from 'lodash';

export function iterateState(clusterState: any, cb: (input: any) => boolean) {
    // I clone here, because the code below accidentally modifies clusterState.
    // Not sure if this is the best chouice.
    console.dir({ clusterState, iterateState: true }, { depth: 40 })

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

export function findAllSlicers(clusterState: any) {
    return iterateState(
        clusterState,
        (worker) => worker.assignment === 'execution_controller'
    );
}

export function findWorkersByExecutionID(clusterState: any, exId: string) {
    return iterateState(
        clusterState,
        (worker) => worker.assignment === 'worker' && worker.ex_id === exId
    );
}

export function findSlicersByExecutionID(clusterState: any, exIdDict: any) {
    return iterateState(
        clusterState,
        (worker) => worker.assignment === 'execution_controller' && exIdDict[worker.ex_id]
    );
}
