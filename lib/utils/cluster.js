'use strict';

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

function hasSlicer(arr) {
    return arr.reduce(function(prev, curr) {
        if (curr.assignment === 'slicer') {
            return true
        }
        return prev;
    }, false)
}

function availableWorkers(clusterState) {
    var results = [];
    var slicerCreated = false;

    for (var key in clusterState) {
        var node = clusterState[key];
        var bool = hasSlicer(node.active);
        results.push({id: key, availavble: node.availavble, hasSlicer: bool})
    }

    return results;

}

function sendMessage(io, id, msg, data) {
    io.sockets.in(id).emit(msg, data)
}

//TODO need a lock to have correct clusterState to prevent race conditions
function distributeJob(clusterState, io, job, res) {
    var numOfWorkers = job.workers ? job.workers : 5;
    var numOfNodes = Object.keys(clusterState).length;
    var batch = Math.floor(numOfWorkers / numOfNodes);
    var hasMadeSlicer = false;

    var load = availableWorkers(clusterState);

    for (var key in clusterState) {
        if (clusterState[key].available > 0) {
            if(hasSlicer(clusterState[key].active)){

                sendMessage(io, key, 'create workers', {workers: batch, job: job})
            }

        }
    }

}

module.exports = {
    createNameSpace: createNameSpace,
    makeHostName: makeHostName,
    distributeJob: distributeJob
};