import {
    TSError, get, isEmpty,
    pDelay, pRetry, Logger
} from '@terascope/utils';
import * as k8s from '@kubernetes/client-node';
import { getRetryConfig, isDeployment, isJob, isPod, isReplicaSet, isService } from './utils.js';
import {
    DeleteApiResponse, DeleteParams, ResourceListApiResponse,
    ResourceType, PatchApiResponse, Resource,
    ResourceList, ResourceApiResponse, DeleteResponseBody,
    NodeType, ScaleOp
} from './interfaces.js';

interface KubeConfigOptions {
    clusters: k8s.Cluster[];
    contexts: k8s.Context[];
    currentContext: k8s.Context['name'];
    users: k8s.User[];
}

type K8sObjectList =
    k8s.V1DeploymentList | k8s.V1ServiceList
    | k8s.V1JobList | k8s.V1PodList | k8s.V1ReplicaSetList;

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
     * @return {k8s.V1Pod}      pod object
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
     * @return {k8s.V1Pod[]}    Array of pod objects
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

            const podList: k8s.V1Pod[] = get(result, 'body.items');

            if (podList.length === number) return podList;

            const msg = `Waiting: pods matching ${selector} is ${podList.length}/${number}`;
            if (now > end) throw new Error(`Timeout ${msg}`);
            this.logger.debug(msg);

            await pDelay(this.apiPollDelay);
            now = Date.now();
        }
    }

    /**
    * returns list of k8s objects matching provided selector
    * @param  {String} selector        kubernetes selector, like 'app=teraslice'
    * @param  {ResourceType} objType       Type of k8s object to get, valid options:
    *                                  'deployments', 'jobs', 'pods', 'replicasets', 'services'
    * @param  {String} ns              namespace to search, this will override the default
    * @return {k8s.V1PodList
    *        | k8s.V1DeploymentList
    *        | k8s.V1ServiceList
    *        | k8s.V1ReplicaSetList
    *        | k8s.V1JobList}          list of k8s objects.
    */
    async list(selector: string, objType: 'deployment', ns?: string): Promise<k8s.V1DeploymentList>;
    async list(selector: string, objType: 'job', ns?: string): Promise<k8s.V1JobList>;
    async list(selector: string, objType: 'pod', ns?: string): Promise<k8s.V1PodList>;
    async list(selector: string, objType: 'replicaset', ns?: string): Promise<k8s.V1ReplicaSetList>;
    async list(selector: string, objType: 'service', ns?: string): Promise<k8s.V1ServiceList>;
    async list(selector: string, objType: ResourceType, ns?: string): Promise<ResourceList>;
    async list(selector: string, objType: ResourceType, ns?: string): Promise<ResourceList> {
        const namespace = ns || this.defaultNamespace;
        let responseObj: ResourceListApiResponse;

        const params: [
            string,
            string | undefined,
            boolean | undefined,
            string | undefined,
            string | undefined,
            string
        ] = [
            namespace,
            undefined,
            undefined,
            undefined,
            undefined,
            selector
        ];

        const listFunctions: { [resource: string]: () => Promise<ResourceListApiResponse> } = {
            deployment: () => this.k8sAppsV1Api.listNamespacedDeployment(...params),
            job: () => this.k8sBatchV1Api.listNamespacedJob(...params),
            pod: () => this.k8sCoreV1Api.listNamespacedPod(...params),
            replicaset: () => this.k8sAppsV1Api.listNamespacedReplicaSet(...params),
            service: () => this.k8sCoreV1Api.listNamespacedService(...params)
        };

        try {
            responseObj = await pRetry(
                listFunctions[objType],
                getRetryConfig()
            );
            return responseObj.body;
        } catch (e) {
            const err = new Error(`Request k8s.list of ${objType} with selector ${selector} failed: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }
    }

    async nonEmptyJobList(selector: string) {
        const jobs = await this.list(selector, 'job');
        if (jobs.items.length === 1) {
            return jobs;
        } else if (jobs.items.length === 0) {
            const msg = `Teraslice job matching the following selector was not found: ${selector} (retriable)`;
            this.logger.warn(msg);
            throw new TSError(msg, { retryable: true });
        } else {
            throw new TSError(`Unexpected number of Teraslice jobs matching the following selector: ${selector}`, {
                retryable: true
            });
        }
    }

    /**
     * posts manifest to k8s
     * @param  {Resource} manifest        resource manifest
     * @param  {ResourceType} manifestType    'deployment', 'job', 'pod', 'replicaset', 'service'
     * @return {k8s.V1Deployment
     *        | k8s.V1Job
     *        | k8s.V1Pod
     *        | k8s.V1ReplicaSet
     *        | k8s.V1Service}                    body of k8s API response object
     */
    async post(manifest: k8s.V1Deployment, manifestType: 'deployment'): Promise<k8s.V1Deployment>;
    async post(manifest: k8s.V1Job, manifestType: 'job'): Promise<k8s.V1Job>;
    async post(manifest: k8s.V1Pod, manifestType: 'pod'): Promise<k8s.V1Pod>;
    async post(manifest: k8s.V1ReplicaSet, manifestType: 'replicaset'): Promise<k8s.V1ReplicaSet>;
    async post(manifest: k8s.V1Service, manifestType: 'service'): Promise<k8s.V1Service>;
    async post(manifest: Resource, manifestType: ResourceType): Promise<Resource> {
        let responseObj: ResourceApiResponse;

        // const postFunctions = {
        //     deployment: async (man: k8s.V1Deployment) => await this.k8sAppsV1Api
        //         .createNamespacedDeployment(this.defaultNamespace, man),
        //     job: async (man: k8s.V1Job) => await this.k8sBatchV1Api
        //         .createNamespacedJob(this.defaultNamespace, man),
        //     pod: async (man: k8s.V1Pod) => await this.k8sCoreV1Api
        //         .createNamespacedPod(this.defaultNamespace, man),
        //     replicaset: async (man: k8s.V1ReplicaSet) => await this.k8sAppsV1Api
        //         .createNamespacedReplicaSet(this.defaultNamespace, man),
        //     service: async (man: k8s.V1Service) => await this.k8sCoreV1Api
        //         .createNamespacedService(this.defaultNamespace, man)
        // };

        try {
            if (isDeployment(manifest)) {
                responseObj = await this.k8sAppsV1Api
                    .createNamespacedDeployment(this.defaultNamespace, manifest);
            } else if (isJob(manifest)) {
                responseObj = await this.k8sBatchV1Api
                    .createNamespacedJob(this.defaultNamespace, manifest);
            } else if (isPod(manifest)) {
                responseObj = await this.k8sCoreV1Api
                    .createNamespacedPod(this.defaultNamespace, manifest);
            } else if (isReplicaSet(manifest)) {
                responseObj = await this.k8sAppsV1Api
                    .createNamespacedReplicaSet(this.defaultNamespace, manifest);
            } else if (isService(manifest)) {
                responseObj = await this.k8sCoreV1Api
                    .createNamespacedService(this.defaultNamespace, manifest);
            } else {
                const error = new Error(`Invalid manifestType: ${manifestType}`);
                return Promise.reject(error);
            }
            // responseObj = await postFunctions[manifestType](manifest);
            return responseObj.body;
        } catch (e) {
            const err = new Error(`Request k8s.post of ${manifestType} with body ${JSON.stringify(manifest)} failed: ${e}`);
            return Promise.reject(err);
        }
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
        let responseObj: PatchApiResponse;
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
            return responseObj.body;
        } catch (e) {
            const err = new Error(`Request k8s.patch with name: ${name} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }
    }

    /**
     * Deletes k8s object of specified objType
     * @param  {String}    name        Name of the resource to delete
     * @param  {ResourceType}  objType     Type of k8s object to get, valid options:
     *                                 'deployments', 'services', 'jobs', 'pods', 'replicasets'
     * @param  {Boolean}   force       Forcefully delete resource by setting gracePeriodSeconds to 1
     *                                 to be forcefully stopped.
     * @return {Object}                k8s delete response body.
     */
    async delete(
        name: string, objType: 'pod', force?: boolean
    ): Promise<k8s.V1Pod>;
    async delete(
        name: string, objType: 'deployment' | 'job' | 'replicaset', force?: boolean
    ): Promise<k8s.V1Status>;
    async delete(
        name: string, objType: 'service', force?: boolean
    ): Promise<k8s.V1Service>;
    async delete(
        name: string, objType: ResourceType, force?: boolean
    ): Promise<DeleteResponseBody>;
    async delete(
        name: string, objType: ResourceType, force?: boolean
    ): Promise<DeleteResponseBody> {
        if (name === undefined || name.trim() === '') {
            throw new Error(`Name of resource to delete must be specified. Received: "${name}".`);
        }

        let responseObj: DeleteApiResponse;

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

        const params: DeleteParams = [
            name,
            this.defaultNamespace,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            deleteOptions
        ];

        const deleteFunctions: { [resource: string]: () => Promise<DeleteApiResponse> } = {
            deployment: () => this.k8sAppsV1Api.deleteNamespacedDeployment(...params),
            job: () => this.k8sBatchV1Api.deleteNamespacedJob(...params),
            pod: () => this.k8sCoreV1Api.deleteNamespacedPod(...params),
            replicaset: () => this.k8sAppsV1Api.deleteNamespacedReplicaSet(...params),
            service: () => this.k8sCoreV1Api.deleteNamespacedService(...params)
        };

        const deleteWithErrorHandling = async (deleteFn: () => Promise<DeleteApiResponse>) => {
            try {
                const res = await deleteFn();
                return res;
            } catch (e) {
                if (e.statusCode) {
                    // 404 should be an acceptable response to a delete request, not an error
                    if (e.statusCode === 404) {
                        this.logger.info(`No ${objType} with name ${name} found while attempting to delete.`);
                        return e;
                    }
                }
                throw e;
            }
        };

        try {
            responseObj = await pRetry(
                () => deleteWithErrorHandling(deleteFunctions[objType]),
                getRetryConfig()
            );
            return responseObj.body;
        } catch (e) {
            const err = new Error(`Request k8s.delete with name: ${name} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }
    }

    /**
     * Delete all of Kubernetes resources related to the specified exId
     * @param  {String}   exId    ID of the execution
     * @param  {Boolean}  force   Forcefully stop all pod, deployment,
     *                            service, replicaset and job resources
     * @return {Promise}
     */
    async deleteExecution(exId: string, force = false) {
        if (!exId) {
            throw new Error('deleteExecution requires an executionId');
        }

        if (force) {
            // Order matters. If we delete a parent resource before its children it
            // will be marked for background deletion and then can't be force deleted.
            await this._deleteObjByExId(exId, 'worker', 'pod', force);
            await this._deleteObjByExId(exId, 'worker', 'replicaset', force);
            await this._deleteObjByExId(exId, 'worker', 'deployment', force);
            await this._deleteObjByExId(exId, 'execution_controller', 'pod', force);
            await this._deleteObjByExId(exId, 'execution_controller', 'service', force);
        }

        await this._deleteObjByExId(exId, 'execution_controller', 'job', force);
    }

    /**
     * Finds the k8s objects by nodeType and exId and then deletes them
     * @param  {String}  exId     Execution ID
     * @param  {NodeType}  nodeType valid Teraslice k8s node type:
     *                            'worker', 'execution_controller'
     * @param  {ResourceType}  objType  valid object type: `service`, `deployment`,
     *                            `job`, `pod`, `replicaset`
     * @param  {Boolean}  force    Forcefully stop all resources
     * @return {Promise}
     */
    async _deleteObjByExId(
        exId: string, nodeType: NodeType, objType: 'pod', force?: boolean
    ): Promise<k8s.V1Pod[]>;

    async _deleteObjByExId(
        exId: string, nodeType: NodeType, objType: 'job' | 'replicaset' | 'deployment', force?: boolean
    ): Promise<k8s.V1Status[]>;

    async _deleteObjByExId(
        exId: string, nodeType: NodeType, objType: 'service', force?: boolean
    ): Promise<k8s.V1Service[]>;

    async _deleteObjByExId(
        exId: string, nodeType: NodeType, objType: ResourceType, force?: boolean
    ): Promise<DeleteResponseBody[] | void> {
        let objList: K8sObjectList;
        const deleteResponses: Array<k8s.V1Pod | k8s.V1Service | k8s.V1Status> = [];

        try {
            objList = await this.list(`app.kubernetes.io/component=${nodeType},teraslice.terascope.io/exId=${exId}`, objType);
        } catch (e) {
            const err = new Error(`Request ${objType} list in _deleteObjByExId with app.kubernetes.io/component: ${nodeType} and exId: ${exId} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (isEmpty(objList.items)) {
            this.logger.info(`k8s._deleteObjByExId: ${exId} ${nodeType} ${objType} has already been deleted`);
            return Promise.resolve();
        }

        for (const obj of objList.items) {
            const name = obj.metadata?.name;
            const deletionTimestamp = obj.metadata?.deletionTimestamp;

            if (!name) {
                const err = new Error(`Cannot delete ${objType} for ExId: ${exId} by name because it has no name`);
                this.logger.error(err);
                return Promise.reject(err);
            }

            // If deletionTimestamp is present then the resource is already terminating.
            // K8s will not change the grace period in this case, so force deletion is not possible
            if (force && deletionTimestamp) {
                this.logger.warn(`Cannot force delete ${name} for ExId: ${exId}. It will finish deleting gracefully by ${deletionTimestamp}`);
                return Promise.resolve();
            }

            this.logger.info(`k8s._deleteObjByExId: ${exId} ${nodeType} ${objType} ${force ? 'force' : ''} deleting: ${name}`);
            try {
                deleteResponses.push(await this.delete(name, objType, force));
            } catch (e) {
                const err = new Error(`Request k8s.delete in _deleteObjByExId with name: ${name} failed with: ${e}`);
                this.logger.error(err);
                return Promise.reject(err);
            }
        }

        return deleteResponses;
    }

    /**
     * Scales the k8s deployment for the specified exId to the desired number
     * of workers.
     * @param  {String} exId       exId of execution to scale
     * @param  {number} numWorkers number of workers to scale by
     * @param  {ScaleOp} op         Scale operation: `set`, `add`, `remove`
     * @return {Object}            Body of patch response.
     */
    async scaleExecution(exId: string, numWorkers: number, op: ScaleOp): Promise<k8s.V1Deployment> {
        let newScale: number;
        const selector = `app.kubernetes.io/component=worker,teraslice.terascope.io/exId=${exId}`;

        this.logger.info(`Scaling exId: ${exId}, op: ${op}, numWorkers: ${numWorkers}`);
        const listResponse = await this.list(selector, 'deployment');
        this.logger.debug(`k8s worker query listResponse: ${JSON.stringify(listResponse)}`);

        // the selector provided to list above should always result in a single
        // deployment in the response.
        if (listResponse.items.length === 0) {
            const msg = `Teraslice deployment matching the following selector was not found: ${selector} (retriable)`;
            this.logger.warn(msg);
            throw new TSError(msg, { retryable: true });
        } else if (listResponse.items.length > 1) {
            throw new TSError(`Unexpected number of Teraslice deployments matching the following selector: ${selector}`, {
                retryable: true
            });
        }
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
            .patch(scalePatch, workerDeployment.metadata.name);
        this.logger.debug(`k8s.scaleExecution patchResponseBody: ${JSON.stringify(patchResponseBody)}`);
        return patchResponseBody;
    }
}
