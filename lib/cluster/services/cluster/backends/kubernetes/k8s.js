'use strict';

// TODO get the logger in here somehow, replace all prints
function print(err, result) {
    console.log(JSON.stringify(err || result, null, 2));
}

const { Client, config } = require('kubernetes-client');

let client;
try {
    if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT) {
        // configure the client when running inside k8s
        client = new Client({ config: config.getInCluster() });
    } else {
        // configure the client from ~/.kube/config when running outside, for
        // testing
        client = new Client({ config: config.fromKubeconfig() });
    }
} catch (e) {
    print(`Error: ${e}`);
}

// TODO: generalize this to just get by label and type, like post
/**
 * returns list of pods matching provided selector
 * @param  {String} selector kubernetes selector, like 'app=teraslice'
 * @return {Array}          Array containing pods???
 */
async function getPods(selector) {
    let response;
    // FIXME: I need to do something about this loadSpec, it needs to be called
    // in every function but cant be done in the top level here because you can't
    // call await outside an async function.  I think I'd need to do the typical
    // teraslice module as a function thing but that still feels like an anti
    // pattern and I feel like I should just make a class here.
    try {
        await client.loadSpec();
    } catch (err) {
        print(`Error caught: ${err}`);
        // FIXME: What is the appropriate way to handle errors in this case?
    }
    try {
        response = await client.api.v1.namespaces('default')
            .pods().get({ qs: { labelSelector: selector } });
    } catch (e) {
        print(`Error: ${e}`);
        // FIXME: What is the appropriate way to handle errors in this case?
    }
    // TODO: I should probably be looking at createdManifest.statusCode to
    // make sure it's acceptible
    return response.body;
}

/**
 * posts manifest to k8s
 * @param  {Object} manifest service manifest
 * @param  {String} manifestType 'service', 'deployment'
 * @return {Object}         k8s API response object
 */
async function post(manifest, manifestType) {
    let response;
    try {
        await client.loadSpec();
    } catch (err) {
        print(`Error caught: ${err}`);
        // FIXME: What is the appropriate way to handle errors in this case?
    }
    try {
        if (manifestType === 'service') {
            response = await client.api.v1.namespaces('default')
                .service.post({ body: manifest });
        } else if (manifestType === 'deployment') {
            response = await client.apis.apps.v1
                .namespaces('default').deployments.post({ body: manifest });
        } else {
            print(`Error: Invalid manifestType: ${manifestType}`);
        }
    } catch (err) {
        print(`Error caught: ${err}`);
    }
    // TODO: I should probably be looking at response.statusCode to
    // make sure it's acceptible
    return response.body;
}

/**
 * prints out namespaces as a test of k8s connections
 */
async function getNamespaces() {
    try {
        await client.loadSpec();
    } catch (err) {
        print(`Error caught: ${err}`);
        process.exit(1);
    }

    try {
        const namespaces = await client.api.v1.namespaces.get();
        print(namespaces);
    } catch (err) {
        print(`Error: ${err}`);
        process.exit(1);
    }
}

module.exports = {
    getPods,
    getNamespaces,
    post,
};
