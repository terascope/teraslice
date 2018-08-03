'use strict';

const _ = require('lodash');
const parseError = require('@terascope/error-parser');
const Promise = require('bluebird');
const jsonTemplater = require('json-templater/object');
const K8s = require('./k8s');
const k8sState = require('./k8sState');
const stateUtils = require('../state-utils');
const exServiceTemplate = require('./services/execution_controller.json');
const exDeploymentTemplate = require('./deployments/execution_controller.json');
const workerDeploymentTemplate = require('./deployments/worker.json');

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
module.exports = function kubernetesClusterBackend(context, messaging) {
    const logger = context.apis.foundation.makeLogger({ module: 'kubernetes_cluster_service' });
    // const slicerAllocationAttempts = context.sysconfig.teraslice.slicer_allocation_attempts;
    const kubernetesImage = _.get(context, 'sysconfig.teraslice.kubernetes_image', 'teraslice:k8sdev');
    const kubernetesNamespace = _.get(context, 'sysconfig.teraslice.kubernetes_namespace', 'default');

    const clusterState = {};
    let clusterStateInterval = null;

    // FIXME: clusterStats stores aggregated stats about what gets processed,
    // when a slice on any job fails, it gets recorded here.  What should this
    // do in the k8s case?
    // See issue: https://github.com/terascope/teraslice/issues/751
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

    messaging.register({
        event: 'cluster:analytics',
        callback: (msg) => {
            const data = msg.payload;
            if (!clusterStats[data.kind]) {
                logger.warn(`unrecognized cluster stats: ${data.kind}`);
                return;
            }
            _.forOwn(data.stats, (value, field) => {
                if (clusterStats[data.kind][field] !== undefined) {
                    clusterStats[data.kind][field] += value;
                }
            });
        }
    });

    messaging.register({
        event: 'execution:finished',
        callback: ({ ex_id: exId } = {}) => {
            logger.debug(`execution ${exId} has finished...`);
            stopExecution(exId)
                .catch((err) => {
                    logger.error(`Unable to stop execution ${exId}`, err);
                });
        }
    });

    messaging.register({
        event: 'execution:error:terminal',
        callback: ({ ex_id: exId } = {}) => {
            logger.error(`terminal error for execution: ${exId}, shutting down execution...`);
            stopExecution(exId)
                .catch((err) => {
                    logger.error(`Unable to stop execution ${exId}`, err);
                });
        }
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

    function getClusterStats() {
        return _.cloneDeep(clusterStats);
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
        const name = `teraslice-execution-controller-${execution.ex_id}`.substring(0, 63);

        const serviceConfig = {
            name,
            exId: execution.ex_id,
            jobId: execution.job_id,
            nodeType: 'execution_controller',
            namespace: kubernetesNamespace
        };

        const exService = jsonTemplater(exServiceTemplate, serviceConfig);

        execution.slicer_port = _.get(exService, 'spec.ports[0].targetPort');
        execution.slicer_hostname = _.get(exService, 'metadata.name');

        if (recoverExecution) execution.recover_execution = recoverExecution;

        const deploymentConfig = {
            name,
            exId: execution.ex_id,
            jobId: execution.job_id,
            dockerImage: kubernetesImage,
            execution: JSON.stringify(execution),
            nodeType: 'execution_controller',
            namespace: kubernetesNamespace,
        };

        const exDeployment = jsonTemplater(exDeploymentTemplate, deploymentConfig);

        // TODO: This should try slicerAllocationAttempts times??
        return k8s.post(exService, 'service')
            .then(result => logger.debug(`k8s slicer service submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s slicer service: ${error}`);
                return Promise.reject(error);
            })
            .then(() => k8s.post(exDeployment, 'deployment'))
            .then(result => logger.debug(`k8s slicer deployment submitted: ${JSON.stringify(result)}`))
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
        const name = `teraslice-worker-${execution.ex_id}`.substring(0, 63);

        const deploymentConfig = {
            name,
            exId: execution.ex_id,
            jobId: execution.job_id,
            dockerImage: kubernetesImage,
            execution: JSON.stringify(execution),
            nodeType: 'worker',
            namespace: kubernetesNamespace
        };

        const workerDeployment = jsonTemplater(workerDeploymentTemplate, deploymentConfig);
        workerDeployment.spec.replicas = numWorkers;

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
     * @return {Promise}
     */
    async function stopExecution(exId) {
        await k8s.deleteExecution(exId);
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

    async function shutdown() {
        clearInterval(clusterStateInterval);
    }

    const getSlicerStats = stateUtils.newGetSlicerStats(clusterState, context, messaging);

    const api = {
        getClusterState,
        getClusterStats,
        getSlicerStats,
        allocateWorkers,
        allocateSlicer,
        shutdown,
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
