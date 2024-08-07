// You can set the following environment variable to generate more verbose debug
// output for nock
//   env DEBUG='nock*' make test

import nock from 'nock';
import { debugLogger } from '@terascope/job-components';
import { K8s } from '../../../../../../../../src/lib/cluster/services/cluster/backends/kubernetesV2/k8s.js';

const logger = debugLogger('k8s-v2-spec');

const _url = 'http://mock.kube.api';
// const _url = 'https://192.168.99.100:8443';

describe('k8s', () => {
    let k8s: K8s;

    beforeEach(async () => {
        nock(_url)
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
            clusters: [{
                name: 'cluster',
                server: _url,
                skipTLSVerify: true
            }],
            users: [{
                name: 'admin',
                password: 'fakepass'
            }],
            contexts: [{
                name: 'context',
                user: 'user',
                cluster: 'cluster'
            }],
            currentContext: 'context'
        };

        k8s = new K8s(logger, clientConfig, null, 1, 1);
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('can get the "default" namespace', async () => {
        const namespaces = await k8s.getNamespaces();
        expect(namespaces.items[0].metadata?.name).toEqual('default');
    });

    describe('->list', () => {
        it('can get PodList', async () => {
            nock(_url)
                .get('/api/v1/namespaces/default/pods')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'PodList' });

            const pods = await k8s.list('app=teraslice', 'pods');
            expect(pods.kind).toEqual('PodList');
        });

        it('can get ServiceList', async () => {
            nock(_url)
                .get('/api/v1/namespaces/default/services')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'ServiceList' });

            const pods = await k8s.list('app=teraslice', 'services');
            expect(pods.kind).toEqual('ServiceList');
        });

        it('can get DeploymentList', async () => {
            nock(_url)
                .get('/apis/apps/v1/namespaces/default/deployments')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'DeploymentList' });

            const deployments = await k8s.list('app=teraslice', 'deployments');
            expect(deployments.kind).toEqual('DeploymentList');
        });

        it('can get JobList', async () => {
            nock(_url)
                .get('/apis/batch/v1/namespaces/default/jobs')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { kind: 'JobList' });

            const jobs = await k8s.list('app=teraslice', 'jobs');
            expect(jobs.kind).toEqual('JobList');
        });
    });

    describe('->nonEmptyList', () => {
        it('can get list with one item', async () => {
            nock(_url)
                .get('/apis/batch/v1/namespaces/default/jobs')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, {
                    items: [{
                        apiVersion: '1.0.0',
                        kind: 'job'
                    }]
                });

            const jobs = await k8s.nonEmptyList('app=teraslice', 'jobs');
            expect(jobs.items[0]).toEqual({
                apiVersion: '1.0.0',
                kind: 'job',
                metadata: undefined,
                spec: undefined,
                status: undefined
            });
        });

        it('throws with an empty list', async () => {
            nock(_url)
                .get('/apis/batch/v1/namespaces/default/jobs')
                .query({ labelSelector: 'app=teraslice' })
                .reply(200, { items: [] });

            await expect(k8s.nonEmptyList('app=teraslice', 'jobs'))
                .rejects.toThrow('Teraslice jobs matching the following selector was not found: app=teraslice (retriable)');
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

        it('can delete a pod by name', async () => {
            nock(_url)
                .delete('/api/v1/namespaces/default/pods/test1')
                .reply(200, {});

            const response = await k8s.delete('test1', 'pods');
            expect(response).toEqual({});
        });
    });

    describe('->_deletObjByExId', () => {
        const job = {
            apiVersion: '1.0.0',
            kind: 'Job',
            metadata: { name: 'testJob1' }
        };

        const exPod = {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: { name: 'testEx1' }
        };

        const wkrPod = {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: { name: 'testWkr1' }
        };

        const status = {
            apiVersion: 'v1',
            details: {
                group: 'batch',
                kind: 'jobs',
                name: 'testJob1',
                uid: 'f29935a1-9f36-4104-a840-f6534d7f2ef8'
            },
            kind: 'Status',
            status: 'Success'
        };

        it('can force delete a job', async () => {
            nock(_url)
                .get('/apis/batch/v1/namespaces/default/jobs')
                .query({ labelSelector: /app\.kubernetes\.io\/component=execution_controller,teraslice\.terascope\.io\/exId=.*/ })
                .reply(200, {
                    kind: 'JobList',
                    items: [job]
                })
                .get('/api/v1/namespaces/default/pods')
                .query({ labelSelector: /teraslice\.terascope\.io\/exId=.*/ })
                .reply(200, {
                    kind: 'PodList',
                    items: [exPod, wkrPod]
                })
                .delete('/api/v1/namespaces/default/pods/testEx1')
                .reply(200, exPod)
                .delete('/api/v1/namespaces/default/pods/testWkr1')
                .reply(200, wkrPod)
                .delete('/apis/batch/v1/namespaces/default/jobs/testJob1')
                .reply(200, status);

            const response = await k8s._deleteObjByExId('testJob1', 'execution_controller', 'jobs', true);
            expect(response).toEqual([
                expect.objectContaining(status),
                [
                    expect.objectContaining(exPod),
                    expect.objectContaining(wkrPod)
                ]
            ]);
        });
    });

    describe('->scaleExecution', () => {
        let scope: nock.Scope;
        let deployment: {
            apiVersion: string,
            kind: string,
            metadata: { name: string},
            spec: { replicas: number },
            status: string
        };
        beforeEach(() => {
            deployment = {
                apiVersion: 'v1',
                kind: 'Deployment',
                metadata: { name: 'dname' },
                spec: { replicas: 5 },
                status: 'Success'
            };

            scope = nock(_url)
                .get('/apis/apps/v1/namespaces/default/deployments')
                .query({ labelSelector: /app\.kubernetes\.io\/component=worker,teraslice\.terascope\.io\/exId=.*/ })
                .reply(200, {
                    kind: 'DeploymentList',
                    items: [deployment]
                });
        });

        it('can set nodes to a deployment to 2', async () => {
            deployment.spec.replicas = 2;
            scope.patch('/apis/apps/v1/namespaces/default/deployments/dname', [
                {
                    op: 'replace',
                    path: '/spec/replicas',
                    value: 2
                }
            ]).reply(200, deployment);

            const response = await k8s.scaleExecution('abcde1234', 2, 'set');
            expect(response.spec?.replicas).toEqual(2);
        });

        it('can add 2 nodes to a deployment with 5 to get 7', async () => {
            deployment.spec.replicas = 7;
            scope.patch('/apis/apps/v1/namespaces/default/deployments/dname', [
                {
                    op: 'replace',
                    path: '/spec/replicas',
                    value: 7
                }
            ]).reply(200, deployment);

            const response = await k8s.scaleExecution('abcde1234', 2, 'add');
            expect(response.spec?.replicas).toEqual(7);
        });

        it('can remove 2 nodes from a deployment with 5 to get 3', async () => {
            deployment.spec.replicas = 3;
            scope.patch('/apis/apps/v1/namespaces/default/deployments/dname', [
                {
                    op: 'replace',
                    path: '/spec/replicas',
                    value: 3
                }
            ]).reply(200, deployment);

            const response = await k8s.scaleExecution('abcde1234', 2, 'remove');
            expect(response.spec?.replicas).toEqual(3);
        });
    });
});
