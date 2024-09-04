import {
    TSError, get, isEmpty,
    pDelay, pRetry, Logger
} from '@terascope/utils';
import * as k8s from '@kubernetes/client-node';
import { IncomingMessage } from 'node:http';
import { getRetryConfig } from './utils.js';

interface KubeConfigOptions {
    clusters: k8s.Cluster[];
    contexts: k8s.Context[];
    currentContext: k8s.Context['name'];
    users: k8s.User[];
}

type K8sObjectList =
    k8s.V1DeploymentList | k8s.V1ServiceList
    | k8s.V1JobList | k8s.V1PodList;

export class K8s {
    logger: Logger;
    apiPollDelay: number;
    defaultNamespace: string;
    shutdownTimeout: number;
    kc: k8s.KubeConfig;
    k8sAppsV1Api: k8s.AppsV1Api;
    k8sBatchV1Api: k8s.BatchV1Api;
    k8sCoreV1Api: k8s.CoreV1Api;

    constructor(
        logger: Logger,
        clientConfig: KubeConfigOptions | null,
        defaultNamespace: string | null,
        apiPollDelay: number,
        shutdownTimeout: number
    ) {
        this.apiPollDelay = apiPollDelay;
        this.defaultNamespace = defaultNamespace || 'default';
        this.logger = logger;
        this.shutdownTimeout = shutdownTimeout; // this is in milliseconds

        this.kc = new k8s.KubeConfig();

        if (clientConfig) {
            this.kc.loadFromOptions(clientConfig);
        } else if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT) {
            this.kc.loadFromCluster();
        } else {
            this.kc.loadFromDefault();
        }

