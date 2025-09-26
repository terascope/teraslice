import {
    TSError, logError, get,
    cloneDeep, pRetry, Logger
} from '@terascope/utils';
import type { Context, ExecutionConfig } from '@terascope/job-components';
import { ClusterState } from '@terascope/types';
import { makeLogger } from '../../../../../workers/helpers/terafoundation.js';
import { gen } from './k8sState.js';
import { K8s } from './k8s.js';
import { getRetryConfig } from './utils.js';
import { StopExecutionOptions } from '../../../interfaces.js';
import { ResourceType } from './interfaces.js';
import { K8sJobResource } from './k8sJobResource.js';
import { K8sServiceResource } from './k8sServiceResource.js';
import { K8sDeploymentResource } from './k8sDeploymentResource.js';

/*
 Execution Life Cycle for _status
 pending -> scheduling -> running -> [ paused -> running ] -> [ stopped | completed ]
 Exceptions
 rejected - when a job is rejected prior to scheduling
 failed - when there is an error while the job is running
 aborted - when a job was running at the point when the cluster shuts down
 */

export class KubernetesClusterBackendV2 {
    context: Context;
    k8s: K8s;
    logger: Logger;
    private clusterStateInterval: NodeJS.Timeout | undefined;
    clusterState: ClusterState = {};
    readonly clusterNameLabel: string;

    constructor(context: Context, clusterMasterServer: any) {
        const kubernetesNamespace = get(context, 'sysconfig.teraslice.kubernetes_namespace', 'default');
        const clusterName = get(context, 'sysconfig.teraslice.name');

        this.context = context;
        this.logger = makeLogger(context, 'kubernetesV2_cluster_service');
        this.clusterNameLabel = clusterName.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 63);
        this.clusterState = {};
        this.clusterStateInterval = undefined;

        this.k8s = new K8s(
            this.logger,
            null,
            kubernetesNamespace,
            context.sysconfig.teraslice.kubernetes_api_poll_delay,
            context.sysconfig.teraslice.shutdown_timeout
        );

