'use strict';

const _ = require('lodash');

function _iterateState(clusterState, cb) {
    // I clone here, because the code below accidentally modifies clusterState.
    // Not sure if this is the best chouice.
    return _.chain(_.cloneDeep(clusterState))
        .filter(node => node.state === 'connected')
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
        worker => worker.assignment === 'execution_controller'
    );
}

function findWorkersByExecutionID(clusterState, exId) {
    return _iterateState(
        clusterState,
        worker => worker.assignment === 'worker' && worker.ex_id === exId
    );
}

function findSlicersByExecutionID(clusterState, exIdDict) {
    return _iterateState(
        clusterState,
        worker => worker.assignment === 'execution_controller' && exIdDict[worker.ex_id]
    );
}

function newGetSlicerStats(clusterState, context, messaging) {
    return function getSlicerStats(exIds, specificId) {
        return new Promise(((resolve, reject) => {
            let timer;
            const nodeQueries = [];
            const exIdDict = exIds.reduce((prev, curr) => {
                prev[curr] = curr;
                return prev;
            }, {});
            const list = findSlicersByExecutionID(clusterState, exIdDict);
            const numberOfCalls = list.length;

            if (numberOfCalls === 0) {
                if (specificId) {
                    const error = new Error(`Could not find active slicer for ex_id: ${specificId}`);
                    error.code = 404;
                    reject(error);
                } else {
                    // for the general slicer stats query, just return a empty array
                    resolve([]);
                }
                return;
            }

            _.each(list, (slicer) => {
                const msg = {
                    to: 'execution_controller',
                    // use pod_ip as address (k8s), otherwise, use node_id
                    address: _.get(slicer, 'pod_ip', slicer.node_id),
                    message: 'cluster:slicer:analytics',
                    payload: { ex_id: slicer.ex_id },
                    response: true
                };
                nodeQueries.push(messaging.send(msg));
            });

            function formatResponse(msg) {
                const payload = _.get(msg, 'payload', {});
                const identifiers = { ex_id: msg.ex_id, job_id: msg.job_id, name: payload.name };
                return Object.assign(identifiers, payload.stats);
            }

            Promise.all(nodeQueries)
                .then((results) => {
                    clearTimeout(timer);
                    const formatedData = results.map(formatResponse);
                    const sortedData = _.sortBy(formatedData, ['name', 'started']);
                    const reversedData = sortedData.reduce((prev, curr) => {
                        prev.push(curr);
                        return prev;
                    }, []);
                    resolve(reversedData);
                })
                .catch((err) => {
                    clearTimeout(timer);
                    err.code = 500;
                    reject(err);
                });

            timer = setTimeout(() => {
                const error = new Error('Timeout has occurred for query');
                error.code = 500;
                reject(error);
            }, context.sysconfig.teraslice.action_timeout);
        }));
    };
}


module.exports = {
    _iterateState, // Exporting so it can be tested
    findAllSlicers,
    findWorkersByExecutionID,
    findSlicersByExecutionID,
    newGetSlicerStats
};
