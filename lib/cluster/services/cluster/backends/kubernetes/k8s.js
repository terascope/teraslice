'use strict';

const { Client, config } = require('kubernetes-client');

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
    *                               'pods', 'deployment'
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
            } else {
                this.logger.error(`Error: Wrong objType provided to get: ${objType}`);
            }
        } catch (e) {
            this.logger.error(`Error getting ${objType} with selector ${selector}: ${e}`);
            // throw e;
        }
        // FIXME: I should probably be looking at createdManifest.statusCode to
        // make sure it's acceptible
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
        } catch (err) {
            this.logger.error(`Error caught: ${err}`);
        }
        // TODO: I should probably be looking at response.statusCode to
        // make sure it's acceptible
        return response.body;
    }

    /**
     * Patches specified k8s deployment with the provided record
     * @param  {String} record record, like 'app=teraslice'
     * @param  {String} name   Name of the deployment to patch
     * @return {Object}        body of k8s patch response.
     */
    async patchDeployment(record, name) {
        let response;

        try {
            response = await this.client.api.apps.v1.namespaces('default')
                .deployments(name).patch({ body: record });
            this.logger.info(`patch deployment response: ${JSON.stringify(response)}`);
        } catch (e) {
            this.logger.error(`Error trying to patch ${name}: ${e}`);
            // FIXME: What is the appropriate way to handle errors in this case?
        }

        if (![200, 204].includes(response.statusCode)) {
            const msg = `Unexpected response code, ${response.statusCode}, when patching, ${name}`;
            this.logger.error(msg);
        }

        return response.body;
    }

    /**
     * Scales the k8s deployment for the specified exId to the desired number
     * of workers.
     * @param  {String} exId       exId of execution to scale
     * @param  {number} numWorkers [description]
     * @param  {String} op         [description]
     * @return {[type]}            [description]
     */
    async scaleDeployment(exId, numWorkers, op) {
        this.logger.info(`Scaling exId: ${JSON.stringify(exId)}, op: ${op}, numWorkers: ${numWorkers}`);
        this.list(`nodeType=worker,exId=${exId}`, 'deployments')
            .then((response) => {
                let newScale;
                this.logger.info(`k8s worker query Response: ${JSON.stringify(response)}`);

                // the selector provided to list above should always result in a
                // single deployment in the response.
                // TODO: test for more than 1 and error
                const workerDeployment = response.items[0];
                const originalScale = workerDeployment.spec.replicas;
                this.logger.info(`Current Scale for exId=${exId}: ${originalScale}`);

                if (op === 'set') {
                    newScale = numWorkers;
                } else if (op === 'add') {
                    newScale = originalScale + numWorkers;
                } else if (op === 'remove') {
                    newScale = originalScale - numWorkers;
                } else {
                    this.logger.error('scaleDeployment only accepts the following operations: add, remove, set');
                }

                this.logger.info(`New Scale for exId=${exId}: ${newScale}`);
                const scalePatch = {
                    spec: {
                        replicas: newScale
                    }
                };
                return this.patchDeployment(scalePatch, workerDeployment.metadata.name)
                    .then(patchResponse => this.logger.warn(patchResponse));
            })
            .catch(err => this.logger.error(`Error finding kuberenetes worker for ${exId}: ${err}`));
        // FIXME: This returns without waiting on the k8s stuff, should it?
        return { action: op, ex_id: exId, workerNum: numWorkers };
    }
}

module.exports = K8s;
