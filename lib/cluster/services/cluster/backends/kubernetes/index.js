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
    const k8sApi = new Api.Api({
        url: 'https://192.168.99.100:8443',
        ca: fs.readFileSync('/Users/godber/.minikube/ca.crt'),
        cert: fs.readFileSync('/Users/godber/.minikube/client.crt'),
        key: fs.readFileSync('/Users/godber/.minikube/client.key'),
        version: 'v1' // Defaults to 'v1'
    });

    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger(
        { module: 'kubernetes_cluster_service' }
    );
    // const pendingWorkerRequests = new Queue();
    const slicerAllocationAttempts = context.sysconfig.teraslice.slicer_allocation_attempts;
    const clusterState = {};
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

    function getClusterState() {
        return clusterState;
    }

    function getClusterStats() {
        return clusterStats;
    }

    function getSlicerStats() {
        return {};
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
     * Allocates slicer pod?
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
        slicerService.spec.selector.app = slicerName;
        slicerService.metadata.labels.app = slicerName;

        slicerDeployment.metadata.name = slicerName;
        slicerDeployment.spec.template.spec.containers[0].name = slicerName;
        slicerDeployment.spec.template.metadata.labels.app = slicerName;
        slicerDeployment.spec.selector.matchLabels.app = slicerName;
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

    function allocateWorkers(execution, numWorkers) {
        // FIXME: Verify that this gets a fresh worker.json on every call
        const workerDeployment = require('./deployments/worker.json');
        const workerName = `teraslice-worker-${execution.ex_id}`;

        // FIXME: I don't think we need to set ALL of these the same the way we
        // are currently,  I need to go back and read the k8s docs to see what
        // these all mean.
        workerDeployment.metadata.name = workerName;
        workerDeployment.spec.template.spec.containers[0].name = workerName;
        workerDeployment.spec.template.metadata.labels.app = workerName;
        workerDeployment.spec.selector.matchLabels.app = workerName;
        workerDeployment.spec.template.spec.containers[0].env[1].value = JSON.stringify(execution);
        workerDeployment.spec.replicas = numWorkers;

        return k8sApi.group(workerDeployment).ns('default').kind(workerDeployment)
            .post({ body: workerDeployment })
            .then(result => logger.info(`k8s worker deployment submitted: ${JSON.stringify(result)}`))
            .catch((err) => {
                const error = parseError(err);
                logger.error(`Error submitting k8s worker deployment: ${error}`);
                return Promise.reject(error);
            });
    }


    const api = {
        getClusterState,
        getClusterStats,
        getSlicerStats,
        allocateWorkers,
        allocateSlicer,
        // shutdown,
        // stopExecution,
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
