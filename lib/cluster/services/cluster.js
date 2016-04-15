'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var event = require('../../utils/events');
var shortid = require('shortid');
var Queue = require('../../utils/queue');

module.exports = function(context, server) {
    var io = require('socket.io')(server);
    var logger = context.logger;
    var configTimeout = context.sysconfig.teraslice.cluster.timeout;
    var pendingWorkerRequests = new Queue();

    var cluster_state = {};

    io.on('connection', function(socket) {
        socket.on('node_master:node_online', function(data) {
            logger.info('node ', data.node_id, ' has connected to cluster master');
            socket.join(data.node_id);
            socket.node_id = data.node_id;
            cluster_state[data.node_id] = data;
            //if new node comes online, check if jobs need more workers
            event.emit('cluster:available_workers')
        });

        socket.on('node_master:job_finished', function(data) {
            //remove any pending worker request on completed jobs
            pendingWorkerRequests.remove(data.job_id);
            event.emit('cluster:job_finished', data.job_id);
            io.emit('cluster_service:stop_job', {job_id: data.job_id});
            //if errors in slices, emit error event
            if (data.errors.length > 0) {
                event.emit('slicer:slice_failure', data)
            }
        });

        socket.on('node_master:node_state', function(data) {
            cluster_state[data.node_id] = data;
            event.emit('cluster:available_workers')
        });

        socket.on('disconnect', function() {
            logger.info('node ' + socket.node_id + ' has disconnected');
            delete cluster_state[socket.node_id];
        });

        socket.on('node_master:message_processed', function(data) {
            //emitting the unique msg id to allow easier listener cleanup
            event.emit(data._msgID, data)
        });

        socket.on('node_master:over_allocated_workers', function(requestData) {
            //TODO check that job is still running
            pendingWorkerRequests.enqueue(requestData);
        });

        socket.on('error', function(ev) {
            logger.error(ev)
        })

    });

    setInterval(function() {
        io.emit('cluster_service:get_node_state')
    }, 5000);


    function getClusterState() {
        return _.cloneDeep(cluster_state);
    }

    function checkForSlicer(node) {
        var obj = {hasSlicer: false, num: 0, id: node.id, available: node.available};

        return node.active.reduce(function(prev, curr) {
            if (curr.assignment === 'slicer') {
                prev.hasSlicer = true;
                prev.num++;
            }
            return prev;
        }, obj);

    }

    function findNodeForSlicer(stateArray) {
        var slicerNode = null;

        for (var i = 0; i < stateArray.length; i++) {
            if (stateArray[i].available > 0) {

                var node = checkForSlicer(stateArray[i]);

                if (!node.hasSlicer) {
                    slicerNode = stateArray[i].node_id;
                    break;
                }
            }
        }

        //if all nodes have a slicer
        if (!slicerNode) {
            //list is already sorted by num available since stateArray is sorted
            slicerNode = stateArray[0].node_id;
        }

        return slicerNode;
    }

    function findNodesForJob(job_id, slicer_only) {
        var nodes = [];

        _.forOwn(cluster_state, function(node) {
            var hasJob = node.active.filter(function(worker) {
                if (slicer_only) {
                    return worker.job_id === job_id && worker.assignment === 'slicer';
                }
                else {
                    return worker.job_id === job_id;
                }
            });

            if (hasJob.length >= 1) {
                nodes.push({node_id: node.node_id, job_id: job_id, hostname: node.hostname, workers: hasJob})
            }
        });

        return nodes
    }

    function availableWorkers(all_workers) {
        var num = 0;
        //need to prevent job service from starting more jobs while workers are still needed for existing jobs
        if (pendingWorkerRequests.size() === 0) {

            var key = all_workers ? 'total' : 'available';

            _.forOwn(cluster_state, function(node) {
                num += node[key];
            });
        }

        return num;
    }

    function allWorkers() {
        //total number of workers function
        return availableWorkers(true)
    }

    function allNodes() {
        return Object.keys(cluster_state);
    }

    //TODO refactor this to use notifyNode
    function findPort(node_id) {
        return notifyNode(node_id, 'cluster_service:get_open_port', {});
    }

    function notifyNode(node_id, msg, msgData) {

        return new Promise(function(resolve, reject) {
            //setting an unique id to know which message belongs to which
            msgData._msgID = shortid.generate();

            //set up the listener, since there is no clean way to have a dynamically named function or variable to
            //identify the correct function to remove on cleanup, we are listening on and emitting the unique id as key
            event.on(msgData._msgID, function(nodeMasterData) {
                //remove listener to prevent memory leaks
                event.removeAllListeners(msgData._msgID);
                resolve(nodeMasterData)
            });
            //send message
            io.sockets.in(node_id).emit(msg, msgData);

            //reject if timeout has been reached
            setTimeout(function() {
                //remove listener to prevent memory leaks
                event.removeAllListeners(msgData._msgID);
                reject("Error communicating with node: " + node_id + " . Could not " + msg + " data: " + JSON.stringify(msgData))
            }, configTimeout)
        })
    }

    function makeDispatch() {
        var methods = {};
        var dispatch = {};

        methods.set = function(node_id, numOfWorkers) {
            if (dispatch[node_id]) {
                dispatch[node_id] += numOfWorkers;
            }
            else {
                dispatch[node_id] = numOfWorkers;
            }
        };
        methods.getDispatch = function() {
            return dispatch;
        };

        return methods;
    }

    function allocateWorker(job) {
        var job_id = job.job_id;
        var jobStr = JSON.stringify(job);
        var sortedNodes = _.sortByOrder(cluster_state, 'available', 'desc');

        //since its sorted each time, the first should always have the most available
        var workerNodeID = sortedNodes[0].node_id;

        var data = {job: jobStr, job_id: job_id, workers: 1, node_id: workerNodeID, assignment: 'worker'};

        return notifyNode(workerNodeID, 'cluster_service:create_workers', data);
    }

    //designed to allocate additional workers, not any future slicers
    function allocateWorkers(job, numOfWorkersRequested) {
        var job_id = job.job_id;
        var jobStr = JSON.stringify(job);
        var sortedNodes = _.sortByOrder(cluster_state, 'available', 'desc');

        var availWorkers = availableWorkers(false);

        var dispatch = makeDispatch();

        while (numOfWorkersRequested > 0 && availWorkers > 0) {

            for (var i = 0; i < sortedNodes.length; i++) {
                //each iteration check if it can allocate
                if (numOfWorkersRequested > 0 && availWorkers > 0) {
                    if (sortedNodes[i].available >= 1) {
                        dispatch.set(sortedNodes[i].node_id, 1);
                        availWorkers -= 1;
                        numOfWorkersRequested -= 1;
                    }
                }
                else {
                    break;
                }
            }
        }
        //if left over worker requests, enqueue them, queue works based off of id, so it redundantly references job_id
        var workerData = {job: jobStr, id: job_id, job_id: job_id, workers: 1, assignment: 'worker'};

        while (numOfWorkersRequested > 0) {
            pendingWorkerRequests.enqueue(workerData);
            numOfWorkersRequested -= 1;
        }
        var results = [];

        _.forOwn(dispatch.getDispatch(), function(workerRequested, node_id) {
            var requestedWorkersData = {
                job: jobStr,
                id: job_id,
                job_id: job_id,
                node_id: node_id,
                workers: workerRequested,
                assignment: 'worker'
            };
            results.push(
                notifyNode(node_id, 'cluster_service:create_workers', requestedWorkersData)
                    .catch(function(ev) {
                        //TODO if a worker allocation failed, need to check if job is still running before enqueueing
                        logger.error('An error has occurred in allocating : ' + workerRequested + ' workers to node : ' + +node_id + ' , the worker request has been enqueued');
                        pendingWorkerRequests.enqueue(requestedWorkersData);
                    })
            )
        });

        //this will resolve successfully if one worker was actually allocated
        if (results.length > 0) {
            return Promise.some(results, 1);
        }
        // The queue could already have been cleared.
        return Promise.resolve([]);
    }


    function allocateSlicer(job, recover_job) {
        var sortedNodes = _.sortByOrder(cluster_state, 'available', 'desc');
        var slicerNodeID = findNodeForSlicer(sortedNodes);

        //need to mutate job so that workers will know the specific port and hostname of the created slicer
        return findPort(slicerNodeID).then(function(portObj) {
            job.slicer_port = portObj.port;
            job.slicer_hostname = cluster_state[slicerNodeID].hostname;

            var job_id = job.job_id;
            var jobStr = JSON.stringify(job);

            var data = {
                job: jobStr,
                job_id: job_id,
                workers: 1,
                slicer_port: portObj.port,
                node_id: slicerNodeID,
                assignment: 'slicer',
                recover_job: recover_job
            };

            //TODO figure out how to change the slicer_port, slicer_hostname and jobStr if the slicer creation fails
            return notifyNode(slicerNodeID, 'cluster_service:create_slicer', data);
        })

    }

    //TODO verify timing of dequeue vs job service allocation && race allocations of job finished but workers are enqueued afterwards
    var schedulePendingRequests = _.debounce(function() {
        if (pendingWorkerRequests.size()) {
            //TODO maybe implement a peek method, and dequeue after it happened
            var requestedWorker = pendingWorkerRequests.dequeue();
            var job = JSON.parse(requestedWorker.job);

            allocateWorkers(job, requestedWorker.workers)
                .catch(function(err) {
                    logger.error("Error processing pending requests. " + err);
                })

        }
    }, 500, {leading: false, trailing: true});

    event.on('cluster:available_workers', schedulePendingRequests);

    function removePendingRequests(job_id) {
        pendingWorkerRequests.remove(job_id);
    }

    return {
        getClusterState: getClusterState,
        availableWorkers: availableWorkers,
        allWorkers: allWorkers,
        allNodes: allNodes,
        allocateWorker: allocateWorker,
        allocateWorkers: allocateWorkers,
        allocateSlicer: allocateSlicer,
        findNodesForJob: findNodesForJob,
        notifyNode: notifyNode,
        removePendingRequests: removePendingRequests
    };
};

