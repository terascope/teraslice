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

    //temporary holding spot used to attach nodes that are non responsive or disconnect before final cleanup
    var droppedNodes = {};

    //TODO this is temp hack until we separate job from job execution
    var jobData = {};

    io.on('connection', function(socket) {

        socket.on('node_master:node_online', function(data) {
            logger.info('node ', data.node_id, ' has connected to cluster master');
            socket.join(data.node_id);
            socket.node_id = data.node_id;

            //if a reconnect happens stop timer
            if (droppedNodes[data.node_id]) {
                clearTimeout(droppedNodes[data.node_id]);
                delete droppedNodes[data.node_id];
            }

            cluster_state[data.node_id] = data;
            //if new node comes online, check if jobs need more workers
            event.emit('cluster:available_workers')
        });

        socket.on('node_master:node_state', function(data) {
            cluster_state[data.node_id] = data;
            event.emit('cluster:available_workers')
        });

        socket.on('node_master:message_processed', function(data) {
            //emitting the unique msg id to allow easier listener cleanup
            event.emit(data._msgID, data);
            //TODO check if i need to emit more things,

            if (data.action && data.action === 'cluster_service:stop_job') {
                //TODO this is temp hack until we seperate job from job execution
                delete jobData[data.job_id];
            }
        });

        socket.on('node_master:over_allocated_workers', function(requestData) {
            //TODO check that job is still running
            pendingWorkerRequests.enqueue(requestData);
        });

        socket.on('slicer:job_finished', function(data) {
            //remove any pending worker request on completed jobs
            pendingWorkerRequests.remove(data.job_id);

            //TODO this is temp hack until we seperate job from job execution
            delete jobData[data.job_id];

            io.emit('cluster_service:stop_job', data);
            //if errors in slices, emit error event
            if (data.errorCount > 0) {
                var message = 'job: ' + data.job_id + ' had ' + data.errorCount + ' slice failures during processing.';
                data.error = message;

                logger.warn(message);
                event.emit('cluster:job_failure', data)
            }
            else {
                event.emit('cluster:job_finished', data);
            }
        });

        socket.on('slicer:failed_recovery', function(data) {
            //remove any pending worker request
            pendingWorkerRequests.remove(data.job_id);
            io.emit('cluster_service:stop_job', {job_id: data.job_id});
            event.emit('cluster:job_failure', data);
            //TODO this is temp hack until we seperate job from job execution
            delete jobData[data.job_id];
        });

        socket.on('slicer:error', function(data) {
            pendingWorkerRequests.remove(data.job_id);
            io.emit('cluster_service:stop_job', {job_id: data.job_id});
            event.emit('cluster:job_failure', data);
            //TODO this is temp hack until we seperate job from job execution
            delete jobData[data.job_id];
        });

        socket.on('slicer:processing_error', function(data) {
            event.emit('slicer:processing_error', data)
        });

        socket.on('slicer:slicer_initialized', function(data) {
            event.emit('slicer:slicer_initialized', data)
        });

        socket.on('disconnect', function() {
            if (cluster_state[socket.node_id].active.length === 0) {
                logger.info('node ' + socket.node_id + ' has disconnected');
                delete cluster_state[socket.node_id];
            }
            else {
                cluster_state[socket.node_id].state = 'disconnected';

                var timer = setTimeout(function() {
                    cleanUpNode(socket.node_id);
                }, 5000);

                droppedNodes[socket.node_id] = timer;
            }
        });

        socket.on('error', function(ev) {
            logger.error(ev)
        })

    });

    setInterval(function() {
        io.emit('cluster_service:get_node_state')
    }, 5000);

    //used in tandem with cleanUpNode, after checking if job is still active
    event.on('add_to_workerQueue', function(data) {
        pendingWorkerRequests.enqueue(data)
    });

    function cleanUpNode(node_id) {
        //check workers and slicers
        var node = checkNode(cluster_state[node_id]);

        if (node.hasSlicer) {
            _.forIn(node.slicerJobID, function(value) {
                logger.warn('node ' + node_id + ' has disconnected with active slicer for job: ' + value + ' , ' +
                    'marking as failed and shutting down job');

                var data = {job_id: value, error: 'node_master where slicer resided has disconnected'};
                pendingWorkerRequests.remove(value);
                event.emit('cluster:job_failure', data);
                io.emit('cluster_service:stop_job', {job_id: value});
            });
        }

        _.forIn(node.workerJobID, function(value) {
            //looking for unique job_id's not in slicerJobID
            if (!node.slicerJobID[value]) {
                //emitting to job service, since cluster is instantiated before job service is ready
                var numOfWorkers = cluster_state[node_id].active.filter(function(worker) {
                    return worker.job_id === value;
                }).length;

                event.emit('cluster_service:check_job', {
                    job_id: value,
                    id: value,
                    node_id: node_id,
                    workers: numOfWorkers,
                    assignment: 'worker',
                    slicer_port: jobData[value].slicer_port,
                    slicer_hostname: jobData[value].slicer_hostname
                })
            }
        });

        //cleanup key so we don't get ever growing obj
        delete droppedNodes[node_id];

        delete cluster_state[node_id];
    }

    function getClusterState() {
        return _.cloneDeep(cluster_state);
    }

    function checkNode(node) {
        var obj = {
            hasSlicer: false,
            numOfSlicers: 0,
            slicerJobID: {},
            workerJobID: {},
            numOfWorkers: 0,
            id: node.id,
            available: node.available
        };

        return node.active.reduce(function(prev, curr) {
            if (curr.assignment === 'slicer') {
                prev.hasSlicer = true;
                prev.numOfSlicers++;
                prev.slicerJobID[curr.job_id] = curr.job_id;
            }

            if (curr.assignment === 'worker') {
                prev.numOfWorkers++;
                prev.workerJobID[curr.job_id] = curr.job_id;
            }

            return prev;
        }, obj);

    }

    //TODO duplicate nodes may still be chosen on multiple slicer allocation attempts
    function findNodeForSlicer(stateArray, errorNodes) {
        var slicerNode = null;
        for (var i = 0; i < stateArray.length; i++) {

            if (stateArray[i].available > 0 && !errorNodes[stateArray[i].node_id]) {

                var node = checkNode(stateArray[i]);

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

    //TODO need guard here is node is actually up and available
    function availableWorkers(all_workers, forceCheck) {
        var num = 0;
        //need to prevent job service from starting more jobs while workers are still needed for existing jobs
        if (pendingWorkerRequests.size() === 0 || forceCheck) {

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

    function findPort(node_id) {
        return notifyNode(node_id, 'cluster_service:get_open_port', {});
    }

    function removeFromQueue(id) {
        pendingWorkerRequests.remove(id)
    }

    function addToQueue(data) {
        pendingWorkerRequests.enqueue(data)
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

    function notifyNode(node_id, msg, msgData) {
        return new Promise(function(resolve, reject) {
            //setting an unique id to know which message belongs to which
            msgData._msgID = shortid.generate();

            //set up the listener, since there is no clean way to have a dynamically named function or variable to
            //identify the correct function to remove on cleanup, we are listening on and emitting the unique id as key
            event.on(msgData._msgID, function(nodeMasterData) {
                //remove listener to prevent memory leaks
                event.removeAllListeners(msgData._msgID);

                if (nodeMasterData.error) {
                    reject('Error: ' + nodeMasterData.error + ' occured on node: ' + nodeMasterData.node_id)
                }
                else {
                    resolve(nodeMasterData)
                }
            });
            //send message
            io.sockets.in(node_id).emit(msg, msgData);

            //reject if timeout has been reached
            setTimeout(function() {
                //remove listener to prevent memory leaks
                event.removeAllListeners(msgData._msgID);
                reject("Error communicating with node: " + node_id + " .\n Could not send msg: " + msg + "\n  data: " + JSON.stringify(msgData))
            }, configTimeout)
        })
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
        var sortedNodes = _.orderBy(cluster_state, 'available', 'desc');

        var availWorkers = availableWorkers(false, true);

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
        return Promise.all(results);
    }

    function createSlicer(job, recover_job, errorNodes) {
        var sortedNodes = _.orderBy(cluster_state, 'available', 'desc');
        var slicerNodeID = findNodeForSlicer(sortedNodes, errorNodes);

        //need to mutate job so that workers will know the specific port and hostname of the created slicer
        return findPort(slicerNodeID).then(function(portObj) {
            job.slicer_port = portObj.port;
            job.slicer_hostname = cluster_state[slicerNodeID].hostname;

            var job_id = job.job_id;
            var jobStr = JSON.stringify(job);

            //TODO this is temp hack until we seperate job from job execution
            jobData[job_id] = {slicer_port: portObj.port, slicer_hostname: cluster_state[slicerNodeID].hostname};

            var data = {
                job: jobStr,
                job_id: job_id,
                workers: 1,
                slicer_port: portObj.port,
                node_id: slicerNodeID,
                assignment: 'slicer',
                recover_job: recover_job
            };

            return notifyNode(slicerNodeID, 'cluster_service:create_slicer', data);
        })
    }


    function allocateSlicer(job, recover_job) {
        var retryCount = 0;
        var errorObj = {};
        return new Promise(function(resolve, reject) {

            function retry(errorNodes) {
                createSlicer(job, recover_job, errorNodes)
                    .then(function(results) {
                        resolve(results)
                    }).catch(function(err) {
                    retryCount += 1;

                    var nodeErr = err.split(':');
                    var nodeID = nodeErr[nodeErr.length - 1].trim();
                    errorNodes[nodeID] = nodeID;

                    if (retryCount >= 3) {
                        reject(err);
                    }
                    else {
                        retry(errorNodes)
                    }
                })
            }

            retry(errorObj);
        })
    }

    //TODO verify timing of dequeue vs job service allocation && race allocations of job finished but workers are enqueued afterwards
    var schedulePendingRequests = _.debounce(function() {
        if (pendingWorkerRequests.size() && availableWorkers(false, true) >= 1) {
            var requestedWorker = pendingWorkerRequests.dequeue();
            var job = JSON.parse(requestedWorker.job);

            allocateWorkers(job, requestedWorker.workers)
                .catch(function(err) {
                    logger.error("Error processing pending requests. " + err.stack);
                })

        }
    }, 500, {leading: false, trailing: true});

    event.on('cluster:available_workers', schedulePendingRequests);


    function shutdown() {
        logger.info("ClusterService: shutting down.");
        // TODO: this needs to only resolve once the cluster and service state
        // is actually ready to shutdown.
        return Promise.resolve(true);
    }

    function iterate_state(cb) {
        return _.chain(cluster_state)
            .filter(function(node) {
                return node.state === 'connected'
            })
            .map(function(node) {
                var workers = node.active.filter(cb);

                return workers.map(function(worker) {
                    worker.node_id = node.node_id;
                    worker.hostname = node.hostname;
                    return worker;
                })
            })
            .flatten()
            .value();
    }

    function findAllWorkers() {
        return iterate_state(_.identity);
    }

    function findAllSlicers() {
        var allSlicers = function(worker) {
            return worker.assignment === 'slicer';
        };

        return iterate_state(allSlicers)
    }

    function findAllByJobID(job_id) {
        var allByID = function(worker) {
            return worker.job_id === job_id;
        };

        return iterate_state(allByID)
    }

    function findWorkersByJobID(job_id) {
        var workersByJobID = function(worker) {
            return worker.assignment === 'worker' && worker.job_id === job_id;
        };

        return iterate_state(workersByJobID)
    }

    function findSlicersByJobID(job_id) {
        var slicerByJobID = function(worker) {
            return worker.assignment === 'slicer' && worker.job_id === job_id;
        };

        return iterate_state(slicerByJobID)
    }

    function removeWorkers(res, job_id, workerNum) {
        var dispatch = makeDispatch();
        var workers = findWorkersByJobID(job_id);
        var workerCount = workerNum;
        var workersData = workers.reduce(function(prev, curr) {
            if (!prev[curr.node_id]) {
                prev[curr.node_id] = 1;
            }
            else {
                prev[curr.node_id]++
            }
            prev._total++;

            return prev;
        }, {_total: 0});

        if (workerNum >= workersData._total && msg === 'remove') {
            res.status(400).json({
                error: 'workers to be removed:' + workerNum + ' cannot be >= to current workers: ' + workersData._total,
                message: error
            });
            return
        }

        while (workerCount) {
            _.forOwn(workersData, function(value, key) {
                if (key !== '_total') {
                    if (workersData[key] >= 1 && workerCount > 0) {
                        dispatch.set(key, 1);
                        workersData[key]--;
                        workerCount -= 1;
                    }
                }
            });
        }

        var nodes = dispatch.getDispatch();
        var results = _.map(nodes, function(val, key) {
            return notifyNode(key, 'cluster_service:remove_workers', {workers: val, job_id: job_id})
        });

        Promise.all(results)
            .then(function() {
                res.status(200).send(workerNum + ' workers have been released from job: ' + job_id)
            })
            .catch(function(err) {
                res.status(500).json({
                    error: JSON.stringify(err),
                    message: err
                });
            })
    }

    //TODO this is hack until we get job execution context
    function getJobInfo(job_id) {
        return jobData[job_id];
    }

    var api = {
        getClusterState: getClusterState,
        availableWorkers: availableWorkers,
        allWorkers: allWorkers,
        allNodes: allNodes,
        allocateWorker: allocateWorker,
        allocateWorkers: allocateWorkers,
        allocateSlicer: allocateSlicer,
        findNodesForJob: findNodesForJob,
        notifyNode: notifyNode,
        findAllSlicers: findAllSlicers,
        findAllWorkers: findAllWorkers,
        findAllByJobID: findAllByJobID,
        findWorkersByJobID: findWorkersByJobID,
        findSlicersByJobID: findSlicersByJobID,
        removeFromQueue: removeFromQueue,
        addToQueue: addToQueue,
        removeWorkers: removeWorkers,
        getJobInfo: getJobInfo,
        shutdown: shutdown
    };

    function _initialize() {
        // TODO: handle the initialization of the cluster and only
        // actually resolve the promise once everything is up and running.
        // Should be delays here as we wait for nodes to join and share their
        // state.
        logger.info("ClusterService: Initializing");
        return Promise.resolve(api);
    }

    return _initialize();
};

