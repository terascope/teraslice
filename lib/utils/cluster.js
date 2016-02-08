'use strict';

var _ = require('lodash');

function createNameSpace(job) {
    var jobName = job.name ? job.name : 'job';
    jobName = jobName.replace(' ', '').trim();
    var id = job.id;

    return jobName + id;
}

function makeHostName(hostname, port, nameSpace) {
    var name;

    if (!hostname.match(/http/)) {
        hostname = 'http://' + hostname;
    }

    var lastChar = hostname[hostname.length - 1];

    if (lastChar !== ':') {
        name = hostname + ':' + port;
    }
    else {
        name = hostname + port;
    }

    if (nameSpace) {
        return name + '/' + nameSpace
    }

    return name;
}

function sendMessage(io, id, msg, data) {
    io.sockets.in(id).emit(msg, data)
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

function canDistributeJob(clusterState) {
    var numOfAvailable = 0;

    for (var key in clusterState) {
        numOfAvailable += clusterState[key].available;
    }

    return numOfAvailable > 2;
}

function findNodeForSlicer(stateArray) {
    var slicerNode = null;

    for (var i = 0; i < stateArray.length; i++) {
        if (stateArray[i].available > 0) {

            var node = checkForSlicer(stateArray[i]);

            if (!node.hasSlicer) {
                slicerNode = stateArray[i].id;
                stateArray[i].available -= 1;
                break;
            }
        }
    }

    //if all nodes have a slicer
    if (!slicerNode) {
        //list is already sorted by num available since stateArray is sorted
        slicerNode = stateArray[0].id;
        stateArray[0].available -= 1;
    }

    return slicerNode;
}


//TODO need a lock to have correct clusterState to prevent race conditions
function distributeJob(clusterState, io, job, res, jobQueue) {
    var numOfWorkers = job.workers ? job.workers : 5;
    var numOfNodes = Object.keys(clusterState).length;
    var batch = Math.floor(numOfWorkers / numOfNodes);
    var dispatch = {};

    if (numOfWorkers < 2) {
        res.status(400).send('The minimum amount of workers needed for a job is 2, please change the amount of workers ' +
            'in the job config');
        return
    }

    if (canDistributeJob(clusterState)) {

        var sortedNodes = _.sortByOrder(clusterState, 'available', 'desc');

        //findNodeForSlicer mutates sortedNodes to reflect slicer
        var slicerNodeID = findNodeForSlicer(sortedNodes);

        sortedNodes.forEach(function(node) {
            if(numOfWorkers > 0) {
                if (node.available >= batch && numOfWorkers >= batch) {
                    dispatch[node.id] = batch;
                    numOfWorkers -= batch;
                }
                else if (node.available < batch && node.available > 0 && numOfWorkers > 0) {
                    dispatch[node.id] = node.available;
                    numOfWorkers -=  node.available;
                }
            }
        });

        sendMessage(io, slicerNodeID, 'create slicer', {job: job});
        _.forOwn(dispatch, function(value, key){
             sendMessage(io, key, 'create workers', {workers: value, job: job})

        });


    }
    else {
        //TODO need to add enqueueing logic
        res.stats(200).send(' There are not enough workers available, job will be enqueued')
    }

}

module.exports = {
    createNameSpace: createNameSpace,
    makeHostName: makeHostName,
    distributeJob: distributeJob,
    findNodeForSlicer: findNodeForSlicer
};