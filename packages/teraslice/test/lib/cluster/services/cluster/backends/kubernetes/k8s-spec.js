'use strict';

// You can set the following environment variable to generate more verbose debug
// output for nock
//   env DEBUG='nock*' make test

const fs = require('fs');
const nock = require('nock');
const path = require('path');
const { debugLogger } = require('@terascope/job-components');
const K8s = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/k8s');

const logger = debugLogger('k8s-spec');

const swaggerFile = path.join(__dirname, 'files', 'swagger.json');

const _url = 'http://mock.kube.api';
// const _url = 'https://192.168.99.100:8443';

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
        it('can get PodList', async () => {
            nock(_url)
                .get('/api/v1/namespaces/default/pods/')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'PodList' });

            const pods = await k8s.list('app=teraslice', 'pods');
            expect(pods.kind).toEqual('PodList');
        });

        it('can get ServiceList', async () => {
            nock(_url)
                .get('/api/v1/namespaces/default/services/')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'ServiceList' });

            const pods = await k8s.list('app=teraslice', 'services');
            expect(pods.kind).toEqual('ServiceList');
        });

        it('can get DeploymentList', async () => {
            nock(_url)
                .get('/apis/apps/v1/namespaces/default/deployments/')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'DeploymentList' });

            const deployments = await k8s.list('app=teraslice', 'deployments');
            expect(deployments.kind).toEqual('DeploymentList');
        });

        it('can get JobList', async () => {
            nock(_url)
                .get('/apis/batch/v1/namespaces/default/jobs/')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'JobList' });

            const jobs = await k8s.list('app=teraslice', 'jobs');
            expect(jobs.kind).toEqual('JobList');
        });
    });

    describe('->post', () => {
        it('can post a service', async () => {
            nock(_url, { encodedQueryParams: true })
                .post('/api/v1/namespaces/default/services')
                .reply(201, { kind: 'Service' });

            const response = await k8s.post({ kind: 'Service' }, 'service');
            expect(response.kind).toEqual('Service');
        });

        it('can post a deployment', async () => {
            nock(_url, { encodedQueryParams: true })
                .post('/apis/apps/v1/namespaces/default/deployments')
                .reply(201, { kind: 'Deployment' });

            const response = await k8s.post({ kind: 'Deployment' }, 'deployment');
            expect(response.kind).toEqual('Deployment');
        });

        it('can post a job', async () => {
            nock(_url, { encodedQueryParams: true })
                .post('/apis/batch/v1/namespaces/default/jobs')
                .reply(201, { kind: 'Job' });

            const response = await k8s.post({ kind: 'Job' }, 'job');
            expect(response.kind).toEqual('Job');
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
        it('can delete a deployment by name', async () => {
            nock(_url)
                .delete('/apis/apps/v1/namespaces/default/deployments/test1')
                .reply(200, { });

            const response = await k8s.delete('test1', 'deployments');
            expect(response).toEqual({});
        });

        it('can delete a service by name', async () => {
            nock(_url)
                .delete('/api/v1/namespaces/default/services/test1')
                .reply(200, { });

            const response = await k8s.delete('test1', 'services');
            expect(response).toEqual({});
        });

        it('can delete a job by name', async () => {
            nock(_url)
                .delete('/apis/batch/v1/namespaces/default/jobs/test1')
                .reply(200, { });

            const response = await k8s.delete('test1', 'jobs');
            expect(response).toEqual({});
        });
    });

    describe('->scaleExecution', () => {
        let scope;

        beforeEach(() => {
            scope = nock(_url)
                .get('/apis/apps/v1/namespaces/default/deployments/')
                .query({ labelSelector: /nodeType=worker,exId=.*/ })
                .reply(200, {
                    kind: 'DeploymentList',
                    items: [
                        { spec: { replicas: 5 }, metadata: { name: 'dname' } }
                    ]
                });
        });

        it('can set nodes to a deployment to 2', async () => {
            scope.patch('/apis/apps/v1/namespaces/default/deployments/dname', {
                spec: {
                    replicas: 2,
                }
            }).reply(200, (uri, requestBody) => requestBody);

            const response = await k8s.scaleExecution('abcde1234', 2, 'set');
            expect(response.spec.replicas).toEqual(2);
        });

        it('can add 2 nodes to a deployment with 5 to get 7', async () => {
            scope.patch('/apis/apps/v1/namespaces/default/deployments/dname', {
                spec: {
                    replicas: 7,
                }
            }).reply(200, (uri, requestBody) => requestBody);

            const response = await k8s.scaleExecution('abcde1234', 2, 'add');
            expect(response.spec.replicas).toEqual(7);
        });

        it('can remove 2 nodes from a deployment with 5 to get 3', async () => {
            scope.patch('/apis/apps/v1/namespaces/default/deployments/dname', {
                spec: {
                    replicas: 3,
                }
            }).reply(200, (uri, requestBody) => requestBody);

            const response = await k8s.scaleExecution('abcde1234', 2, 'remove');
            expect(response.spec.replicas).toEqual(3);
        });
    });

    describe('->deleteExecution', () => {
        it('can delete an execution', async () => {
            nock(_url)
                .get('/apis/apps/v1/namespaces/default/deployments/')
                .query({ labelSelector: /nodeType=worker,exId=.*/ })
                .reply(200, { kind: 'DeploymentList', items: [{ metadata: { name: 'e33b5454' } }] })
                .get('/apis/batch/v1/namespaces/default/jobs/')
                .query({ labelSelector: /nodeType=execution_controller,exId=.*/ })
                .reply(200, { kind: 'JobList', items: [{ metadata: { name: 'e33b5454' } }] })
                .get('/api/v1/namespaces/default/services/')
                .query({ labelSelector: /nodeType=execution_controller,exId=.*/ })
                .reply(200, { kind: 'ServiceList', items: [{ metadata: { name: 'e33b5454' } }] })
                .delete('/apis/apps/v1/namespaces/default/deployments/e33b5454')
                .reply(200, {})
                .delete('/apis/batch/v1/namespaces/default/jobs/e33b5454')
                .reply(200, {})
                .delete('/api/v1/namespaces/default/services/e33b5454')
                .reply(200, {});

            const response = await k8s.deleteExecution('e33b5454');
            expect(response).toEqual([{}, {}, {}]);
        });
    });
});
