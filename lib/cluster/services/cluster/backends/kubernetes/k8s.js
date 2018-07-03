'use strict';

const { Client, config } = require('kubernetes-client');

// FIXME: Most of my low level methods return `response.body` which hides the
// HTTP response code from the caller, this hides errors.  I think I am doing
// this wrong.  I've still not given proper thought to error handling, this is
// probably related.
class K8s {
    constructor(logger, clientConfig) {
        this.logger = logger;

        if (clientConfig) {
            this.client = new Client({
                config: clientConfig
            });
        } else if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT) {
            // configures the client when running inside k8s
            try {
                this.client = new Client({ config: config.getInCluster() });
            } catch (e) {
                logger.error(`Unable to create k8s Client using getInCluster: ${e}`);
                // throw e;
            }
        } else {
            // configures the client from ~/.kube/config when running outside k8s
            try {
                this.client = new Client({ config: config.fromKubeconfig() });
            } catch (e) {
                logger.error(`Unable to create k8s Client using fromKubeconfig: ${e}`);
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
        } catch (e) {
            this.logger.error(`Error calling k8s loadSpec: ${e}`);
            // throw e;
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
        } catch (e) {
            this.logger.error(`Error in getNamespaces: ${e}`);
            // throw e;
        }
        return namespaces.body;
    }


    /**
    * returns list of k8s objects matching provided selector
    * @param  {String} selector kubernetes selector, like 'app=teraslice'
    * @param  {String} objType  Type of k8s object to get, valid options:
    *                           'pods', 'deployment', 'services'
    * @param  {String} ns       namespace to search, Default: 'default'
    * @return {Object}          body of k8s get response.
    */
    async list(selector, objType, ns) {
        const namespace = ns || 'default';
        let response;

        try {
            if (objType === 'pods') {
                response = await this.client.api.v1.namespaces(namespace)
                    .pods().get({ qs: { labelSelector: selector } });
            } else if (objType === 'deployments') {
                response = await this.client.api.apps.v1.namespaces(namespace)
                    .deployments().get({ qs: { labelSelector: selector } });
            } else if (objType === 'services') {
                response = await this.client.api.v1.namespaces(namespace)
                    .services().get({ qs: { labelSelector: selector } });
            } else {
                this.logger.error(`Error: Wrong objType provided to get: ${objType}`);
            }
        } catch (e) {
            const err = new Error(`Request k8s.list of ${objType} with selector ${selector} failed: ${e}`);
            this.logger.error(err.stack);
            return Promise.reject(err);
        }

        if (response.statusCode >= 400) {
            const err = new Error(`Problem when trying to k8s.list ${objType}`);
            this.logger.error(err.stack);
            err.code = response.statusCode;
            return Promise.reject(err);
        }

        return response.body;
    }


    /**
     * posts manifest to k8s
     * @param  {Object} manifest     service manifest
     * @param  {String} manifestType 'service', 'deployment'
     * @return {Object}              body of k8s API response object
     */
    async post(manifest, manifestType) {
        let response;

        try {
            if (manifestType === 'service') {
                response = await this.client.api.v1.namespaces('default')
                    .service.post({ body: manifest });
            } else if (manifestType === 'deployment') {
                response = await this.client.apis.apps.v1.namespaces('default')
                    .deployments.post({ body: manifest });
            } else {
                this.logger.error(`Error: Invalid manifestType: ${manifestType}`);
            }
        } catch (e) {
            const err = new Error(`Request k8s.post of ${manifestType} with body ${JSON.stringify(manifest)} failed: ${e}`);
            this.logger.error(err.stack);
            return Promise.reject(err);
        }

        if (response.statusCode >= 400) {
            const err = new Error(`Problem when trying to k8s.post ${manifestType} with body ${JSON.stringify(manifest)}`);
            this.logger.error(err.stack);
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
            response = await this.client.api.apps.v1.namespaces('default')
                .deployments(name).patch({ body: record });
        } catch (e) {
            const err = new Error(`Request k8s.patch with ${name} failed with: ${e}`);
            this.logger.error(err.stack);
            return Promise.reject(err);
        }

        if (response.statusCode >= 400) {
            const err = new Error(`Unexpected response code (${response.statusCode}), when patching ${name} with body ${JSON.stringify(record)}`);
            this.logger.error(err.stack);
            err.code = response.statusCode;
            return Promise.reject(err);
        }

        return response.body;
    }


