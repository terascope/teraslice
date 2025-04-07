import {
    TSError, get, isEmpty,
    pDelay, pRetry, Logger
} from '@terascope/utils';
import * as k8s from '@kubernetes/client-node';
import {
    convertToTSResource, convertToTSResourceList, getRetryConfig,
    isDeployment, isJob, isPod,
    isReplicaSet, isService, isTSPod
} from './utils.js';
import * as i from './interfaces.js';

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
        clientConfig: i.KubeConfigOptions | null,
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
        let namespaces: k8s.V1NamespaceList;
        try {
            namespaces = await pRetry(() => this.k8sCoreV1Api.listNamespace(), getRetryConfig());
        } catch (err) {
            const error = new TSError(err, {
                reason: 'Failure getting in namespaces'
            });
            throw error;
        }
        return namespaces;
    }

    /**
     * Returns the first pod matching the provided selector after it has
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
            const podListObj: k8s.V1PodList = await pRetry(() => this.k8sCoreV1Api
                .listNamespacedPod({ namespace, labelSelector: selector }),
            getRetryConfig());
            // NOTE: This assumes the first pod returned.
            const pod = get(podListObj, 'items[0]');

            if (pod && isTSPod(pod)) {
                if (statusType === 'readiness-probe') {
                    if (pod.status.conditions) {
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
            const podListObj: k8s.V1PodList = await pRetry(() => this.k8sCoreV1Api
                .listNamespacedPod({ namespace, labelSelector: selector }),
            getRetryConfig());

            const podList: k8s.V1Pod[] = get(podListObj, 'items');

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
    async list(selector: string, objType: 'deployments', ns?: string): Promise<i.TSDeploymentList>;
    async list(selector: string, objType: 'jobs', ns?: string): Promise<i.TSJobList>;
    async list(selector: string, objType: 'pods', ns?: string): Promise<i.TSPodList>;
    async list(selector: string, objType: 'replicasets', ns?: string): Promise<i.TSReplicaSetList>;
    async list(selector: string, objType: 'services', ns?: string): Promise<i.TSServiceList>;
    async list(selector: string, objType: i.ResourceType, ns?: string): Promise<i.TSResourceList>;
    async list(selector: string, objType: i.ResourceType, ns?: string): Promise<i.TSResourceList> {
        const namespace = ns || this.defaultNamespace;
        let resourceListObj: i.K8sResourceList;

        const params = {
            namespace,
            labelSelector: selector
        };

        try {
            if (objType === 'deployments') {
                resourceListObj = await pRetry(
                    () => this.k8sAppsV1Api.listNamespacedDeployment(params),
                    getRetryConfig()
                );
            } else if (objType === 'jobs') {
                resourceListObj = await pRetry(
                    () => this.k8sBatchV1Api.listNamespacedJob(params),
                    getRetryConfig()
                );
            } else if (objType === 'pods') {
                resourceListObj = await pRetry(
                    () => this.k8sCoreV1Api.listNamespacedPod(params),
                    getRetryConfig()
                );
            } else if (objType === 'replicasets') {
                resourceListObj = await pRetry(
                    () => this.k8sAppsV1Api.listNamespacedReplicaSet(params),
                    getRetryConfig()
                );
            } else if (objType === 'services') {
                resourceListObj = await pRetry(
                    () => this.k8sCoreV1Api.listNamespacedService(params),
                    getRetryConfig()
                );
            } else {
                const error = new Error(`Invalid objType provided to get: ${objType}`);
                this.logger.error(error);
                return Promise.reject(error);
            }
            return convertToTSResourceList(resourceListObj);
        } catch (e) {
            const err = new Error(`Request k8s.list of ${objType} with selector ${selector} failed: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }
    }

    async nonEmptyJobList(selector: string): Promise<i.TSJobList> {
        const jobs = await this.list(selector, 'jobs');
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
     * @param  {K8sResource} manifest        resource manifest
     * @return {K8sResource}                 body of k8s API response object
     */
    async post(manifest: k8s.V1Deployment): Promise<i.TSDeployment>;
    async post(manifest: k8s.V1Job): Promise<i.TSJob>;
    async post(manifest: k8s.V1Pod): Promise<i.TSPod>;
    async post(manifest: k8s.V1ReplicaSet): Promise<i.TSReplicaSet>;
    async post(manifest: k8s.V1Service): Promise<i.TSService>;
    async post(manifest: i.K8sResource): Promise<i.TSResource> {
        let resourceObj: i.K8sResource;
        const namespace = this.defaultNamespace;

        try {
            if (isDeployment(manifest)) {
                resourceObj = await this.k8sAppsV1Api
                    .createNamespacedDeployment({ namespace, body: manifest });
            } else if (isJob(manifest)) {
                resourceObj = await this.k8sBatchV1Api
                    .createNamespacedJob({ namespace, body: manifest });
            } else if (isPod(manifest)) {
                resourceObj = await this.k8sCoreV1Api
                    .createNamespacedPod({ namespace, body: manifest });
            } else if (isReplicaSet(manifest)) {
                resourceObj = await this.k8sAppsV1Api
                    .createNamespacedReplicaSet({ namespace, body: manifest });
            } else if (isService(manifest)) {
                resourceObj = await this.k8sCoreV1Api
                    .createNamespacedService({ namespace, body: manifest });
            } else {
                const error = new Error('Invalid manifest type');
                return Promise.reject(error);
            }

            return convertToTSResource(resourceObj);
        } catch (e) {
            const err = new Error(`Request k8s.post of ${manifest.kind} with body ${JSON.stringify(manifest)} failed: ${e}`);
            return Promise.reject(err);
        }
    }

    /**
     * Patches specified k8s deployment with the provided record
     * @param  {String} record record, like 'app=teraslice'
     * @param  {String} name   Name of the deployment to patch
     * @return {Object}        k8s V1Deployment object.
     */
    // TODO: I renamed this from patchDeployment to just patch because this is
    // the low level k8s api method, I expect to eventually change the interface
    // on this to require `objType` to support patching other things
    async patch(record: Record<string, any>, name: string) {
        let responseObj: k8s.V1Deployment;
        try {
            const options = k8s.setHeaderOptions('Content-Type', k8s.PatchStrategy.JsonPatch);
            responseObj = await pRetry(() => this.k8sAppsV1Api.patchNamespacedDeployment({
                name,
                namespace: this.defaultNamespace,
                body: record
            }, options), getRetryConfig());
            return responseObj;
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
     * @return {Object}                k8s service, pod or status object.
     */
    async delete(
        name: string, objType: 'pods', force?: boolean
    ): Promise<k8s.V1Pod>;
    async delete(
        name: string, objType: 'deployments' | 'jobs' | 'replicasets', force?: boolean
    ): Promise<k8s.V1Status>;
    async delete(
        name: string, objType: 'services', force?: boolean
    ): Promise<k8s.V1Service>;
    async delete(
        name: string, objType: i.ResourceType, force?: boolean
    ): Promise<k8s.V1Pod | k8s.V1Status | k8s.V1Service>;
    async delete(
        name: string, objType: i.ResourceType, force?: boolean
    ): Promise<k8s.V1Pod | k8s.V1Status | k8s.V1Service> {
        if (name === undefined || name.trim() === '') {
            throw new Error(`Name of resource to delete must be specified. Received: "${name}".`);
        }

        let responseObj: k8s.V1Pod | k8s.V1Status | k8s.V1Service;

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

        const params = {
            name,
            namespace: this.defaultNamespace,
            body: deleteOptions
        };

        const deleteWithErrorHandling = async (
            deleteFn: () => Promise<k8s.V1Pod | k8s.V1Status | k8s.V1Service>
        ): Promise<k8s.V1Pod | k8s.V1Status | k8s.V1Service> => {
            try {
                const res = await deleteFn();
                return res;
            } catch (e) {
                if (e.body) {
                    const bodyObj = JSON.parse(e.body);
                    // 404 should be an acceptable response to a delete request, not an error
                    if (bodyObj.code === 404) {
                        this.logger.info(`No ${objType} with name ${name} found while attempting to delete.`);
                        return bodyObj;
                    }
                }
                throw e;
            }
        };

        try {
            if (objType === 'services') {
                responseObj = await pRetry(() => deleteWithErrorHandling(() => this.k8sCoreV1Api
                    .deleteNamespacedService(params)), getRetryConfig());
            } else if (objType === 'deployments') {
                responseObj = await pRetry(() => deleteWithErrorHandling(() => this.k8sAppsV1Api
                    .deleteNamespacedDeployment(params)), getRetryConfig());
            } else if (objType === 'jobs') {
                responseObj = await pRetry(() => deleteWithErrorHandling(() => this.k8sBatchV1Api
                    .deleteNamespacedJob(params)), getRetryConfig());
            } else if (objType === 'pods') {
                responseObj = await pRetry(() => deleteWithErrorHandling(() => this.k8sCoreV1Api
                    .deleteNamespacedPod(params)), getRetryConfig());
            } else if (objType === 'replicasets') {
                responseObj = await pRetry(() => deleteWithErrorHandling(() => this.k8sAppsV1Api
                    .deleteNamespacedReplicaSet(params)), getRetryConfig());
            } else {
                throw new Error(`Invalid objType: ${objType}`);
            }

            return responseObj;
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
            await this._deleteObjByExId(exId, 'worker', 'pods', force);
            await this._deleteObjByExId(exId, 'worker', 'replicasets', force);
            await this._deleteObjByExId(exId, 'worker', 'deployments', force);
            await this._deleteObjByExId(exId, 'execution_controller', 'pods', force);
            await this._deleteObjByExId(exId, 'execution_controller', 'services', force);
        }

        await this._deleteObjByExId(exId, 'execution_controller', 'jobs', force);
    }

    /**
     * Finds the k8s objects by nodeType and exId and then deletes them
     * @param  {String}  exId     Execution ID
     * @param  {NodeType}  nodeType valid Teraslice k8s node type:
     *                            'worker', 'execution_controller'
     * @param  {ResourceType}  objType  valid object type: `services`, `deployments`,
     *                            `jobs`, `pods`, `replicasets`
     * @param  {Boolean}  force    Forcefully stop all resources
     * @return {Promise<(k8s.V1Pod | k8s.V1Status | k8s.V1Service)[]>}
     */
    async _deleteObjByExId(
        exId: string, nodeType: i.NodeType, objType: 'pods', force?: boolean
    ): Promise<k8s.V1Pod[]>;

    async _deleteObjByExId(
        exId: string, nodeType: i.NodeType, objType: 'jobs' | 'replicasets' | 'deployments', force?: boolean
    ): Promise<k8s.V1Status[]>;

    async _deleteObjByExId(
        exId: string, nodeType: i.NodeType, objType: 'services', force?: boolean
    ): Promise<k8s.V1Service[]>;

    async _deleteObjByExId(
        exId: string, nodeType: i.NodeType, objType: i.ResourceType, force?: boolean
    ): Promise<(k8s.V1Pod | k8s.V1Status | k8s.V1Service)[] | void> {
        let objList: i.TSResourceList;
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
            const name = obj.metadata.name;
            const deletionTimestamp = obj.metadata.deletionTimestamp;

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
     * @param  {String} exId                 exId of execution to scale
     * @param  {number} numWorkers           number of workers to scale by
     * @param  {ScaleOp} op                  Scale operation: `set`, `add`, `remove`
     * @return {Promise<k8s.V1Deployment>}   Body of patch response.
     */
    async scaleExecution(
        exId: string,
        numWorkers: number,
        op: i.ScaleOp
    ): Promise<k8s.V1Deployment> {
        let newScale: number;
        const selector = `app.kubernetes.io/component=worker,teraslice.terascope.io/exId=${exId}`;

        this.logger.info(`Scaling exId: ${exId}, op: ${op}, numWorkers: ${numWorkers}`);
        const listResponse = await this.list(selector, 'deployments');
        this.logger.debug(`k8s worker query listResponse: ${JSON.stringify(listResponse)}`);

        // the selector provided to list above should always result in a single
        // deployment in the response.
        if (listResponse.items.length === 0) {
            const msg = `Teraslice deployment matching the following selector was not found: ${selector}`;
            this.logger.warn(msg);
            throw new TSError(msg);
        } else if (listResponse.items.length > 1) {
            throw new TSError(`Unexpected number of Teraslice deployments matching the following selector: ${selector}`);
        }

        const workerDeployment = listResponse.items[0];
        this.logger.info(`Current Scale for exId=${exId}: ${workerDeployment.spec.replicas}`);

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

        const patchResponseBody = await this
            .patch(scalePatch, workerDeployment.metadata.name);
        this.logger.debug(`k8s.scaleExecution patchResponseBody: ${JSON.stringify(patchResponseBody)}`);
        return patchResponseBody;
    }
}