        this.k8sAppsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
        this.k8sBatchV1Api = this.kc.makeApiClient(k8s.BatchV1Api);
        this.k8sCoreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    }

    /**
     * Returns the k8s NamespaceList object
     * @return {Promise} [description]
     */
    async getNamespaces() {
        let namespaces;
        try {
            namespaces = await pRetry(() => this.k8sCoreV1Api.listNamespace(), getRetryConfig());
        } catch (err) {
            const error = new TSError(err, {
                reason: 'Failure getting in namespaces'
            });
            throw error;
        }
        return namespaces.body;
    }

    /**
     * Rerturns the first pod matching the provided selector after it has
     * entered the `Running` state.
     *
     * TODO: Make more generic to search for different statuses
     *
     * NOTE: If your selector will return multiple pods, this method probably
     * won't work for you.
     * @param {String} selector kubernetes selector, like 'controller-uid=XXX'
     * @param {String} ns       namespace to search, this will override the default
     * @param {Number} timeout  time, in ms, to wait for pod to start
     * @return {Object}         pod
     *
     * TODO: Should this use the cluster state that gets polled periodically,
     * rather than making it's own k8s API calls
     */
    async waitForSelectedPod(selector: string, statusType: string, ns?: string, timeout = 10000) {
        const namespace = ns || this.defaultNamespace;
        let now = Date.now();
        const end = now + timeout;

        while (true) {
            const result = await pRetry(() => this.k8sCoreV1Api
                .listNamespacedPod(namespace, undefined, undefined, undefined, undefined, selector),
            getRetryConfig());
            let pod: k8s.V1Pod | undefined;
            if (typeof result !== 'undefined' && result) {
                // NOTE: This assumes the first pod returned.
                pod = get(result, 'body.items[0]');
            }

            if (pod) {
                if (statusType === 'readiness-probe') {
                    if (pod.status?.conditions) {
                        for (const condition of pod.status.conditions) {
                            if (
                                condition.type === 'ContainersReady'
                                && condition.status === 'True'
                            ) {
                                return pod;
                            }
                        }
                    }
                } else if (statusType === 'pod-status') {
                    if (get(pod, 'status.phase') === 'Running') return pod;
                }
            }
            if (now > end) throw new Error(`Timeout waiting for pod matching: ${selector}`);
            this.logger.debug(`waiting for pod matching: ${selector}`);

            await pDelay(this.apiPollDelay);
            now = Date.now();
        }
    }

    /**
     * Waits for the number of pods to equal number.
     * @param {Number} number   Number of pods to wait for, e.g.: 0, 10
     * @param {String} selector kubernetes selector, like 'controller-uid=XXX'
     * @param {String} ns       namespace to search, this will override the default
     * @param {Number} timeout  time, in ms, to wait for pod to start
     * @return {Array}          Array of pod objects
     *
     * TODO: Should this use the cluster state that gets polled periodically,
     * rather than making it's own k8s API calls?
     */
    async waitForNumPods(number: number, selector: string, ns: string, timeout = 10000) {
        const namespace = ns || this.defaultNamespace;
        let now = Date.now();
        const end = now + timeout;

        while (true) {
            const result = await pRetry(() => this.k8sCoreV1Api
                .listNamespacedPod(namespace, undefined, undefined, undefined, undefined, selector),
            getRetryConfig());

            const podList:k8s.V1Pod[] | undefined = get(result, 'body.items');

            if (podList && Array.isArray(podList)) {
                if (podList.length === number) return podList;
            }
            const msg = `Waiting: pods matching ${selector} is ${podList.length}/${number}`; // FIXME: this could be undefined -> typeError
            if (now > end) throw new Error(`Timeout ${msg}`);
            this.logger.debug(msg);

            await pDelay(this.apiPollDelay);
            now = Date.now();
        }
    }

    /**
    * returns list of k8s objects matching provided selector
    * @param  {String} selector kubernetes selector, like 'app=teraslice'
    * @param  {String} objType  Type of k8s object to get, valid options:
    *                           'pods', 'deployment', 'services', 'jobs'
    * @param  {String} ns       namespace to search, this will override the default
    * @return {Object}          body of k8s get response.
    */
    async list(selector: string, objType: string, ns?: string) {
        const namespace = ns || this.defaultNamespace;
        let responseObj: {
            response: IncomingMessage,
            body: k8s.V1PodList | k8s.V1DeploymentList | k8s.V1ServiceList | k8s.V1JobList
        };

        try {
            if (objType === 'pods') {
                responseObj = await pRetry(() => this.k8sCoreV1Api.listNamespacedPod(
                    namespace,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    selector
                ), getRetryConfig());
            } else if (objType === 'deployments') {
                responseObj = await pRetry(() => this.k8sAppsV1Api.listNamespacedDeployment(
                    namespace,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    selector
                ), getRetryConfig());
            } else if (objType === 'services') {
                responseObj = await pRetry(() => this.k8sCoreV1Api.listNamespacedService(
                    namespace,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    selector
                ), getRetryConfig());
            } else if (objType === 'jobs') {
                responseObj = await pRetry(() => this.k8sBatchV1Api.listNamespacedJob(
                    namespace,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    selector
                ), getRetryConfig());
            } else {
                const error = new Error(`Wrong objType provided to get: ${objType}`);
                this.logger.error(error);
                return Promise.reject(error);
            }
        } catch (e) {
            const err = new Error(`Request k8s.list of ${objType} with selector ${selector} failed: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (responseObj.response.statusCode && responseObj.response.statusCode >= 400) {
            const err = new TSError(`Problem when trying to k8s.list ${objType}`);
            this.logger.error(err);
            err.code = responseObj.response.statusCode.toString();
            return Promise.reject(err);
        }

        return responseObj.body;
    }

    async nonEmptyList(selector: string, objType: string) {
        const jobs = await this.list(selector, objType);
        if (jobs.items.length === 1) {
            return jobs;
        } if (jobs.items.length === 0) {
            const msg = `Teraslice ${objType} matching the following selector was not found: ${selector} (retriable)`;
            this.logger.warn(msg);
            throw new TSError(msg, { retryable: true });
        } else {
            throw new TSError(`Unexpected number of Teraslice ${objType}s matching the following selector: ${selector}`, {
                retryable: true
            });
        }
    }

    /**
     * posts manifest to k8s
     * @param  {Object} manifest     service manifest
     * @param  {String} manifestType 'service', 'deployment', 'job'
     * @return {Object}              body of k8s API response object
     */
    async post(manifest: Record<string, any>, manifestType: string) {
        let responseObj: {
            response: IncomingMessage,
            body: k8s.V1Service | k8s.V1Deployment | k8s.V1Job
        };

        try {
            if (manifestType === 'service') {
                responseObj = await this.k8sCoreV1Api
                    .createNamespacedService(this.defaultNamespace, manifest);
            } else if (manifestType === 'deployment') {
                responseObj = await this.k8sAppsV1Api
                    .createNamespacedDeployment(this.defaultNamespace, manifest);
            } else if (manifestType === 'job') {
                responseObj = await this.k8sBatchV1Api
                    .createNamespacedJob(this.defaultNamespace, manifest);
            } else {
                const error = new Error(`Invalid manifestType: ${manifestType}`);
                return Promise.reject(error);
            }
        } catch (e) {
            const err = new Error(`Request k8s.post of ${manifestType} with body ${JSON.stringify(manifest)} failed: ${e}`);
            return Promise.reject(err);
        }

        if (responseObj.response.statusCode && responseObj.response.statusCode >= 400) {
            const err = new TSError(`Problem when trying to k8s.post ${manifestType} with body ${JSON.stringify(manifest)}`);
            this.logger.error(err);
            err.code = responseObj.response.statusCode.toString();
            return Promise.reject(err);
        }

        return responseObj.body;
    }

    /**
     * Patches specified k8s deployment with the provided record
     * @param  {String} record record, like 'app=teraslice'
     * @param  {String} name   Name of the deployment to patch
     * @return {Object}        body of k8s patch response.
     */
    // TODO: I renamed this from patchDeployment to just patch because this is
    // the low level k8s api method, I expect to eventually change the interface
    // on this to require `objType` to support patching other things
    async patch(record: Record<string, any>, name: string) {
        let responseObj: {
            response: IncomingMessage,
            body: k8s.V1Service | k8s.V1Deployment | k8s.V1Job
        };

        try {
            const options = { headers: { 'Content-type': k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH } };
            responseObj = await pRetry(() => this.k8sAppsV1Api
                .patchNamespacedDeployment(
                    name,
                    this.defaultNamespace,
                    record,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    options,
                ), getRetryConfig());
        } catch (e) {
            const err = new Error(`Request k8s.patch with ${name} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (responseObj.response.statusCode && responseObj.response.statusCode >= 400) {
            const err = new TSError(`Unexpected response code (${responseObj.response.statusCode}), when patching ${name} with body ${JSON.stringify(record)}`);
            this.logger.error(err);
            err.code = responseObj.response.statusCode.toString();
            return Promise.reject(err);
        }

        return responseObj.body;
    }

    /**
     * Deletes k8s object of specified objType
     * @param  {String}  name          Name of the resource to delete
     * @param  {String}  objType       Type of k8s object to get, valid options:
     *                                 'deployments', 'services', 'jobs'
     * @param  {Boolean} force         Forcefully delete resource by setting gracePeriodSeconds to 1
     *                                 to be forcefully stopped.
     * @return {Object}                k8s delete response body.
     */
    async delete(name: string, objType: string, force?: boolean) {
        let responseObj: {
            response: IncomingMessage,
            body: k8s.V1Status | k8s.V1Pod | k8s.V1Service
        };

        // To get a Job to remove the associated pods you have to
        // include a body like the one below with the delete request.
        // To force: setting gracePeriodSeconds to 1 will send a SIGKILL command to the resource
        const deleteOptions: k8s.V1DeleteOptions = {
            apiVersion: 'v1',
            kind: 'DeleteOptions',
            propagationPolicy: 'Background'
        };

        if (force) {
            deleteOptions.gracePeriodSeconds = 1;
        }

        try {
            if (objType === 'services') {
                responseObj = await pRetry(() => this.k8sCoreV1Api
                    .deleteNamespacedService(
                        name,
                        this.defaultNamespace,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        deleteOptions
                    ), getRetryConfig());
            } else if (objType === 'deployments') {
                responseObj = await pRetry(() => this.k8sAppsV1Api
                    .deleteNamespacedDeployment(
                        name,
                        this.defaultNamespace,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        deleteOptions
                    ), getRetryConfig());
            } else if (objType === 'jobs') {
                responseObj = await pRetry(() => this.k8sBatchV1Api
                    .deleteNamespacedJob(
                        name,
                        this.defaultNamespace,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        deleteOptions
                    ), getRetryConfig());
            } else if (objType === 'pods') {
                responseObj = await pRetry(() => this.k8sCoreV1Api
                    .deleteNamespacedPod(
                        name,
                        this.defaultNamespace,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        deleteOptions
                    ), getRetryConfig());
            } else {
                throw new Error(`Invalid objType: ${objType}`);
            }
        } catch (e) {
            const err = new Error(`Request k8s.delete with name: ${name} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (responseObj.response.statusCode && responseObj.response.statusCode >= 400) {
            const err = new TSError(`Unexpected response code (${responseObj.response.statusCode}), when deleting name: ${name}`);
            this.logger.error(err);
            err.code = responseObj.response.statusCode.toString();
            return Promise.reject(err);
        }

        return responseObj.body;
    }

    /**
     * Delete all of Kubernetes resources related to the specified exId
     * @param  {String}   exId    ID of the execution
     * @param  {Boolean}  force   Forcefully stop all related pod, deployment, and job resources
     * @return {Promise}
     */
    async deleteExecution(exId: string, force = false) {
        if (!exId) {
            throw new Error('deleteExecution requires an executionId');
        }

        await this._deleteObjByExId(exId, 'execution_controller', 'jobs', force);
    }

    /**
     * Finds the k8s object by nodeType and exId and then deletes it
     * @param  {String}  exId     Execution ID
     * @param  {String}  nodeType valid Teraslice k8s node type:
     *                            'worker', 'execution_controller'
     * @param  {String}  objType  valid object type: `services`, `deployments`,
     *                            'jobs'
     * @param  {Boolean}  force    Forcefully stop all related pod, deployment, and job resources
     * @return {Promise}
     */
    async _deleteObjByExId(exId: string, nodeType: string, objType: string, force?: boolean) {
        let objList: K8sObjectList;
        let forcePodsList: k8s.V1PodList | undefined;
        const deleteResponses: Array<k8s.V1Pod[] | k8s.V1Pod | k8s.V1Service | k8s.V1Status> = [];

        try {
            objList = await this.list(`app.kubernetes.io/component=${nodeType},teraslice.terascope.io/exId=${exId}`, objType);
        } catch (e) {
            const err = new Error(`Request ${objType} list in _deleteObjByExId with app.kubernetes.io/component: ${nodeType} and exId: ${exId} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (force) {
            try {
                forcePodsList = await this.list(`teraslice.terascope.io/exId=${exId}`, 'pods') as k8s.V1PodList;
            } catch (e) {
                const err = new Error(`Request pods list in _deleteObjByExId with exId: ${exId} failed with: ${e}`);
                this.logger.error(err);
                return Promise.reject(err);
            }
        }

        if (isEmpty(objList.items) && isEmpty(forcePodsList?.items)) {
            this.logger.info(`k8s._deleteObjByExId: ${exId} ${nodeType} ${objType} has already been deleted`);
            return Promise.resolve();
        }

        const deletePodResponses: k8s.V1Pod[] = [];
        if (forcePodsList?.items) {
            this.logger.info(`k8s._deleteObjByExId: ${exId} force deleting all pods`);
            for (const pod of forcePodsList.items) {
                if (!pod.metadata) {
                    this.logger.error('Cannot delete pod by metadata.name because it has no metadata');
                    continue;
                }
                if (!pod.metadata.name) {
                    this.logger.error(`Cannot delete pod with labels ${pod.metadata.labels} by name because it has no name`);
                    continue;
                }
                const podName = pod.metadata.name;
                try {
                    const V1Pod = await this.delete(podName, 'pods', force) as k8s.V1Pod;
                    deletePodResponses.push(V1Pod);
                } catch (e) {
                    const err = new Error(`Request k8s.delete in _deleteObjByExId with name: ${podName} failed with: ${e}`);
                    this.logger.error(err);
                    return Promise.reject(err);
                }
            }
        }

        const name = objList.items[0].metadata?.name;
        if (name === undefined) {
            const err = new Error(`Cannot delete ${objType} for ExId: ${exId} by name because it has no name`);
            this.logger.error(err);
            return Promise.reject(err);
        }
        this.logger.info(`k8s._deleteObjByExId: ${exId} ${nodeType} ${objType} deleting: ${name}`);

        try {
            deleteResponses.push(await this.delete(name, objType, force));
        } catch (e) {
            const err = new Error(`Request k8s.delete in _deleteObjByExId with name: ${name} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (deletePodResponses.length > 0) {
            deleteResponses.push(deletePodResponses);
        }
        return deleteResponses;
    }

    /**
     * Scales the k8s deployment for the specified exId to the desired number
     * of workers.
     * @param  {String} exId       exId of execution to scale
     * @param  {number} numWorkers number of workers to scale by
     * @param  {String} op         Scale operation: `set`, `add`, `remove`
     * @return {Object}            Body of patch response.
     */
    async scaleExecution(exId: string, numWorkers: number, op: string) {
        let newScale;

        this.logger.info(`Scaling exId: ${exId}, op: ${op}, numWorkers: ${numWorkers}`);
        const listResponse = await this.list(`app.kubernetes.io/component=worker,teraslice.terascope.io/exId=${exId}`, 'deployments') as k8s.V1DeploymentList;
        this.logger.debug(`k8s worker query listResponse: ${JSON.stringify(listResponse)}`);

        // the selector provided to list above should always result in a single
        // deployment in the response.
        // TODO: test for more than 1 and error
        const workerDeployment = listResponse.items[0];
        if (workerDeployment.spec?.replicas === undefined) {
            throw new Error('replicas is undefined in worker deployment spec');
        }
        this.logger.info(`Current Scale for exId=${exId}: ${workerDeployment.spec?.replicas}`);

        if (op === 'set') {
            newScale = numWorkers;
        } else if (op === 'add') {
            newScale = workerDeployment.spec.replicas + numWorkers;
        } else if (op === 'remove') {
            newScale = workerDeployment.spec.replicas - numWorkers;
        } else {
            throw new Error('scaleExecution only accepts the following operations: add, remove, set');
        }

        this.logger.info(`New Scale for exId=${exId}: ${newScale}`);

        const scalePatch = [
            {
                op: 'replace',
                path: '/spec/replicas',
                value: newScale
            }
        ];

        if (!workerDeployment.metadata?.name) {
            throw new Error('name is undefined in worker deployment metadata');
        }
        const patchResponseBody = await this
            .patch(scalePatch, workerDeployment.metadata.name) as k8s.V1Deployment;
        this.logger.debug(`k8s.scaleExecution patchResponseBody: ${JSON.stringify(patchResponseBody)}`);
        return patchResponseBody;
    }
}
