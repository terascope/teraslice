'use strict';

const _ = require('lodash');
const VError = require('verror');
const Promise = require('bluebird');
const K8s = require('./k8s');
const k8sState = require('./k8sState');
const stateUtils = require('../state-utils');
const slicerServiceTemplate = require('./services/slicer.json');
const slicerDeploymentTemplate = require('./deployments/slicer.json');
const workerDeploymentTemplate = require('./deployments/worker.json');
const { logError } = require('../../../../../utils/error_utils');

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
    const kubernetesImage = context.sysconfig.teraslice.kubernetes_image || 'teraslice:k8sdev';
    const clusterState = {};

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
            .then(k8sPods => k8sState.gen(k8sPods, clusterState))
            .catch((err) => {
                const error = new VError(err, 'failure listing teraslice pods in k8s');
                // TODO: We might need to do more here.  I think it's OK to just
                // log though.  This only gets used to show slicer info through
                // the API.  We wouldn't want to disrupt the cluster master
                // for rare failures to reach the k8s API.
                logError(logger, error);
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
        const slicerService = _.cloneDeep(slicerServiceTemplate);
        const slicerDeployment = _.cloneDeep(slicerDeploymentTemplate);

        // TODO: extract this hard coded port out somewhere sensible
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
        slicerDeployment.spec.template.spec.containers[0].image = kubernetesImage;
        slicerDeployment.spec.template.spec.containers[0].name = slicerName;
        slicerDeployment.spec.template.spec.containers[0].env[1].value = JSON.stringify(execution);

        // TODO: This should try slicerAllocationAttempts times??
        return k8s.post(slicerService, 'service')
            .then(result => logger.info(`k8s slicer service submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = new VError({
                    name: 'KubernetesServiceFailure',
                    cause: err,
                    info: {
                        name: slicerName,
                        ex_id: execution.ex_id,
                        job_id: execution.job_id,
                    }
                }, 'failure submitting k8s slicer service');
                return Promise.reject(error);
            })
            .then(() => k8s.post(slicerDeployment, 'deployment'))
            .then(result => logger.info(`k8s slicer deployment submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = new VError({
                    name: 'KubernetesDeploymentFailure',
                    cause: err,
                    info: {
                        name: slicerName,
                        ex_id: execution.ex_id,
                        job_id: execution.job_id,
                    }
                }, 'failure submitting k8s slicer deployment');
                logError(logger, error);
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
        const workerDeployment = _.cloneDeep(workerDeploymentTemplate);
        const workerName = `teraslice-worker-${execution.ex_id}`;

        workerDeployment.metadata.name = workerName;
        workerDeployment.metadata.labels.exId = execution.ex_id;
        workerDeployment.metadata.labels.jobId = execution.job_id;
        workerDeployment.spec.replicas = numWorkers;
        workerDeployment.spec.selector.matchLabels.exId = execution.ex_id;
        workerDeployment.spec.template.metadata.labels.exId = execution.ex_id;
        workerDeployment.spec.template.metadata.labels.jobId = execution.job_id;
        workerDeployment.spec.template.spec.containers[0].image = kubernetesImage;
        workerDeployment.spec.template.spec.containers[0].name = workerName;
        workerDeployment.spec.template.spec.containers[0].env[1].value = JSON.stringify(execution);

        return k8s.post(workerDeployment, 'deployment')
            .then(result => logger.info(`k8s worker deployment submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = new VError({
                    name: 'KubernetesDeploymentFailure',
                    cause: err,
                    info: {
                        name: workerName,
                        ex_id: execution.ex_id,
                        job_id: execution.job_id,
                    }
                }, 'failure submitting k8s worker deployment');
                logError(logger, error);
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
                const error = new VError(err, 'could not notify cluster');
                logError(logger, error);
                return Promise.reject(error);
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

        // TODO: We might be able to do without messaging workers to stop
        // and just call deleteExecution() if k8s properly relays the signals
        // and the worker stops correctly.
        const msgResponse = await _msgWorkersWithExId(exId, stopMessage, workers);
        await k8s.deleteExecution(exId);
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
