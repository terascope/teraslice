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
        } catch (e) {
            this.logger.error(`Error: ${e}`);
            // FIXME: What is the appropriate way to handle errors in this case?
        }
        // TODO: I should probably be looking at createdManifest.statusCode to
        // make sure it's acceptible

        if (response.statusCode === 204) {
            return {};
        }

        const msg = `Unexpected response code, ${response.statusCode}, when patching, ${name}`;
        this.logger.error(msg);
        return {}; // FIXME: ?? what should I return
    }
}

module.exports = K8s;
