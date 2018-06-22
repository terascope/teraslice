'use strict';

const _ = require('lodash');
const K8s = require('./k8s');
const parseError = require('error_parser');
const Promise = require('bluebird');
const k8sState = require('./k8sState');
const stateUtils = require('../state-utils');
// const Queue = require('queue');

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */

// FIXME: I want to write tests for this but I don't know how to deal with the
// messaging stuff

module.exports = function kubernetesClusterBackend(context, messaging, executionService) {
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'kubernetes_cluster_service' });
    const slicerAllocationAttempts = context.sysconfig.teraslice.slicer_allocation_attempts;
    let clusterState = {};

    // FIXME: clusterStats stores aggregated stats about what gets processed,
    // when a slice on any job fails, it gets recorded here.  What should this
    // do in the k8s case?
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
    const k8s = new K8s(logger);

    // Under the hood this makes a node join a room so messaging is possible
    messaging.register({
        event: 'node:online',
        identifier: 'node_id',
        callback: (data, nodeId) => {
            logger.info(`node ${nodeId} has connected`);
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

    /**
     * Creates clusterState by iterating over all k8s pods with the label
     * `app=teraslice`
     * @constructor
     * @return      {Promise} [description]
     */
    function _getClusterState() {
        return k8s.list('app=teraslice', 'pods')
            .then((k8sPods) => {
                // we build clusterState fresh on every call, so we empty it out
                // here
                clusterState = {};

                return k8sState.gen(k8sPods, clusterState);
            })
            .catch((err) => {
                // TODO: We might need to do more here.  I think it's OK to just
                // log though.  This only gets used to show slicer info through
                // the API.  We wouldn't want to disrupt the cluster master
                // for rare failures to reach the k8s API.
                logger.error(`Error listing teraslice pods in k8s: ${err}`);
            });
    }

    function getClusterStats() {
        return clusterStats;
    }


    /**
     * Return value indicates whether the cluster has enough workers to start
     * an execution.  It must be able to allocate a slicer and at least one
     * worker.
     * @return {boolean} Ok to create job?
     */
    function readyForAllocation() {
        // return _availableWorkers() >= 2;
        // TODO: This will be addressed in the future, see:
        //   https://github.com/terascope/teraslice/issues/744
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

        // TODO: This should try slicerAllocationAttempts times??
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


    // FIXME: These functions should probably do something with the response
    // FIXME: I find is strange that the expected return value here is
    //        effectively the same as the function inputs
    async function addWorkers(executionContext, numWorkers) {
        const response = await k8s.scaleExecution(executionContext.ex_id, numWorkers, 'add');
        return { action: 'add', ex_id: executionContext.ex_id, workerNum: numWorkers };
    }


    // NOTE: This is passed exId instead of executionContext like addWorkers and
    // removeWorkers.  I don't know why, just dealing with it.
    async function removeWorkers(exId, numWorkers) {
        const response = await k8s.scaleExecution(exId, numWorkers, 'remove');
        return { action: 'remove', ex_id: exId, workerNum: numWorkers };
    }


    async function setWorkers(executionContext, numWorkers) {
        const response = await k8s.scaleExecution(executionContext.ex_id, numWorkers, 'set');
        return { action: 'set', ex_id: executionContext.ex_id, workerNum: numWorkers };
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
    async function stopExecution(exId, timeout) {
        const stopMessage = { message: 'cluster:execution:stop' };
        if (timeout) {
            stopMessage.timeout = timeout;
        }
        const workers = stateUtils._iterateState(
            clusterState,
            worker => worker.ex_id === exId
        );
        const msgResponse = await _msgWorkersWithExId(exId, stopMessage, workers);
        const deleteResponse = await k8s.deleteExecution(exId);
        return msgResponse;
    }

    function pauseExecution(exId) {
        const workers = stateUtils._iterateState(
            clusterState,
            worker => worker.assignment === 'execution_controller' && worker.ex_id === exId
        );
        return _msgWorkersWithExId(exId, { message: 'cluster:execution:pause' }, workers);
    }

    function resumeExecution(exId) {
        const workers = stateUtils._iterateState(
            clusterState,
            worker => worker.assignment === 'execution_controller' && worker.ex_id === exId
        );
        return _msgWorkersWithExId(exId, { message: 'cluster:execution:resume' }, workers);
    }

    const getSlicerStats = stateUtils.newGetSlicerStats(clusterState, context, messaging);

    const api = {
        getClusterState,
        getClusterStats,
        getSlicerStats,
        allocateWorkers,
        allocateSlicer,
        // shutdown,  FIXME: ??
        stopExecution,
        pauseExecution,
        resumeExecution,
        removeWorkers,
        addWorkers,
        setWorkers,
        readyForAllocation,
        // clusterAvailable TODO: return false if k8s API unavailable, not in use
    };

    function _initialize() {
        logger.info('Initializing');
        return k8s.init().then(() => Promise.resolve(api));
    }

    return _initialize();
};
