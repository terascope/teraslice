'use strict';

const _ = require('lodash');
const k8s = require('./k8s');
const parseError = require('error_parser');
const Promise = require('bluebird');
const k8sState = require('./k8sState');
// const Queue = require('queue');

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */

module.exports = function kubernetesClusterBackend(context, messaging, executionService) {
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'kubernetes_cluster_service' });
    // const pendingWorkerRequests = new Queue();
    const slicerAllocationAttempts = context.sysconfig.teraslice.slicer_allocation_attempts;
    let clusterState = {};
    // ASG: clusterStats stores aggregated stats about what gets processed, when
    // a slice on any job fails, it gets recorded here.
    const clusterStats = {
        slicer: {
            processed: 0,
            failed: 0,
            queued: 0,
            job_duration: 0,
            workers_joined: 0,
            workers_disconnected: 0,
            workers_reconnected: 0
        }
    };

    // FIXME: Copied from native.js
    // Under the hood this makes a node join a room so messaging is possible
    messaging.register({
        event: 'node:online',
        identifier: 'node_id',
        callback: (data, nodeId) => {
            logger.info(`node ${nodeId} has connected`);
            // if a reconnect happens stop timer
            // if (droppedNodes[nodeId]) {
            //     clearTimeout(droppedNodes[nodeId]);
            //     delete droppedNodes[nodeId];
            // }
        }
    });

    // Periodically update cluster state, update period controlled by:
    //  context.sysconfig.teraslice.node_state_interval
    setInterval(() => {
        logger.trace('cluster_master requesting cluster state update.');
        _getClusterState();
    }, context.sysconfig.teraslice.node_state_interval);

    /**
     * getClusterState returns a copy of the clusterState object
     * @return {Object} a copy of the clusterState object
     */
    function getClusterState() {
        return _.cloneDeep(clusterState);
    }

    // FIXME: add a catch here??
    /**
     * Creates clusterState by iterating over all k8s pods with the label
     * `app=teraslice`
     * @constructor
     * @return      {Promise} [description]
     */
    function _getClusterState() {
        // we build clusterState fresh on every call, so we empty it out here
        // TODO: sometimes the ts-top output is blank because this is null
        //       briefly.
        clusterState = {};

        return k8s.getObj('app=teraslice', 'pods')
            .then((k8sPods) => { k8sState.gen(k8sPods, clusterState); });
    }

    function getClusterStats() {
        return clusterStats;
    }

    // FIXME: copied from native
    function _iterateState(cb) {
        return _.chain(clusterState)
            .filter(node => node.state === 'connected') // FIXME: remove
            .map((node) => {
                const workers = node.active.filter(cb);

                return workers.map((worker) => {
                    worker.node_id = worker.pod_ip;
                    worker.hostname = node.hostname;
                    return worker;
                });
            })
            .flatten()
            .value();
    }

    // FIXME: copied from native
    // finds workers of type execution_controller that match ex_id
    function findSlicersByExecutionID(exIdDict) {
        return _iterateState(worker => worker.assignment === 'execution_controller' && exIdDict[worker.ex_id]);
    }

    // FIXME: copied from native, there are minor differences, but I get the
    // feeling that there shouldn't be two copies of this.  Actually, it's
    // changed twice since I copied it.
    //
    // returns something like:
    // [{
    //     "ex_id": "ee8af472-1a09-4e00-ac0a-4d90317e56cc",
    //     "job_id": "4bc0c260-8519-467f-a66c-f0e024024084",
    //     "name": "gen-fifty-thousand",
    //     "workers_available": 0,
    //     "workers_active": 1,
    //     "workers_joined": 1,
    //     "workers_reconnected": 0,
    //     "workers_disconnected": 0,
    //     "failed": 0,
    //     "subslices": 0,
    //     "queued": 1,
    //     "slice_range_expansion": 0,
    //     "processed": 0,
    //     "slicers": 1,
    //     "subslice_by_key": 0,
    //     "started": "2018-04-23T15:35:43.292-07:00"
    // }]
    function getSlicerStats(exIds, specificId) {
        return new Promise(((resolve, reject) => {
            let timer;
            const nodeQueries = [];
            // NO CLUE what this is doing
            const exIdDict = exIds.reduce((prev, curr) => {
                prev[curr] = curr;
                return prev;
            }, {});
            const list = findSlicersByExecutionID(exIdDict);
            const numberOfCalls = list.length;

            if (numberOfCalls === 0) {
                if (specificId) {
                    reject({ message: `Could not find active slicer for ex_id: ${specificId}`, code: 404 });
                } else {
                    // for the general slicer stats query, just return a empty array
                    resolve([]);
                }
            }
            // loops over list of execution_controllers and messages them,
            // asking for their stats info
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
                const payload = msg.payload;
                const identifiers = { ex_id: msg.ex_id, job_id: msg.job_id, name: payload.name };
                return Object.assign(identifiers, payload.stats);
            }

            Promise.all(nodeQueries)
                .then((results) => {
                    clearTimeout(timer);
                    resolve(results.map(formatResponse));
                })
                .catch(err => reject({ message: parseError(err), code: 500 }));

            timer = setTimeout(() => {
                reject({ message: 'Timeout has occurred for query', code: 500 });
            }, context.sysconfig.teraslice.action_timeout);
        }));
    }

    /**
     * Return value indicates whether the cluster has enough workers to start
     * an execution.  It must be able to allocate a slicer and at least one
     * worker.
     * @return {boolean} Ok to create job?
     */
    function readyForAllocation() {
        // return _availableWorkers() >= 2;
        // FIXME: define what this means in k8s, for now just return true
        return true;
    }


    /**
     * Creates k8s Service and Deployment for the Teraslice Execution Controller
     * (formerly slicer).  This currently works by creating a service with a
     * hostname that contains the exId in it listening on a well known port.
     * The hostname and port are used later by the workers to contact this
     * Execution Controller.
     * @param  {[type]} execution        [description]
     * @param  {String} recoverExecution ex_id of old execution to be recovered
     * @return {Promise}                 [description]
     */
    function allocateSlicer(execution, recoverExecution) {
        const slicerName = `teraslice-slicer-${execution.ex_id}`;
        const slicerService = require('./services/slicer.json');
        const slicerDeployment = require('./deployments/slicer.json');

        // FIXME: extract this hard coded port out somewhere sensible
        execution.slicer_port = 45680;
        execution.slicer_hostname = slicerName;
        if (recoverExecution) execution.recover_execution = recoverExecution;

        slicerService.metadata.name = slicerName;
        slicerService.metadata.labels.exId = execution.ex_id;
        slicerService.metadata.labels.jobId = execution.job_id;
        slicerService.spec.selector.exId = execution.ex_id;

        slicerDeployment.metadata.name = slicerName;
        slicerDeployment.metadata.labels.exId = execution.ex_id;
        slicerDeployment.metadata.labels.jobId = execution.job_id;
        slicerDeployment.spec.selector.matchLabels.exId = execution.ex_id;
        slicerDeployment.spec.template.metadata.labels.exId = execution.ex_id;
        slicerDeployment.spec.template.metadata.labels.jobId = execution.job_id;
        slicerDeployment.spec.template.spec.containers[0].name = slicerName;
        slicerDeployment.spec.template.spec.containers[0].env[1].value = JSON.stringify(execution);

        return k8s.post(slicerService, 'service')
            .then(result => logger.info(`k8s slicer service submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s slicer service: ${error}`);
                return Promise.reject(error);
            })
            .then(() => k8s.post(slicerDeployment, 'deployment'))
            .then(result => logger.info(`k8s slicer deployment submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s slicer deployment: ${error}`);
                return Promise.reject(error);
            });
    }

    /**
     * Creates k8s deployment that executes Teraslice workers for specified
     * Execution.
     * @param  {Object} execution  Object that contains information of Execution
     * @param  {number} numWorkers number of workers to allocate
     * @return {Promise}           [description]
     */
    function allocateWorkers(execution, numWorkers) {
        // FIXME: Verify that this gets a fresh worker.json on every call
        const workerDeployment = require('./deployments/worker.json');
        const workerName = `teraslice-worker-${execution.ex_id}`;

        workerDeployment.metadata.name = workerName;
        workerDeployment.metadata.labels.exId = execution.ex_id;
        workerDeployment.metadata.labels.jobId = execution.job_id;
        workerDeployment.spec.replicas = numWorkers;
        workerDeployment.spec.selector.matchLabels.exId = execution.ex_id;
        workerDeployment.spec.template.metadata.labels.exId = execution.ex_id;
        workerDeployment.spec.template.metadata.labels.jobId = execution.job_id;
        workerDeployment.spec.template.spec.containers[0].name = workerName;
        workerDeployment.spec.template.spec.containers[0].env[1].value = JSON.stringify(execution);

        return k8s.post(workerDeployment, 'deployment')
            .then(result => logger.info(`k8s worker deployment submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s worker deployment: ${error}`);
                return Promise.reject(error);
            });
    }

    /**
     * Scales the k8s deployment for the specified exId to the desired number
     * of workers.
     * @param  {String} exId       exId of execution to scale
     * @param  {number} numWorkers [description]
     * @param  {String} op         [description]
     * @return {[type]}            [description]
     */
    function _scaleDeployment(exId, numWorkers, op) {
        const objType = 'deployments';
        logger.info(`Scaling exId: ${JSON.stringify(exId)}, op: ${op}, numWorkers: ${numWorkers}`);
        k8s.getObj(`nodeType=worker,exId=${exId}`, objType)
            .then((response) => {
                let newScale;
                logger.info(`k8s worker query Response: ${JSON.stringify(response)}`);

                // the selector above should always restule in a single item
                // in the response.
                // TODO: test for more than 1 and error
                const workerDeployment = response.items[0];
                const originalScale = workerDeployment.spec.replicas;
                logger.info(`Current Scale for exId=${exId}: ${originalScale}`);

                if (op === 'set') {
                    newScale = numWorkers;
                } else if (op === 'add') {
                    newScale = originalScale + numWorkers;
                } else if (op === 'remove') {
                    newScale = originalScale - numWorkers;
                } else {
                    logger.error('scaleDeployment only accepts the following operations: add, remove, set');
                }

                logger.info(`New Scale for exId=${exId}: ${newScale}`);
                const scalePatch = {
                    spec: {
                        replicas: newScale
                    }
                };
                return k8s.patch(scalePatch, workerDeployment.metadata.name)
                    .then(patchResponse => logger.warn(patchResponse));
            })
            .catch(err => logger.error(`Error finding kuberenetes worker for ${exId}: ${err}`));
        // FIXME: This returns without waiting on the k8s stuff, should it?
        return { action: op, ex_id: exId, workerNum: numWorkers };
    }

    function addWorkers(executionContext, numWorkers) {
        return _scaleDeployment(executionContext.ex_id, numWorkers, 'add');
    }


    // NOTE: This is passed exId instead of executionContext like addWorkers and
    // removeWorkers.  I don't know why, just dealing with it.
    function removeWorkers(exId, numWorkers) {
        return _scaleDeployment(exId, numWorkers, 'remove');
    }


    function setWorkers(executionContext, numWorkers) {
        return _scaleDeployment(executionContext.ex_id, numWorkers, 'set');
    }


    /**
     * Sends specified message to workers with exId.
     * TODO: In the kubernetes case it's a bit redundant to provide both a list
     * of workers and exId, since there is only one execution per worker node.
     * I should probably rethink this.
     * @param       {string} exId        Execution ID
     * @param       {string} messageData A 'cluster:execution:*' message
     * @param       {[type]} workers
     * @return      {Promise}
     */
    function _msgWorkersWithExId(exId, messageData, workers) {
        return Promise.map(workers, (worker) => {
            const sendingMsg = Object.assign({}, messageData, {
                to: 'execution_controller',
                address: worker.pod_ip,
                ex_id: exId,
                response: true
            });

            return messaging.send(sendingMsg);
        })
            .catch((err) => {
                const errMsg = parseError(err);
                logger.error('could not notify cluster', errMsg);
                return Promise.reject(errMsg);
            });
    }

    /**
     * Stops all workers for exId
     * @param  {string} exId    The execution ID of the Execution to stop
     * @param  {number} timeout Timeout for messaging the nodes in FIXME: units and meaning
     * @return {Promise}
     */
    function stopExecution(exId, timeout) {
        const stopMessage = { message: 'cluster:execution:stop' };
        if (timeout) {
            stopMessage.timeout = timeout;
        }
        const workers = _iterateState(worker => worker.ex_id === exId);
        // FIXME: This also needs to stop the worker pod
        return _msgWorkersWithExId(exId, stopMessage, workers);
    }

    function pauseExecution(exId) {
        const workers = _iterateState(worker => worker.assignment === 'execution_controller' && worker.ex_id === exId);
        return _msgWorkersWithExId(exId, { message: 'cluster:execution:pause' }, workers);
    }

    function resumeExecution(exId) {
        const workers = _iterateState(worker => worker.assignment === 'execution_controller' && worker.ex_id === exId);
        return _msgWorkersWithExId(exId, { message: 'cluster:execution:resume' }, workers);
    }

    const api = {
        getClusterState, // k8s
        getClusterStats,
        getSlicerStats,
        allocateWorkers, // k8s
        allocateSlicer, // k8s
        // shutdown,
        stopExecution,
        pauseExecution,
        resumeExecution,
        removeWorkers, // k8s
        addWorkers, // k8s
        setWorkers, // k8s
        readyForAllocation,
        // clusterAvailable
    };

    function _initialize() {
        logger.info('Initializing');
        return Promise.resolve(api);
    }

    return _initialize();
};
