'use strict';

const {
    TSError, get, isEmpty, pDelay, pRetry
} = require('@terascope/utils');
const { Client, KubeConfig } = require('kubernetes-client');
const Request = require('kubernetes-client/backends/request');
const { getRetryConfig } = require('./utils');

class K8s {
    constructor(logger, clientConfig, defaultNamespace = 'default',
        apiPollDelay, shutdownTimeout) {
        this.apiPollDelay = apiPollDelay;
        this.defaultNamespace = defaultNamespace;
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
     */
    async waitForSelectedPod(selector, ns, timeout = 10000) {
        const namespace = ns || this.defaultNamespace;
        let now = Date.now();
        const end = now + timeout;

        // eslint-disable-next-line no-constant-condition
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
     */
    async waitForNumPods(number, selector, ns, timeout = 10000) {
        const namespace = ns || this.defaultNamespace;
        let now = Date.now();
        const end = now + timeout;

        // eslint-disable-next-line no-constant-condition
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
    *                           'pods', 'deployment', 'services', 'jobs'
    * @param  {String} ns       namespace to search, this will override the default
    * @return {Object}          body of k8s get response.
    */
    async list(selector, objType, ns) {
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
            const err = new Error(`Problem when trying to k8s.list ${objType}`);
            this.logger.error(err);
            err.code = response.statusCode;
            return Promise.reject(err);
        }

        return response.body;
    }

    /**
     * posts manifest to k8s
     * @param  {Object} manifest     service manifest
     * @param  {String} manifestType 'service', 'deployment', 'job'
     * @return {Object}              body of k8s API response object
     */
    async post(manifest, manifestType) {
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
            const err = new Error(`Problem when trying to k8s.post ${manifestType} with body ${JSON.stringify(manifest)}`);
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
    async patch(record, name) {
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
            const err = new Error(`Unexpected response code (${response.statusCode}), when patching ${name} with body ${JSON.stringify(record)}`);
            this.logger.error(err);
            err.code = response.statusCode;
            return Promise.reject(err);
        }

        return response.body;
    }

    /**
     * Deletes k8s object of specified objType
     * @param  {String} name     Name of the deployment to delete
     * @param  {String} objType  Type of k8s object to get, valid options:
     *                           'deployments', 'services', 'jobs'
     * @return {Object}          body of k8s delete response.
     */
    async delete(name, objType) {
        let response;

        try {
            if (objType === 'services') {
                response = await pRetry(() => this.client
                    .api.v1.namespaces(this.defaultNamespace).services(name)
                    .delete(), getRetryConfig(), getRetryConfig());
            } else if (objType === 'deployments') {
                response = await pRetry(() => this.client
                    .apis.apps.v1.namespaces(this.defaultNamespace).deployments(name)
                    .delete(), getRetryConfig());
            } else if (objType === 'jobs') {
                // To get a Job to remove the associated pods you have to
                // include a body like the one below with the delete request
                response = await pRetry(() => this.client
                    .apis.batch.v1.namespaces(this.defaultNamespace).jobs(name)
                    .delete({
                        body: {
                            apiVersion: 'v1',
                            kind: 'DeleteOptions',
                            propagationPolicy: 'Background'
                        }
                    }), getRetryConfig());
            } else {
                throw new Error(`Invalid objType: ${objType}`);
            }
        } catch (e) {
            const err = new Error(`Request k8s.delete with name: ${name} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (response.statusCode >= 400) {
            const err = new Error(`Unexpected response code (${response.statusCode}), when deleting name: ${name}`);
            this.logger.error(err);
            err.code = response.statusCode;
            return Promise.reject(err);
        }

        return response.body;
    }

    /**
     * Delete all of the deployments and services related to the specified exId
     *
     * The process here waits for the worker pods to completely exit before
     * terminating the execution controller pod.  The intent is to avoid having
     * a worker timeout when it tries to tell the execution controller it is
     * exiting.
     *
     * @param  {String}  exId ID of the execution
     * @return {Promise}
     */
    async deleteExecution(exId) {
        const r = [];
        if (!exId) {
            throw new Error('deleteExecution requires an executionId');
        }

        // FIXME: think more about this
        this.logger.info(`Deleting worker deployment for ex_id: ${exId}`);
        r.push(await this._deleteObjByExId(exId, 'worker', 'deployments'));

        await this.waitForNumPods(
            0,
            `app.kubernetes.io/component=worker,teraslice.terascope.io/exId=${exId}`,
            null,
            this.shutdownTimeout + 15000 // shutdown_timeout + 15s
        );

        try {
            this.logger.info(`Deleting execution controller job for ex_id: ${exId}`);
            r.push(await this._deleteObjByExId(exId, 'execution_controller', 'jobs'));
        } catch (e) {
            const err = new Error(`Error deleting execution controller: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        this.logger.debug(`Deleted Resources:\n\n${r.map((x) => JSON.stringify(x, null, 2))}`);
        return r;
    }

    /**
     * Finds the k8s object by nodeType and exId and then deletes it
     * @param  {String}  exId     Execution ID
     * @param  {String}  nodeType valid Teraslice k8s node type:
     *                            'worker', 'execution_controller'
     * @param  {String}  objType  valid object type: `services`, `deployments`,
     *                            'jobs'
     * @return {Promise}
     */
    async _deleteObjByExId(exId, nodeType, objType) {
        let objList;
        let deleteResponse;

        try {
            objList = await this.list(`app.kubernetes.io/component=${nodeType},teraslice.terascope.io/exId=${exId}`, objType);
        } catch (e) {
            const err = new Error(`Request list in _deleteObjByExId with app.kubernetes.io/component: ${nodeType} and exId: ${exId} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (isEmpty(objList.items)) {
            this.logger.info(`k8s._deleteObjByExId: ${exId} ${nodeType} ${objType} has already been deleted`);
            return Promise.resolve();
        }

        const name = get(objList, 'items[0].metadata.name');
        this.logger.info(`k8s._deleteObjByExId: ${exId} ${nodeType} ${objType} deleting: ${name}`);

        try {
            deleteResponse = await this.delete(name, objType);
        } catch (e) {
            const err = new Error(`Request k8s.delete in _deleteObjByExId with name: ${name} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }
        return deleteResponse;
    }

    /**
     * Scales the k8s deployment for the specified exId to the desired number
     * of workers.
     * @param  {String} exId       exId of execution to scale
     * @param  {number} numWorkers number of workers to scale by
     * @param  {String} op         Scale operation: `set`, `add`, `remove`
     * @return {Object}            Body of patch response.
     */
    async scaleExecution(exId, numWorkers, op) {
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

module.exports = K8s;
