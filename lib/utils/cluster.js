'use strict';

var _ = require('lodash');
var makeLogName = require('./config').makeLogName;

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

//TODO check to see if we need atomic worker allocations
//TODO error handling if clusterState changes or cluster failure during job allocations
function distributeJob(context, clusterState, io, res, job, jobRequest) {
    var jobName = makeLogName(context, job, '*');
    var numOfWorkers = job.workers ? job.workers : 5;
    var sysconfig = context.sysconfig;
    var logger = context.logger;

    var canDistributeJob = getNumOfWorkersAvailable(clusterState) >= 2;

    //TODO this needs to be in validations
    /*if (numOfWorkers < 2) {
     res.status(400).send('The minimum amount of workers needed for a job is 2, please change the amount of workers ' +
     'in the job config');
     return
     }*/

    //only adding to jobRequest after we have done an allocation through distributeJob
    if (canDistributeJob) {

        var sortedNodes = _.sortByOrder(clusterState, 'available', 'desc');

        //findNodeForSlicer mutates sortedNodes to reflect slicer
        var slicerNodeID = findNodeForSlicer(sortedNodes);
        job.slicer_hostname = clusterState[slicerNodeID].hostname;
        //TODO not currently checking if port is actually available on the other machine
        job.slicer_port = findPort(clusterState, slicerNodeID, sysconfig.teraslice.port);
        var jobStr = JSON.stringify(job);

        jobRequest[job.__id] = {requestedWorkers: numOfWorkers, job: jobStr};
        var dispatch = allocateWorkers(clusterState, jobRequest, sortedNodes, job.__id);

        sendMessage(io, slicerNodeID, 'create slicer', {job: jobStr});

        _.each(dispatch, function(node) {
            sendMessage(io, node.key, 'create workers', {workers: node.workers, job: jobStr})
        });

        res.status(202).json({id: job.__id, logs_index: jobName})

    }
    else {
        logger.info(' There are not enough workers available, job is enqueued');
        setTimeout(function() {
            distributeJob(context, clusterState, io, res, job, jobName, jobRequest)
        }, 5000)
    }
}

function getNumOfWorkersAvailable(jobRequest) {
    var num = 0;

    _.forOwn(jobRequest, function(value, key) {
        num += value.available;
    });

    return num;
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

function outstandingJobRequests(io, clusterState, jobRequest) {
    if (Object.keys(jobRequest).length > 0) {
        var results = allocateWorkers(clusterState, jobRequest, null, null);

        //NOTE this only handles worker allocations, not additional slicers
        _.each(results, function(node) {
            console.log('what node', node);
            sendMessage(io, node.key, 'create workers', {workers: node.workers, job: jobRequest[node.id].job})
            jobRequest[node.id].requestedWorkers -= node.workers;

            if (jobRequest[node.id].requestedWorkers === 0) {
                delete jobRequest[node.id]
            }
        });
    }
}

function findNodesWithJob(clusterState, id) {
    var nodes = [];
    _.forOwn(clusterState, function(node) {
        var hasJob = node.active.filter(function(worker) {
            return worker.job_id === id && worker.assignment === 'slicer';
        });

        if (hasJob.length >= 1) {
            nodes.push({id: node.id, hostname: node.hostname, slicers: hasJob})
        }
    });

    return nodes
}

function jobAction(req, res, io, clusterState) {
    var job_id = req.params.id;
    var action = req.query.action;
    var message;

    if (!action) {
        res.status(400).send('Error: No action was provided in request')
    }

    if (action === 'pause') {
        message = 'pause slicer'
    }

    if (action === 'resume') {
        message = 'resume slicer'
    }

    if (action === 'restart') {
        message = 'restart slicer'
    }

    if (!message) {
        res.status(400).send('Error: Incorrect action provided')
    }

    if (!job_id) {
        res.status(400).send('Error: No job id provided')
    }

    var nodes = findNodesWithJob(clusterState, job_id);

    if (nodes.length === 0) {
        res.status(404).send('No active job was found with the provided id: ' + job_id + ' \n the job may ' +
            'have finished or the id provided was incorrect \n');
    }
    else {
        nodes.forEach(function(node) {
            io.sockets.in(node.id).emit(message, node.slicers)
        });

        res.status(202).send('Action: ' + action + ' has been accepted')
    }

}

module.exports = {
    createNameSpace: createNameSpace,
    makeHostName: makeHostName,
    distributeJob: distributeJob,
    findNodeForSlicer: findNodeForSlicer,
    allocateWorkers: allocateWorkers,
    outstandingJobRequests: outstandingJobRequests,
    jobAction: jobAction
};
