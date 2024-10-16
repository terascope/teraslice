import {
    TSError, get, isEmpty,
    pDelay, pRetry, Logger
} from '@terascope/utils';
import KubeClient from 'kubernetes-client';
// @ts-expect-error
import Request from 'kubernetes-client/backends/request/index.js';
import { getRetryConfig } from './utils.js';
import { IncomingMessage } from 'node:http';

// @ts-expect-error
const { Client, KubeConfig } = KubeClient;

export class K8s {
    logger: Logger;
    apiPollDelay: number;
    defaultNamespace: string;
    shutdownTimeout: number;
    client: any;

    constructor(
        logger: Logger,
        clientConfig: Record<string, any> | null,
        defaultNamespace: string | null,
        apiPollDelay: number,
        shutdownTimeout: number
    ) {
        this.apiPollDelay = apiPollDelay;
        this.defaultNamespace = defaultNamespace || 'default';
        this.logger = logger;
        this.shutdownTimeout = shutdownTimeout; // this is in milliseconds

        if (clientConfig) {
            this.client = new Client({
                config: clientConfig
            });
        } else if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT) {
            // configures the client when running inside k8s
            const kubeconfig = new KubeConfig();
            kubeconfig.loadFromCluster();
            const backend = new Request({ kubeconfig });
            this.client = new Client({ backend });
        } else {
            // configures the client from .kube/config file
            this.client = new Client({ version: '1.13' });
        }
    }

    /**
     * init() Must be called after creating object.
     * @return {Promise} [description]
     */
    async init() {
        try {
            await this.client.loadSpec();
        } catch (err) {
            const error = new TSError(err, {
                reason: 'Failure calling k8s loadSpec'
            });
            throw error;
        }
    }

    /**
     * Returns the k8s NamespaceList object
     * @return {Promise} [description]
     */
    async getNamespaces() {
        let namespaces;
        try {
            namespaces = await pRetry(() => this.client
                .api.v1.namespaces.get(), getRetryConfig());
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
    async waitForSelectedPod(selector: string, ns?: string, timeout = 10000) {
        const namespace = ns || this.defaultNamespace;
        let now = Date.now();
        const end = now + timeout;

        while (true) {
            const result = await pRetry(() => this.client
                .api.v1.namespaces(namespace).pods()
                .get({ qs: { labelSelector: selector } }), getRetryConfig());

            let pod;
            if (typeof result !== 'undefined' && result) {
                // NOTE: This assumes the first pod returned.
                pod = get(result, 'body.items[0]');
            }

            if (typeof pod !== 'undefined' && pod) {
                if (get(pod, 'status.phase') === 'Running') return pod;
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
            const result = await pRetry(() => this.client
                .api.v1.namespaces(namespace).pods()
                .get({ qs: { labelSelector: selector } }), getRetryConfig());

            let podList;
            if (typeof result !== 'undefined' && result) {
                podList = get(result, 'body.items');
            }

            if (typeof podList !== 'undefined' && podList) {
                if (podList.length === number) return podList;
            }
            const msg = `Waiting: pods matching ${selector} is ${podList.length}/${number}`;
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
    *                           'pods', 'deployment', 'services', 'jobs', 'replicasets'
    * @param  {String} ns       namespace to search, this will override the default
    * @return {Object}          body of k8s get response.
    */
    async list(selector: string, objType: string, ns?: string) {
        const namespace = ns || this.defaultNamespace;
        let response;

        try {
            if (objType === 'pods') {
                response = await pRetry(() => this.client
                    .api.v1.namespaces(namespace).pods()
                    .get({ qs: { labelSelector: selector } }), getRetryConfig());
            } else if (objType === 'deployments') {
                response = await pRetry(() => this.client
                    .apis.apps.v1.namespaces(namespace).deployments()
                    .get({ qs: { labelSelector: selector } }), getRetryConfig());
            } else if (objType === 'services') {
                response = await pRetry(() => this.client
                    .api.v1.namespaces(namespace).services()
                    .get({ qs: { labelSelector: selector } }), getRetryConfig());
            } else if (objType === 'jobs') {
                response = await pRetry(() => this.client
                    .apis.batch.v1.namespaces(namespace).jobs()
                    .get({ qs: { labelSelector: selector } }), getRetryConfig());
            } else if (objType === 'replicasets') {
                response = await pRetry(() => this.client
                    .apis.apps.v1.namespaces(namespace).replicasets()
                    .get({ qs: { labelSelector: selector } }), getRetryConfig());
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

        if (response.statusCode >= 400) {
            const err = new TSError(`Problem when trying to k8s.list ${objType}`);
            this.logger.error(err);
            err.code = response.statusCode;
            return Promise.reject(err);
        }

        return response.body;
    }

    async nonEmptyList(selector: string, objType: string) {
        const jobs = await this.list(selector, objType);
        if (jobs.items.length === 1) {
            return jobs;
        } else if (jobs.items.length === 0) {
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
        let response;

        try {
            if (manifestType === 'service') {
                response = await this.client.api.v1.namespaces(this.defaultNamespace)
                    .service.post({ body: manifest });
            } else if (manifestType === 'deployment') {
                response = await this.client.apis.apps.v1.namespaces(this.defaultNamespace)
                    .deployments.post({ body: manifest });
            } else if (manifestType === 'job') {
                response = await this.client.apis.batch.v1.namespaces(this.defaultNamespace)
                    .jobs.post({ body: manifest });
            } else {
                const error = new Error(`Invalid manifestType: ${manifestType}`);
                return Promise.reject(error);
            }
        } catch (e) {
            const err = new Error(`Request k8s.post of ${manifestType} with body ${JSON.stringify(manifest)} failed: ${e}`);
            return Promise.reject(err);
        }

        if (response.statusCode >= 400) {
            const err = new TSError(`Problem when trying to k8s.post ${manifestType} with body ${JSON.stringify(manifest)}`);
            this.logger.error(err);
            err.code = response.statusCode;
            return Promise.reject(err);
        }

        return response.body;
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
        let response;

        try {
            response = await pRetry(() => this.client
                .apis.apps.v1.namespaces(this.defaultNamespace).deployments(name)
                .patch({ body: record }), getRetryConfig());
        } catch (e) {
            const err = new Error(`Request k8s.patch with ${name} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (response.statusCode >= 400) {
            const err = new TSError(`Unexpected response code (${response.statusCode}), when patching ${name} with body ${JSON.stringify(record)}`);
            this.logger.error(err);
            err.code = response.statusCode;
            return Promise.reject(err);
        }

        return response.body;
    }

    /**
     * Deletes k8s object of specified objType
     * @param  {String}  name          Name of the resource to delete
     * @param  {String}  objType       Type of k8s object to get, valid options:
     *                                 'deployments', 'services', 'jobs', 'pods', 'replicasets'
     * @param  {Boolean} force         Forcefully delete resource by setting gracePeriodSeconds to 1
     * @return {Object}                k8s delete response body.
     */
    async delete(name: string, objType: string, force?: boolean) {
        if (name === undefined || name.trim() === '') {
            throw new Error(`Name of resource to delete must be specified. Received: "${name}".`);
        }

        let response;

        // To get a Job to remove the associated pods you have to
        // include a body like the one below with the delete request.
        // To force Setting gracePeriodSeconds to 1 will send a SIGKILL command to the resource
        const deleteOptions: DeleteOptions = {
            body: {
                apiVersion: 'v1',
                kind: 'DeleteOptions',
                propagationPolicy: 'Background'
            }
        };

        if (force) {
            deleteOptions.body.gracePeriodSeconds = 1;
        }

        const deleteWithErrorHandling = async (deleteFn: () => Promise<{
            response: IncomingMessage;
            body: Record<string, any>;
        }>) => {
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

                    if (e.statusCode >= 400) {
                        const err = new TSError(`Unexpected response code (${e.statusCode}), when deleting name: ${name}`);
                        this.logger.error(err);
                        err.code = e.statusCode.toString();
                        return Promise.reject(err);
                    }
                }
                throw e;
            }
        };

        try {
            if (objType === 'services') {
                response = await pRetry(() => deleteWithErrorHandling(() => this.client
                    .api.v1.namespaces(this.defaultNamespace).services(name)
                    .delete(deleteOptions)), getRetryConfig());
            } else if (objType === 'deployments') {
                response = await pRetry(() => deleteWithErrorHandling(() => this.client
                    .apis.apps.v1.namespaces(this.defaultNamespace).deployments(name)
                    .delete(deleteOptions)), getRetryConfig());
            } else if (objType === 'jobs') {
                response = await pRetry(() => deleteWithErrorHandling(() => this.client
                    .apis.batch.v1.namespaces(this.defaultNamespace).jobs(name)
                    .delete(deleteOptions)), getRetryConfig());
            } else if (objType === 'pods') {
                response = await pRetry(() => deleteWithErrorHandling(() => this.client
                    .api.v1.namespaces(this.defaultNamespace).pods(name)
                    .delete(deleteOptions)), getRetryConfig());
            } else if (objType === 'replicasets') {
                response = await pRetry(() => deleteWithErrorHandling(() => this.client
                    .apis.apps.v1.namespaces(this.defaultNamespace).replicasets(name)
                    .delete(deleteOptions)), getRetryConfig());
            } else {
                throw new Error(`Invalid objType: ${objType}`);
            }
        } catch (e) {
            const err = new Error(`Request k8s.delete with name: ${name} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        return response.body;
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
     * @param  {String}  nodeType valid Teraslice k8s node type:
     *                            'worker', 'execution_controller'
     * @param  {String}  objType  valid object type: `services`, `deployments`,
     *                            `jobs`, `pods`, `replicasets`
     * @param  {Boolean}  force    Forcefully stop all resources
     * @return {Promise}
     */
    async _deleteObjByExId(exId: string, nodeType: string, objType: string, force?: boolean) {
        let objList;
        const deleteResponses = [];

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
            const { name, deletionTimestamp } = obj.metadata;

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
     * @param  {String} op         Scale operation: `set`, `add`, `remove`
     * @return {Object}            Body of patch response.
     */
    async scaleExecution(exId: string, numWorkers: number, op: string) {
        let newScale;

        this.logger.info(`Scaling exId: ${exId}, op: ${op}, numWorkers: ${numWorkers}`);
        const listResponse = await this.list(`app.kubernetes.io/component=worker,teraslice.terascope.io/exId=${exId}`, 'deployments');
        this.logger.debug(`k8s worker query listResponse: ${JSON.stringify(listResponse)}`);

        // the selector provided to list above should always result in a single
        // deployment in the response.
        // TODO: test for more than 1 and error
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

        const scalePatch = {
            spec: {
                replicas: newScale
            }
        };

        const patchResponseBody = await this.patch(scalePatch, workerDeployment.metadata.name);
        this.logger.debug(`k8s.scaleExecution patchResponseBody: ${JSON.stringify(patchResponseBody)}`);
        return patchResponseBody;
    }
}

interface DeleteOptions {
    body: {
        apiVersion: string;
        kind: string;
        propagationPolicy: string;
        gracePeriodSeconds?: number;
    };
}