    /**
     * Deletes k8s object of specified objType
     * @param  {String} name     Name of the deployment to delete
     * @param  {String} objType  Type of k8s object to get, valid options:
     *                           'deployments', 'services'
     * @return {Object}          body of k8s delete response.
     */
    async delete(name, objType) {
        let response;

        try {
            if (objType === 'services') {
                response = await this.client.api.v1.namespaces('default')
                    .services(name).delete();
            } else if (objType === 'deployments') {
                response = await this.client.api.apps.v1.namespaces('default')
                    .deployments(name).delete();
            } else {
                this.logger.error(`Error: Invalid objType: ${objType}`);
            }
        } catch (e) {
            const err = new Error(`Request k8s.delete with name: ${name} failed with: ${e}`);
            this.logger.error(err.stack);
            return Promise.reject(err);
        }

        if (response.statusCode >= 400) {
            const err = new Error(`Unexpected response code (${response.statusCode}), when deleting name: ${name}`);
            this.logger.error(err.stack);
            err.code = response.statusCode;
            return Promise.reject(err);
        }

        return response.body;
    }


    /**
     * Delete all of the deployments and services related to the specified exId
     * @param  {[type]}  exId ID of the execution
     * @return {Promise}
     */
    async deleteExecution(exId) {
        this._deleteObjByExId(exId, 'worker', 'deployments');
        this._deleteObjByExId(exId, 'execution_controller', 'deployments');
        this._deleteObjByExId(exId, 'execution_controller', 'services');
    }


    /**
     * Finds the k8s object by nodeType and exId and then deletes it
     * @param  {[type]}  exId     Execution ID
     * @param  {[type]}  nodeType valid Teraslice k8s node type:
     *                            'worker', 'execution_controller'
     * @param  {[type]}  objType  valid object type: `services`, `deployments`
     * @return {Promise}
     */
    async _deleteObjByExId(exId, nodeType, objType) {
        let objList;
        let deleteResponse;

        try {
            objList = await this.list(`nodeType=${nodeType},exId=${exId}`, objType);
        } catch (e) {
            const err = new Error(`Request list in _deleteObjByExId with nodeType: ${nodeType} and exId: ${exId} failed with: ${e}`);
            this.logger.error(err.stack);
            return Promise.reject(err);
        }

        this.logger.info(`k8s._deleteObjByExId: ${exId} ${nodeType} ${objType} deleting: ${objList.items[0].metadata.name}`);

        try {
            deleteResponse = await this.delete(objList.items[0].metadata.name, objType);
        } catch (e) {
            const err = new Error(`Request k8s.delete in _deleteObjByExId with name: ${objList.items[0].metadata.name} failed with: ${e}`);
            this.logger.error(err.stack);
            return Promise.reject(err);
        }
        return deleteResponse;
    }

    /**
     * Scales the k8s deployment for the specified exId to the desired number
     * of workers.
     * @param  {String} exId       exId of execution to scale
     * @param  {number} numWorkers [description]
     * @param  {String} op         [description]
     * @return {[type]}            [description]
     */
    async scaleExecution(exId, numWorkers, op) {
        let newScale;

        this.logger.debug(`Scaling exId: ${exId}, op: ${op}, numWorkers: ${numWorkers}`);
        const listResponse = await this.list(`nodeType=worker,exId=${exId}`, 'deployments');
        this.logger.info(`k8s worker query listResponse: ${JSON.stringify(listResponse)}`);

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
            this.logger.error('scaleExecution only accepts the following operations: add, remove, set');
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