        clusterMasterServer.onClientOnline((exId: string) => {
            this.logger.info(`execution ${exId} is connected`);
        });
    }

    /**
     * getClusterState returns a copy of the clusterState object
     * @return {Object} a copy of the clusterState object
     */
    getClusterState() {
        return cloneDeep(this.clusterState);
    }

    /**
     * Creates clusterState by iterating over all k8s pods matching both labels
     *   app.kubernetes.io/name=teraslice
     *   app.kubernetes.io/instance=${clusterNameLabel}
     * @constructor
     * @return      {Promise} void
     */
    private async _getClusterState() {
        return this.k8s.list(`app.kubernetes.io/name=teraslice,app.kubernetes.io/instance=${this.clusterNameLabel}`, 'pods')
            .then((tsPodList) => gen(tsPodList, this.clusterState))
            .catch((err) => {
                // TODO: We might need to do more here.  I think it's OK to just
                // log though.  This only gets used to show slicer info through
                // the API.  We wouldn't want to disrupt the cluster master
                // for rare failures to reach the k8s API.
                logError(this.logger, err, 'Error listing teraslice pods in k8s');
            });
    }

    /**
     * Return value indicates whether the cluster has enough workers to start
     * an execution.  It must be able to allocate a slicer and at least one
     * worker.
     * @return {boolean} Ok to create job?
     */
    readyForAllocation() {
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
    async allocateSlicer(ex: ExecutionConfig) {
        const execution = cloneDeep(ex);

        execution.slicer_port = 45680;

        const exJobResource = new K8sJobResource(
            this.context.sysconfig.teraslice,
            execution,
            this.logger
        );

        const exJob = exJobResource.resource;

        this.logger.debug(exJob, 'execution allocating slicer');

        const jobResult = await this.k8s.post(exJob);

        if (!jobResult.metadata.uid) {
            throw new Error('Required field uid missing from jobResult.metadata');
        }

        const exServiceResource = new K8sServiceResource(
            this.context.sysconfig.teraslice,
            execution,
            this.logger,
            // Needed to create the deployment and service resource ownerReferences
            jobResult.metadata.name,
            jobResult.metadata.uid
        );

        const exService = exServiceResource.resource;

        const serviceResult = await this.k8s.post(exService);

        this.logger.debug(jobResult, 'k8s slicer job submitted');

        const exServiceName = serviceResult.metadata.name;
        const exServiceHostName = `${exServiceName}.${this.k8s.defaultNamespace}`;
        this.logger.debug(`Slicer is using host name: ${exServiceHostName}`);

        execution.slicer_hostname = `${exServiceHostName}`;

        return execution;
    }

    /**
     * Creates k8s deployment that executes Teraslice workers for specified
     * Execution.
     * @param  {Object} execution  Object that contains information of Execution
     * @return {Promise}           [description]
     */
    async allocateWorkers(execution: ExecutionConfig) {
        // NOTE: I tried to set these on the execution inside allocateSlicer
        // but these properties were gone by the time this was called, perhaps
        // because they are not on the schema.  So I do this k8s API call
        // instead.
        const selector = `app.kubernetes.io/component=execution_controller,teraslice.terascope.io/jobId=${execution.job_id}`;
        const jobs = await pRetry(
            () => this.k8s.nonEmptyJobList(selector), getRetryConfig()
        );

        if (!jobs.items[0].metadata.uid) {
            throw new Error('Required field uid missing from kubernetes job metadata');
        }

        const kr = new K8sDeploymentResource(
            this.context.sysconfig.teraslice,
            execution,
            this.logger,
            jobs.items[0].metadata.name,
            jobs.items[0].metadata.uid
        );

        const workerDeployment = kr.resource;

        this.logger.debug(`workerDeployment:\n\n${JSON.stringify(workerDeployment, null, 2)}`);

        return this.k8s.post(workerDeployment)
            .then((result) => this.logger.debug(`k8s worker deployment submitted: ${JSON.stringify(result)}`))
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
    async addWorkers(executionContext: any, numWorkers: number) {
        await this.k8s.scaleExecution(executionContext.ex_id, numWorkers, 'add');
        return { action: 'add', ex_id: executionContext.ex_id, workerNum: numWorkers };
    }

    // NOTE: This is passed exId instead of executionContext like addWorkers and
    // removeWorkers.  I don't know why, just dealing with it.
    async removeWorkers(exId: string, numWorkers: number) {
        await this.k8s.scaleExecution(exId, numWorkers, 'remove');
        return { action: 'remove', ex_id: exId, workerNum: numWorkers };
    }

    // TODO: fix types here
    async setWorkers(executionContext: any, numWorkers: number) {
        await this.k8s.scaleExecution(executionContext.ex_id, numWorkers, 'set');
        return { action: 'set', ex_id: executionContext.ex_id, workerNum: numWorkers };
    }

    /**
     * Stops all workers for exId
     * @param  {String}                 exId      The execution ID of the Execution to stop
     * @param  {StopExecutionOptions} options     force, timeout, and excludeNode
     *                                    force: stop all related pod, deployment, and job resources
     *                                    timeout and excludeNode are not used in k8s clustering.
     * @return {Promise}
     */
    async stopExecution(exId: string, options?: StopExecutionOptions) {
        return this.k8s.deleteExecution(exId, options?.force);
    }

    async shutdown() {
        clearInterval(this.clusterStateInterval);
    }

    /**
     * Returns a list of all k8s resources associated with a job ID
     * @param {string}         jobId   The job ID of the job to list associated resources
     * @returns {Array<TSPod[] | TSDeployment[] | TSService[]
     *  | TSJob[] | TSReplicaSet[]>}
     */
    async listResourcesForJobId(jobId: string) {
        const resources = [];
        const resourceTypes: ResourceType[] = ['pods', 'deployments', 'services', 'jobs', 'replicasets'];

        for (const type of resourceTypes) {
            const list = await this.k8s.list(`teraslice.terascope.io/jobId=${jobId}`, type);
            if (list.items.length > 0) {
                resources.push(list.items);
            }
        }

        return resources;
    }

    async initialize() {
        this.logger.info('kubernetesV2 clustering initializing');

        // Periodically update cluster state, update period controlled by:
        //  context.sysconfig.teraslice.node_state_interval
        this.clusterStateInterval = setInterval(() => {
            this.logger.trace('cluster_master requesting cluster state update.');
            this._getClusterState();
        }, this.context.sysconfig.teraslice.node_state_interval);
    }
}
