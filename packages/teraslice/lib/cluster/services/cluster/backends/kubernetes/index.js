'use strict';

const _ = require('lodash');
const parseError = require('@terascope/error-parser');
const Promise = require('bluebird');
const K8s = require('./k8s');
const k8sState = require('./k8sState');
const k8sObject = require('./k8sObject');
const { makeTemplate } = require('./utils');
const { safeEncode } = require('../../../../../utils/encoding_utils');

const exServiceTemplate = makeTemplate('services', 'execution_controller');

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shutsdown
 */

// FIXME: See Jared's comment regarding executionService, will leave this
// as a known issue: https://github.com/terascope/teraslice/issues/750
module.exports = function kubernetesClusterBackend(context, clusterMasterServer) {
    const logger = context.apis.foundation.makeLogger({ module: 'kubernetes_cluster_service' });
    // const slicerAllocationAttempts = context.sysconfig.teraslice.slicer_allocation_attempts;

    const shutdownTimeoutMs = _.get(context, 'sysconfig.teraslice.shutdown_timeout', 60000);
    const shutdownTimeoutSeconds = Math.round(shutdownTimeoutMs / 1000);

    const clusterName = _.get(context, 'sysconfig.teraslice.name');
    const kubernetesImage = _.get(context, 'sysconfig.teraslice.kubernetes_image', 'teraslice:k8sdev');
    const kubernetesNamespace = _.get(context, 'sysconfig.teraslice.kubernetes_namespace', 'default');
    const configMapName = _.get(
        context,
        'sysconfig.teraslice.kubernetes_config_map_name',
        `${context.sysconfig.teraslice.name}-worker`
    );
    const imagePullSecret = _.get(
        context,
        'sysconfig.teraslice.kubernetes_image_pull_secret',
        'teraslice-image-pull-secret'
    );

    const clusterState = {};
    let clusterStateInterval = null;

    const k8s = new K8s(logger, null, kubernetesNamespace);

    clusterMasterServer.onClientOnline((exId) => {
        logger.info(`execution ${exId} is connected`);
    });

    // Periodically update cluster state, update period controlled by:
    //  context.sysconfig.teraslice.node_state_interval
    clusterStateInterval = setInterval(() => {
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
            .then(k8sPods => k8sState.gen(k8sPods, clusterState))
            .catch((err) => {
                // TODO: We might need to do more here.  I think it's OK to just
                // log though.  This only gets used to show slicer info through
                // the API.  We wouldn't want to disrupt the cluster master
                // for rare failures to reach the k8s API.
                logger.error(`Error listing teraslice pods in k8s: ${err}`);
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
     * @param  {String} recoverExecution ex_id of old execution to be recovered
     * @return {Promise}                 [description]
     */
    function allocateSlicer(execution, recoverExecution) {
        const name = `teraslice-execution-controller-${execution.ex_id}`.substring(0, 63);

        const serviceConfig = {
            name,
            clusterName,
            exId: execution.ex_id,
            jobId: execution.job_id,
            jobName: execution.name,
            nodeType: 'execution_controller',
            namespace: kubernetesNamespace
        };

        const exService = exServiceTemplate(serviceConfig);

        execution.slicer_port = _.get(exService, 'spec.ports[0].targetPort');
        execution.slicer_hostname = _.get(exService, 'metadata.name');

        if (recoverExecution) execution.recover_execution = recoverExecution;

        const jobConfig = {
            name,
            clusterName,
            exId: execution.ex_id,
            jobId: execution.job_id,
            jobName: execution.name,
            dockerImage: kubernetesImage,
            execution: safeEncode(execution),
            nodeType: 'execution_controller',
            namespace: kubernetesNamespace,
            shutdownTimeout: shutdownTimeoutSeconds,
            configMapName,
            imagePullSecret,
        };

        const exJob = k8sObject.gen(
            'jobs', 'execution_controller', execution, jobConfig
        );

        logger.debug(`exJob:\n\n${JSON.stringify(exJob, null, 2)}`);

        // TODO: This should try slicerAllocationAttempts times??
        return k8s.post(exService, 'service')
            .then(result => logger.debug(`k8s slicer service submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s slicer service: ${error}`);
                return Promise.reject(error);
            })
            .then(() => k8s.post(exJob, 'job'))
            .then(result => logger.debug(`k8s slicer job submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s slicer job: ${error}`);
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
        const name = `teraslice-worker-${execution.ex_id}`.substring(0, 63);

        const deploymentConfig = {
            name,
            clusterName,
            exId: execution.ex_id,
            jobId: execution.job_id,
            jobName: execution.name,
            dockerImage: kubernetesImage,
            execution: safeEncode(execution),
            nodeType: 'worker',
            namespace: kubernetesNamespace,
            shutdownTimeout: shutdownTimeoutSeconds,
            replicas: numWorkers,
            configMapName,
            imagePullSecret,
        };

        const workerDeployment = k8sObject.gen(
            'deployments', 'worker', execution, deploymentConfig
        );

        logger.debug(`workerDeployment:\n\n${JSON.stringify(workerDeployment, null, 2)}`);

        return k8s.post(workerDeployment, 'deployment')
            .then(result => logger.debug(`k8s worker deployment submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s worker deployment: ${error}`);
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

    const api = {
        getClusterState,
        allocateWorkers,
        allocateSlicer,
        shutdown,
        stopExecution,
        removeWorkers,
        addWorkers,
        setWorkers,
        readyForAllocation,
        // clusterAvailable TODO: return false if k8s API unavailable, not in use
    };

    function _initialize() {
        logger.info('Initializing');
        return k8s.init()
            .then(() => Promise.resolve(api));
    }

    return _initialize();
};
