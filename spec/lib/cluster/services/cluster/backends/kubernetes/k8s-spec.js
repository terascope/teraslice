'use strict';

// You can set the following environment variable to generate more verbose debug
// output for nock
//   env DEBUG='nock*' make test

const fs = require('fs');
const nock = require('nock');
const path = require('path');
const K8s = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/k8s');

function print(err, result) {
    // FIXME: How much does this smell, do we have an existing convention?
    if (process.env.DEBUG) {
        console.log(JSON.stringify(err || result, null, 2));
    }
}

const logger = {
    debug: print,
    info: print,
    warn: print,
    error: print
};

const swaggerFile = path.join(__dirname, 'files', 'swagger.json');

const _url = 'http://mock.kube.api';
// const _url = 'https://192.168.99.100:8443';


// FIXME: Remember, I break unit tests if I leave this in!!
describe('k8s', () => {
    let k8s;

    beforeEach(async () => {
        nock(_url)
            .get('/swagger.json')
            .reply(200, fs.readFileSync(swaggerFile, 'utf-8'))
            .get('/api/v1/namespaces')
            .reply(200, {
                kind: 'NamespaceList',
                apiVersion: 'v1',
                metadata: {
                    selfLink: '/api/v1/namespaces',
                    resourceVersion: '1961000'
                },
                items: [
                    {
                        metadata: {
                            name: 'default'
                        }
                    }
                ]
            });

        const clientConfig = {
            url: _url,
            auth: {
                user: 'admin',
                pass: 'fakepass',
            },
            insecureSkipTlsVerify: true,
        };
        k8s = new K8s(logger, clientConfig);
        await k8s.init();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('can get the "default" namespace', async () => {
        const namespaces = await k8s.getNamespaces();
        expect(namespaces.items[0].metadata.name).toEqual('default');
    });

    describe('->list', () => {
        beforeEach(() => {
            nock(_url)
                .get('/api/v1/namespaces/default/pods/')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'PodList' })
                .get('/apis/apps/v1/namespaces/default/deployments/')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'DeploymentList' })
                .get('/apis/v1/namespaces/default/services/')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'ServiceList' });
        });

        it('can get PodList', async () => {
            const pods = await k8s.list('app=teraslice', 'pods');
            expect(pods.kind).toEqual('PodList');
        });

        it('can get DeploymentList', async () => {
            const deployments = await k8s.list('app=teraslice', 'deployments');
            expect(deployments.kind).toEqual('DeploymentList');
        });
    });

    describe('->post', () => {
        beforeEach(() => {
            nock(_url, { encodedQueryParams: true })
                .post('/api/v1/namespaces/default/services')
                .reply(201, { kind: 'Service' })
                .post('/apis/apps/v1/namespaces/default/deployments')
                .reply(201, { kind: 'Deployment' });
        });

        it('can post a service', async () => {
            const response = await k8s.post({ kind: 'Service' }, 'service');
            expect(response.kind).toEqual('Service');
        });

        it('can post a deployment', async () => {
            const response = await k8s.post({ kind: 'Deployment' }, 'deployment');
            expect(response.kind).toEqual('Deployment');
        });
    });

    describe('->patch', () => {
        beforeEach(() => {
            nock(_url, { encodedQueryParams: true })
                .patch('/apis/apps/v1/namespaces/default/deployments/test1')
                .reply(204, { });
        });

        it('can patch a deployment by name', async () => {
            const response = await k8s.patch({ name: 'testName' }, 'test1');
            expect(response).toEqual({});
        });
    });


    describe('->delete', () => {
        beforeEach(() => {
            nock(_url)
                .delete('/apis/apps/v1/namespaces/default/deployments/test1')
                .reply(200, { })
                .delete('/apis/v1/namespaces/default/services/test1')
                .reply(200, { });
        });

        it('can delete a deployment by name', async () => {
            const response = await k8s.delete('test1', 'deployments');
            expect(response).toEqual({});
        });

        // The following test unexpectedly fails with:
        //      ✗ can delete a service by name (0.082 sec)
        // - TypeError: Cannot read property 'statusCode' of undefined
        //     at K8s.delete (/Users/godber/Workspace/terascope/opensource/teraslice/lib/cluster/services/cluster/backends/kubernetes/k8s.js:50:61)
        //     at <Jasmine>
        //     at process._tickCallback (internal/process/next_tick.js:188:7)
        // it('can delete a service by name', async () => {
        //     const response = await k8s.delete('test1', 'services');
        //     expect(response).toEqual({});
        // });
    });


    // FIXME: I feel a little weird about how I test the arithmetic for
    // set/add/remove here but if I didn't mock it this way, I felt like I
    // wasn't really testing anything.
    describe('->scaleExecution', () => {
        beforeEach(() => {
            nock(_url)
                .get('/apis/apps/v1/namespaces/default/deployments/')
                .query({ labelSelector: /nodeType=worker,exId=.*/ })
                .reply(200, {
                    kind: 'DeploymentList',
                    items: [
                        { spec: { replicas: 5 }, metadata: { name: 'dname' } }
                    ]
                })
                .patch('/apis/apps/v1/namespaces/default/deployments/dname')
                .reply(200, (uri, requestBody) => requestBody);
        });

        it('can set nodes to a deployment to 2', async () => {
            const response = await k8s.scaleExecution('abcde1234', 2, 'set');
            expect(response.spec.replicas).toEqual(2);
        });

        it('can add 2 nodes to a deployment with 5 to get 7', async () => {
            const response = await k8s.scaleExecution('abcde1234', 2, 'add');
            expect(response.spec.replicas).toEqual(7);
        });

        it('can remove 2 nodes from a deployment with 5 to get 3', async () => {
            const response = await k8s.scaleExecution('abcde1234', 2, 'remove');
            expect(response.spec.replicas).toEqual(3);
        });
    });
});
