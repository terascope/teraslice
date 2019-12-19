'use strict';

const {
    TSError, logError, get, cloneDeep
} = require('@terascope/utils');
const { makeLogger } = require('../../../../../workers/helpers/terafoundation');
const K8sResource = require('./k8sResource');
const k8sState = require('./k8sState');
const K8s = require('./k8s');

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */

module.exports = function kubernetesClusterBackend(context, clusterMasterServer) {
    const logger = makeLogger(context, 'kubernetes_cluster_service');
    // const slicerAllocationAttempts = context.sysconfig.teraslice.slicer_allocation_attempts;

    const clusterName = get(context, 'sysconfig.teraslice.name');
    const clusterNameLabel = clusterName.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 63);
    const kubernetesNamespace = get(context, 'sysconfig.teraslice.kubernetes_namespace', 'default');

    const clusterState = {};
    let clusterStateInterval = null;

    const k8s = new K8s(logger, null, kubernetesNamespace);

    clusterMasterServer.onClientOnline((exId) => {
        logger.info(`execution ${exId} is connected`);
    });

    /**
     * getClusterState returns a copy of the clusterState object
     * @return {Object} a copy of the clusterState object
     */
    function getClusterState() {
        return cloneDeep(clusterState);
    }

    /**
     * Creates clusterState by iterating over all k8s pods with the label
     * `app=teraslice`
     * @constructor
     * @return      {Promise} [description]
     */
    function _getClusterState() {
        return k8s.list('app=teraslice', 'pods')
            .then((k8sPods) => k8sState.gen(k8sPods, clusterState, clusterNameLabel))
            .catch((err) => {
                // TODO: We might need to do more here.  I think it's OK to just
                // log though.  This only gets used to show slicer info through
                // the API.  We wouldn't want to disrupt the cluster master
                // for rare failures to reach the k8s API.
                logError(logger, err, 'Error listing teraslice pods in k8s');
            });
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
     * Creates k8s Service and Job for the Teraslice Execution Controller
     * (formerly slicer).  This currently works by creating a service with a
     * hostname that contains the exId in it listening on a well known port.
     * The hostname and port are used later by the workers to contact this
     * Execution Controller.
     * @param  {Object} execution        Object containing execution details
     * @return {Promise}                 [description]
     */
    async function allocateSlicer(ex) {
        const execution = cloneDeep(ex);
        const exSvcResource = new K8sResource(
            'services', 'execution_controller', context.sysconfig.teraslice, execution
        );

        const exService = exSvcResource.resource;

        execution.slicer_port = get(exService, 'spec.ports[0].targetPort');
        execution.slicer_hostname = get(exService, 'metadata.name');

        const exJobResource = new K8sResource(
            'jobs', 'execution_controller', context.sysconfig.teraslice, execution
        );
        const exJob = exJobResource.resource;

        logger.debug(exJob, 'execution allocating slicer');

        // TODO: This should try slicerAllocationAttempts times??
        const serviceResult = await k8s.post(exService, 'service');
        logger.debug(serviceResult, 'k8s slicer service submitted');

        const jobResult = await k8s.post(exJob, 'job');
        logger.debug(jobResult, 'k8s slicer job submitted');

        return execution;
    }

    /**
     * Creates k8s deployment that executes Teraslice workers for specified
     * Execution.
     * @param  {Object} execution  Object that contains information of Execution
     * @return {Promise}           [description]
     */
    function allocateWorkers(execution) {
        const kr = new K8sResource(
            'deployments', 'worker', context.sysconfig.teraslice, execution
        );

        const workerDeployment = kr.resource;

        logger.debug(`workerDeployment:\n\n${JSON.stringify(workerDeployment, null, 2)}`);

        return k8s.post(workerDeployment, 'deployment')
            .then((result) => logger.debug(`k8s worker deployment submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = new TSError(err, {
                    reason: 'Error submitting k8s worker deployment'
                });
                return Promise.reject(error);
            });
    }

    // FIXME: These functions should probably do something with the response
    // NOTE: I find is strange that the expected return value here is
    //        effectively the same as the function inputs
    async function addWorkers(executionContext, numWorkers) {
        await k8s.scaleExecution(executionContext.ex_id, numWorkers, 'add');
        return { action: 'add', ex_id: executionContext.ex_id, workerNum: numWorkers };
    }

    // NOTE: This is passed exId instead of executionContext like addWorkers and
    // removeWorkers.  I don't know why, just dealing with it.
    async function removeWorkers(exId, numWorkers) {
        await k8s.scaleExecution(exId, numWorkers, 'remove');
        return { action: 'remove', ex_id: exId, workerNum: numWorkers };
    }

    async function setWorkers(executionContext, numWorkers) {
        await k8s.scaleExecution(executionContext.ex_id, numWorkers, 'set');
        return { action: 'set', ex_id: executionContext.ex_id, workerNum: numWorkers };
    }

    /**
     * Stops all workers for exId
     * @param  {string} exId    The execution ID of the Execution to stop
     * @return {Promise}
     */

    async function stopExecution(exId) {
        return k8s.deleteExecution(exId);
    }

    async function shutdown() {
        clearInterval(clusterStateInterval);
    }

    async function initialize() {
        logger.info('kubernetes clustering initializing');

        // Periodically update cluster state, update period controlled by:
        //  context.sysconfig.teraslice.node_state_interval
        clusterStateInterval = setInterval(() => {
            logger.trace('cluster_master requesting cluster state update.');
            _getClusterState();
        }, context.sysconfig.teraslice.node_state_interval);

        await k8s.init();
    }

    return {
        getClusterState,
        allocateWorkers,
        allocateSlicer,
        initialize,
        shutdown,
        stopExecution,
        removeWorkers,
        addWorkers,
        setWorkers,
        readyForAllocation,
        // clusterAvailable TODO: return false if k8s API unavailable, not in use
    };
};
