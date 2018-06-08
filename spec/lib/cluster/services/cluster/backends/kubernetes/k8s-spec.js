'use strict';

// You can set the following environment variable to generate more verbose debug
// output for nock
//   env DEBUG='nock*' make test

const fs = require('fs');
const K8s = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/k8s');
const nock = require('nock');
const path = require('path');

function print(err, result) {
    console.log(JSON.stringify(err || result, null, 2));
}

const logger = {
    info: print,
    warn: print,
    error: print
};

const swaggerFile = path.join(__dirname, 'files', 'swagger.json');

const _url = 'http://mock.kube.api';
// const _url = 'https://192.168.99.100:8443';


// FIXME: Remember, I break unit tests if I leave this in!!
fdescribe('k8s', () => {
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

    describe('->patchDeployment', () => {
        beforeEach(() => {
            nock(_url, { encodedQueryParams: true })
                .patch('/apis/apps/v1/namespaces/default/deployments/test1')
                .reply(204);
        });

        it('can patch a deployment', async () => {
            const response = await k8s.patchDeployment({ name: 'testName' }, 'test1');
            expect(response).toEqual({});
        });
    });
});
