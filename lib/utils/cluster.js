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

    return numOfAvailable >= 2;
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
//TODO check to see if we need atomic worker allocations
//TODO error handling if clusterState changes or cluster failure during job allocations
function distributeJob(context, clusterState, io, res, job, jobName, jobRequest) {
    var numOfWorkers = job.workers ? job.workers : 5;
    var numOfNodes = Object.keys(clusterState).length;
    var batch = Math.floor(numOfWorkers / numOfNodes);
    var sysconfig = context.sysconfig;
    var logger = context.logger;

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
            if (numOfWorkers > 0) {
                if (node.available >= batch && numOfWorkers >= batch) {
                    dispatch[node.id] = batch;
                    numOfWorkers -= batch;
                }
                else if (node.available < batch && node.available > 0 && numOfWorkers > 0) {
                    dispatch[node.id] = node.available;
                    numOfWorkers -= node.available;
                }
            }
        });

        //TODO this is duplicate
        sortedNodes.forEach(function(node) {
            if (numOfWorkers > 0) {
                if (node.available >= batch && numOfWorkers >= batch) {
                    dispatch[node.id] = batch;
                    numOfWorkers -= batch;
                }
                else if (node.available < batch && node.available > 0 && numOfWorkers > 0) {
                    dispatch[node.id] = node.available;
                    numOfWorkers -= node.available;
                }
            }
        });

        job.slicer_hostname = clusterState[slicerNodeID].hostname;
        job.slicer_port = findPort(clusterState, slicerNodeID, sysconfig.teraslice.port);

        var jobStr = JSON.stringify(job);

        sendMessage(io, slicerNodeID, 'create slicer', {job: jobStr});

        _.forOwn(dispatch, function(value, key) {
            sendMessage(io, key, 'create workers', {workers: value, job: jobStr})

        });

        //if all workers have not been assigned, note in in jobRequest obj to add workers as they become available
        if (numOfWorkers > 0) {
            jobRequest[job.__id] = {requestedWorkers: numOfWorkers, job: jobStr};
        }

        res.status(202).json({id: job.__id, logs_index: jobName})

    }
    else {
        //TODO review this, might need to add enqueueing logic
        logger.info(' There are not enough workers available, job is enqueued');
        setTimeout(function() {
            distributeJob(context, clusterState, io, res, job, jobName, jobRequest)
        }, 5000)

    }

}
//we will only one worker per function call to avoid multiple creation of the same worker
function allocateWorkers(io, jobRequest, data) {
    var deleteId;

    if (data.available > 0) {

        //looping only to get values without knowing key
        for (var id in jobRequest) {
            sendMessage(io, data.id, 'create workers', {workers: 1, job: jobRequest[id].job});

            //TODO need to determine if worker was actually made before removing or decrementing

            jobRequest[id].requestedWorkers -= 1;

            if (jobRequest[id].requestedWorkers === 0) {
                deleteId = id;
            }

            break;
        }

        if (deleteId) {
            delete jobRequest[deleteId]
        }
    }
}

function outstandingJobRequests(io, jobRequest, data) {
    if (Object.keys(jobRequest).length > 0) {
        allocateWorkers(io, jobRequest, data)
    }
}

module.exports = {
    createNameSpace: createNameSpace,
    makeHostName: makeHostName,
    distributeJob: distributeJob,
    findNodeForSlicer: findNodeForSlicer,
    allocateWorkers: allocateWorkers,
    outstandingJobRequests: outstandingJobRequests
};
