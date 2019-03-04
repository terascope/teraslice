'use strict';

const _ = require('lodash');
const { Client, config } = require('kubernetes-client');

class K8s {
    constructor(logger, clientConfig, defaultNamespace = 'default') {
        this.logger = logger;
        this.defaultNamespace = defaultNamespace;

        if (clientConfig) {
            this.client = new Client({
                config: clientConfig
            });
        } else if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT) {
            // configures the client when running inside k8s
            try {
                this.client = new Client({ config: config.getInCluster() });
            } catch (e) {
                logger.error(e, 'Unable to create k8s Client using getInCluster');
                // throw e;
            }
        } else {
            // configures the client from ~/.kube/config when running outside k8s
            try {
                this.client = new Client({ config: config.fromKubeconfig() });
            } catch (e) {
                logger.error(e, 'Unable to create k8s Client using fromKubeconfig');
                // throw e;
            }
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
            const error = new Error(`Failure calling k8s loadSpec: ${err.stack}`);
            this.logger.error(error);
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
            namespaces = await this.client.api.v1.namespaces.get();
        } catch (err) {
            const error = new Error(`Failure getting in namespaces: ${err.stack}`);
            this.logger.error(error);
            throw error;
        }
        return namespaces.body;
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
                response = await this.client.api.v1.namespaces(namespace)
                    .pods().get({ qs: { labelSelector: selector } });
            } else if (objType === 'deployments') {
                response = await this.client.apis.apps.v1.namespaces(namespace)
                    .deployments().get({ qs: { labelSelector: selector } });
            } else if (objType === 'services') {
                response = await this.client.api.v1.namespaces(namespace)
                    .services().get({ qs: { labelSelector: selector } });
            } else if (objType === 'jobs') {
                response = await this.client.apis.batch.v1.namespaces(namespace)
                    .jobs().get({ qs: { labelSelector: selector } });
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
                this.logger.error(error);
                return Promise.reject(error);
            }
        } catch (e) {
            const err = new Error(`Request k8s.post of ${manifestType} with body ${JSON.stringify(manifest)} failed: ${e}`);
            this.logger.error(err);
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
            response = await this.client.apis.apps.v1.namespaces(this.defaultNamespace)
                .deployments(name).patch({ body: record });
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
                response = await this.client.api.v1.namespaces(this.defaultNamespace)
                    .services(name).delete();
            } else if (objType === 'deployments') {
                response = await this.client.apis.apps.v1.namespaces(this.defaultNamespace)
                    .deployments(name).delete();
            } else if (objType === 'jobs') {
                // To get a Job to remove the associated pods you have to
                // include a body like the one below with the delete request
                response = await this.client.apis.batch.v1.namespaces(this.defaultNamespace)
                    .jobs(name).delete({
                        body: {
                            apiVersion: 'v1',
                            kind: 'DeleteOptions',
                            propagationPolicy: 'Background'
                        }
                    });
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
     * @param  {String}  exId ID of the execution
     * @return {Promise}
     */
    async deleteExecution(exId) {
        if (!exId) {
            throw new Error('deleteExecution requires an executionId');
        }

        return Promise.all([
            this._deleteObjByExId(exId, 'worker', 'deployments'),
            this._deleteObjByExId(exId, 'execution_controller', 'jobs'),
            this._deleteObjByExId(exId, 'execution_controller', 'services')
        ]);
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
            objList = await this.list(`nodeType=${nodeType},exId=${exId}`, objType);
        } catch (e) {
            const err = new Error(`Request list in _deleteObjByExId with nodeType: ${nodeType} and exId: ${exId} failed with: ${e}`);
            this.logger.error(err);
            return Promise.reject(err);
        }

        if (_.isEmpty(objList.items)) {
            this.logger.info(`k8s._deleteObjByExId: ${exId} ${nodeType} ${objType} has already been deleted`);
            return Promise.resolve();
        }

        const name = _.get(objList, 'items[0].metadata.name');
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
        const listResponse = await this.list(`nodeType=worker,exId=${exId}`, 'deployments');
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
