'use strict';

var _ = require('lodash');

var cluster_state = {};


function set_state(id, data) {
    cluster_state[id] = data;
}

function nodeDisconnected(id) {
    delete cluster_state[id]
}

function getClusterState() {
    return cluster_state;
}

function checkForSlicer(node) {
    var obj = {hasSlicer: false, num: 0, id: node.id, available: node.availavble};

    return node.active.reduce(function(prev, curr) {
        if (curr.assignment === 'slicer') {
            prev.hasSlicer = true;
            prev.num++;
        }
        return prev;
    }, obj);

}

function findPort(clusterState, id, port) {
    var node = clusterState[id];
    var currentSlicers = node.active.filter(function(obj) {
        return obj.assignment === 'slicer'
    }).length;

    return port + currentSlicers;

}

function findNodeForSlicer(stateArray) {
    var slicerNode = null;

    for (var i = 0; i < stateArray.length; i++) {
        if (stateArray[i].available > 0) {

            var node = checkForSlicer(stateArray[i]);

            if (!node.hasSlicer) {
                slicerNode = stateArray[i].node_id;
                stateArray[i].available -= 1;
                break;
            }
        }
    }

    //if all nodes have a slicer
    if (!slicerNode) {
        //list is already sorted by num available since stateArray is sorted
        slicerNode = stateArray[0].worker_id;
        stateArray[0].available -= 1;
    }

    return slicerNode;
}

function allocateWorkers(clusterState, jobRequest, sortedCLusterNodes, id) {
    var dispatch = {};
    var sortedNodes = sortedCLusterNodes ? sortedCLusterNodes : _.sortByOrder(clusterState, 'available', 'desc');
    var results = [];

    //being called for a single job
    if (id) {
        var numOfWorkers = jobRequest[id].requestedWorkers;

        var numOfNodes = Object.keys(clusterState).length;
        var batch = Math.floor(numOfWorkers / numOfNodes);
        var availableWorkers = getNumOfWorkersAvailable(clusterState);

        while (availableWorkers > 0 && numOfWorkers > 0) {
            sortedNodes.forEach(function(node) {
                if (node.available >= batch && numOfWorkers >= batch) {
                    dispatch[node.node_id] = batch;
                    numOfWorkers -= batch;
                    availableWorkers -= batch;
                    //mutative so recursive calls for other jobRequest do not get double allocations
                    node.available -= batch;
                }
                else if (node.available < batch && node.available > 0 && numOfWorkers > 0) {
                    dispatch[node.node_id] = node.available;
                    numOfWorkers -= node.available;
                    availableWorkers -= node.available;
                    //mutative so recursive calls for other jobRequest do not get double allocations
                    node.available = 0;
                }
            });
        }
        _.forOwn(dispatch, function(value, key) {
            results.push({key: key, workers: value, id: id})
        });

        return results;
    }
    else {
        _.forOwn(jobRequest, function(value, key) {
            results = results.concat(allocateWorkers(clusterState, jobRequest, sortedNodes, key))
        });

        return results;
    }
}

function findNodesWithJob(id, bool) {
    var nodes = [];

    _.forOwn(cluster_state, function(node) {
        var hasJob = node.active.filter(function(worker) {
            if (bool) {
                return worker.job_id === id;
            }
            else {
                return worker.job_id === id && worker.assignment === 'slicer';
            }
        });

        if (hasJob.length >= 1) {
            nodes.push({node_id: node.node_id, job_id: id, hostname: node.hostname, workers: hasJob})
        }
    });

    return nodes
}

function availableWorkers() {
    var num = 0;

    _.forOwn(cluster_state, function(value, key) {
        num += value.available;
    });

    return num;
}

function allWorkers() {

}

function allNodes() {
    return Object.keys(cluster_state);
}

function allocateWorker() {

}

function allocateSlicer() {
    var sortedNodes = _.sortByOrder(cluster_state, 'available', 'desc');

    var slicerNode = findNodeForSlicer(sortedNodes);

}

module.exports = {
    set_state: set_state,
    nodeDisconnected: nodeDisconnected,
    getClusterState: getClusterState,
    availableWorkers: availableWorkers,
    allWorkers: allWorkers,
    allNodes: allNodes,
    allocateWorker: allocateWorker,
    allocateSlicer: allocateSlicer
};
