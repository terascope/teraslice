'use strict';

const _ = require('lodash');

const parseError = require('@terascope/error-parser');


function _iterateState(clusterState, cb) {
    return _.chain(clusterState)
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
    // eslint-disable-next-line no-undef
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
                    reject({ message: `Could not find active slicer for ex_id: ${specificId}`, code: 404 });
                } else {
                    // for the general slicer stats query, just return a empty array
                    resolve([]);
                }
                return;
            }
            _.each(list, (slicer) => {
                const msg = { ex_id: slicer.ex_id };
                nodeQueries.push(messaging.send({
                    to: 'execution_controller',
                    address: slicer.node_id,
                    message: 'cluster:slicer:analytics',
                    payload: msg,
                    response: true
                }));
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
                .catch(err => reject({ message: parseError(err), code: 500 }));

            timer = setTimeout(() => {
                reject({ message: 'Timeout has occurred for query', code: 500 });
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
