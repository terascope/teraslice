'use strict';

const _ = require('lodash');
const fs = require('fs');
const Api = require('kubernetes-client');
const parseError = require('error_parser');
const Promise = require('bluebird');
// const Queue = require('queue');

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */

module.exports = function module(context, messaging, executionService) {
    // FIXME: This should come from Teraslice configuration
    const k8sApi = new Api.Api({
        url: `https://${process.env.KUBERNETES_SERVICE_HOST}:${process.env.KUBERNETES_SERVICE_PORT}`,
        ca: fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt'),
        auth: { bearer: fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token') },
        version: 'v1' // Defaults to 'v1'
    });

    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger(
        { module: 'kubernetes_cluster_service' }
    );
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
        clusterState = {};

        return k8sApi.group('v1').namespaces('default').pods
            .get({ qs: { labelSelector: 'app=teraslice' } })
            .then((result) => {
                // Start by adding all k8s nodes
                // We have to do this in a seperate loop to preserve the active
                // list.
                // NOTE: by using the pods API, only nodes which currently have
                // running pods will show up in the nodes list.  If we used the
                // nodes api we would see all nodes.  Sadly this version of the
                // k8s node client did not implement the nodes endpoint.
                // Maybe this changes in newer releases.  It's probably best to
                // avoid looping over the list of pods twice if possible.
                result.items.forEach((element) => {
                    clusterState[element.status.hostIP] = {
                        node_id: element.status.hostIP,
                        hostname: element.status.hostIP,
                        pid: 1,
                        node_version: 'N/A',
                        teraslice_version: 'N/A',
                        total: 42,
                        state: 'connected', // FIXME: I had set this to
                                            // k8s_connected but that wouldn't
                                            // work because
                                            // execution._iterateState() expects
                                            // it to be connected.
                        available: 42,
                        active: []
                    };
                });

                // next add workers
                result.items.forEach((element) => {
                    const worker = {
                        worker_id: element.metadata.name,
                        assignment: '<ASSIGNMENT>',
                        pid: element.metadata.name,
                        ex_id: element.metadata.labels.exId,
                        job_id: element.metadata.labels.jobId,
                        assets: []
                    };

                    if (element.metadata.labels.nodeType === 'slicer') {
                        worker.assignment = 'execution_controller';
                        // NOTE: I had initially created these but then had to
                        //   comment them out because they are ADDED later by
                        //   _iterateState, which seems like a mistake to me.
                        // worker.node_id = element.metadata.name;
                        // worker.hostname = element.metadata.name;
                    } else if (element.metadata.labels.nodeType === 'worker') {
                        worker.assignment = 'worker';
                    } else {
                        worker.assignment = 'unknown';
                    }
                    clusterState[element.status.hostIP].active.push(worker);
                });
            });
    }

    function getClusterStats() {
        return clusterStats;
    }

    // // FIXME: copied from native
    // function _iterateState(cb) {
    //     return _.chain(clusterState)
    //         .filter(node => node.state === 'connected')
    //         .map((node) => {
    //             const workers = node.active.filter(cb);
    //
    //             return workers.map((worker) => {
    //                 worker.node_id = node.node_id;
    //                 worker.hostname = node.hostname;
    //                 return worker;
    //             });
    //         })
    //         .flatten()
    //         .value();
    // }
    //
    // // FIXME: copied from native
    // function findSlicersByExecutionID(exIdDict) {
    //     return _iterateState(worker => worker.assignment === 'execution_controller' && exIdDict[worker.ex_id]);
    // }
    //
    // // FIXME: copied from native
    // function getSlicerStats(exIds, specificId) {
    //     return new Promise(((resolve, reject) => {
    //         let timer;
    //         const nodeQueries = [];
    //         const exIdDict = exIds.reduce((prev, curr) => {
    //             prev[curr] = curr;
    //             return prev;
    //         }, {});
    //         console.log(`exIdDict: ${JSON.stringify(exIdDict)}`);
    //         const list = JSON.stringify(findSlicersByExecutionID(exIdDict));
    //         console.log(`list: ${list}`);
    //         const numberOfCalls = list.length;
    //
    //         if (numberOfCalls === 0) {
    //             if (specificId) {
    //                 reject({ message: `Could not find active slicer for ex_id: ${specificId}`, code: 404 });
    //             } else {
    //                 // for the general slicer stats query, just return a empty array
    //                 resolve([]);
    //             }
    //         }
    //         _.each(list, (slicer) => {
    //             const msg = { ex_id: slicer.ex_id };
    //             nodeQueries.push(messaging.send({
    //                 to: 'execution_controller',
    //                 address: slicer.node_id,
    //                 message: 'cluster:slicer:analytics',
    //                 payload: msg,
    //                 response: true
    //             }));
    //         });
    //
    //         function formatResponse(msg) {
    //             const payload = msg.payload;
    //             const identifiers = { ex_id: msg.ex_id, job_id: msg.job_id, name: payload.name };
    //             return Object.assign(identifiers, payload.stats);
    //         }
    //
    //         Promise.all(nodeQueries)
    //             .then((results) => {
    //                 clearTimeout(timer);
    //                 resolve(results.map(formatResponse));
    //             })
    //             .catch(err => reject({ message: parseError(err), code: 500 }));
    //
    //         timer = setTimeout(() => {
    //             reject({ message: 'Timeout has occurred for query', code: 500 });
    //         }, context.sysconfig.teraslice.action_timeout);
    //     }));
    // }

    function getSlicerStats(exIds, specificId) { return {}; }

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

        return k8sApi.group(slicerService).ns('default').kind(slicerService)
            .post({ body: slicerService })
            .then(result => logger.info(`k8s slicer service submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s slicer service: ${error}`);
                return Promise.reject(error);
            })
            .then(() => k8sApi
                .group(slicerDeployment)
                .ns('default')
                .kind(slicerDeployment)
                .post({ body: slicerDeployment })
            )
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

        return k8sApi.group(workerDeployment).ns('default').kind(workerDeployment)
            .post({ body: workerDeployment })
            .then(result => logger.info(`k8s worker deployment submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s worker deployment: ${error}`);
                return Promise.reject(error);
            });
    }

    /**
     * Stops all workers for exId
     * NOTE: This is called both for the case of stopping a job and CTRL+C on
     * the cluster master, this later behaviour should probably be changed.
     * @param  {string} exId    The execution ID for this Execution
     * @param  {number} timeout Timeout for messaging the nodes in FIXME: units
     * @param  {[type]} exclude Nodes to exclude from messaging, on master??
     * @return {Promise}        [description]
     */
    function stopExecution(exId, timeout, exclude) {
        const excludeNode = exclude || null;
        const sendingMessage = { message: 'cluster:execution:stop' };
        if (timeout) {
            sendingMessage.timeout = timeout;
        }
        return _notifyNodesWithExecution(exId, sendingMessage, false, excludeNode);
    }

    /**
     * [_findNodesForExecution description]
     * @param       {string}  exId       Execution ID to match against workers
     * @param       {boolean} slicerOnly Set to true to return only the slicer
     * @return      {Array}              Array of Node objects
     */
    function _findNodesForExecution(exId, slicerOnly) {
        const nodes = [];
        _.forOwn(clusterState, (node) => {
            if (node.state !== 'disconnected') {
                const hasJob = node.active.filter((worker) => {
                    if (slicerOnly) {
                        return worker.ex_id === exId && worker.assignment === 'execution_controller';
                    }

                    return worker.ex_id === exId;
                });

                if (hasJob.length >= 1) {
                    nodes.push({
                        node_id: node.node_id,
                        ex_id: exId,
                        hostname: node.hostname,
                        workers: hasJob
                    });
                }
            }
        });

        return nodes;
    }

    // FIXME: this is copied from native.js
    function _notifyNodesWithExecution(exId, messageData, slicerOnly, excludeNode) {
        return new Promise(((resolve, reject) => {
            const destination = slicerOnly ? 'execution_controller' : 'node_master';
            let nodes = _findNodesForExecution(exId, slicerOnly);
            if (excludeNode) {
                nodes = nodes.filter(node => node.hostname !== excludeNode);
            }

            return Promise.map(nodes, (node) => {
                const sendingMsg = Object.assign({}, messageData, {
                    to: destination,
                    address: node.node_id,
                    ex_id: exId,
                    response: true
                });

                return messaging.send(sendingMsg);
            })
                .then(() => {
                    resolve(true);
                })
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error('could not notify cluster', errMsg);
                    reject(errMsg);
                });
        }));
    }

    const api = {
        getClusterState,
        getClusterStats,
        getSlicerStats,
        allocateWorkers,
        allocateSlicer,
        // shutdown,
        stopExecution,
        // pauseExecution,
        // resumeExecution,
        // removeWorkers,
        // addWorkers,
        // setWorkers,
        readyForAllocation,
        // clusterAvailable
    };

    function _initialize() {
        logger.info('Initializing');
        return Promise.resolve(api);
    }

    return _initialize();
};
