import nock from 'nock';
import Cluster from '../src/cluster.js';
import { v2Page } from './fixtures/v2-page.js';

describe('Teraslice Cluster', () => {
    let cluster: Cluster;
    let scope: nock.Scope;

    beforeEach(() => {
        cluster = new Cluster({
            baseUrl: 'http://teraslice.example.dev',
        });
        scope = nock('http://teraslice.example.dev/v1');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('->state', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/cluster/state')
                    .reply(200, { stateResponse: true });
            });

            it('should resolve the json results from Teraslice', async () => {
                const results = await cluster.state();
                expect(results).toEqual({ stateResponse: true });
            });
        });
    });

    describe('->stats', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/cluster/stats')
                    .reply(200, { statsResponse: true });
            });

            it('should resolve the json results from Teraslice', async () => {
                const results = await cluster.stats();
                expect(results).toEqual({ statsResponse: true });
            });
        });
    });

    describe('->slicers', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/cluster/slicers')
                    .reply(200, { slicerResponse: true });
            });

            it('should resolve the json results from Teraslice', async () => {
                const results = await cluster.slicers();
                expect(results).toEqual({ slicerResponse: true });
            });
        });
    });

    describe('->connectors', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/cluster/connectors')
                    .reply(200, {
                        connectors: [
                            { type: 'elasticsearch-next', name: 'default', is_state_cluster: true },
                            { type: 'kafka', name: 'default' }
                        ]
                    });
            });

            it('should resolve the json results from Teraslice', async () => {
                const results = await cluster.connectors();
                expect(results).toEqual({
                    connectors: [
                        { type: 'elasticsearch-next', name: 'default', is_state_cluster: true },
                        { type: 'kafka', name: 'default' }
                    ]
                });
            });
        });

        describe('when called with a type filter', () => {
            beforeEach(() => {
                scope.get('/cluster/connectors')
                    .query({ type: 'kafka' })
                    .reply(200, {
                        connectors: [
                            { type: 'kafka', name: 'default' }
                        ]
                    });
            });

            it('should pass the type as a query param', async () => {
                const results = await cluster.connectors({ type: 'kafka' });
                expect(results).toEqual({
                    connectors: [
                        { type: 'kafka', name: 'default' }
                    ]
                });
            });
        });

        describe('when called with groupBy=type', () => {
            beforeEach(() => {
                scope.get('/cluster/connectors')
                    .query({ groupBy: 'type' })
                    .reply(200, {
                        connectors: {
                            'elasticsearch-next': ['default'],
                            kafka: ['default']
                        }
                    });
            });

            it('should pass groupBy as a query param', async () => {
                const results = await cluster.connectors({ groupBy: 'type' });
                expect(results).toEqual({
                    connectors: {
                        'elasticsearch-next': ['default'],
                        kafka: ['default']
                    }
                });
            });
        });
    });

    describe('->txt', () => {
        beforeEach(() => {
            scope = nock('http://teraslice.example.dev/');
        });

        describe('when called with workers', () => {
            beforeEach(() => {
                scope.get('/txt/workers')
                    .reply(200, 'workers-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('workers');
                expect(results).toEqual('workers-txt-response');
            });
        });

        describe('when called with nodes', () => {
            beforeEach(() => {
                scope.get('/txt/nodes')
                    .reply(200, 'nodes-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('nodes');
                expect(results).toEqual('nodes-txt-response');
            });
        });

        describe('when called with jobs', () => {
            beforeEach(() => {
                scope.get('/txt/jobs')
                    .reply(200, 'jobs-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('jobs');
                expect(results).toEqual('jobs-txt-response');
            });
        });

        describe('when called with ex', () => {
            beforeEach(() => {
                scope.get('/txt/ex')
                    .reply(200, 'ex-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('ex');
                expect(results).toEqual('ex-txt-response');
            });
        });

        describe('when called with slicers', () => {
            beforeEach(() => {
                scope.get('/txt/slicers')
                    .reply(200, 'slicers-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('slicers');
                expect(results).toEqual('slicers-txt-response');
            });
        });

        describe('when called with assets', () => {
            beforeEach(() => {
                scope.get('/txt/assets')
                    .reply(200, 'assets-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('assets');
                expect(results).toEqual('assets-txt-response');
            });
        });

        describe('when called with assets/assetName', () => {
            beforeEach(() => {
                scope.get('/txt/assets/assetName')
                    .reply(200, 'assets-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('assets/assetName');
                expect(results).toEqual('assets-txt-response');
            });
        });

        describe('when called with controllers and a query', () => {
            beforeEach(() => {
                scope.get('/txt/controllers')
                    .query({ fields: 'name,ex_id', headers: 'false', size: '5' })
                    .reply(200, 'controllers-txt-response');
            });

            it('should send the query', async () => {
                const results = await cluster.txt('controllers', { fields: 'name,ex_id', headers: 'false', size: 5 });
                expect(results).toEqual('controllers-txt-response');
            });
        });

        describe('when called with a invalid type', () => {
            beforeEach(() => {
                scope.get('/txt/invalid')
                    .reply(404);
            });

            it('should reject with invalid type', async () => {
                expect.hasAssertions();
                const errMsg = '"invalid" is not a valid type. Must be one of ["assets","slicers","controllers","ex","jobs","nodes","workers"]';
                try {
                    await cluster.txt('invalid');
                } catch (err) {
                    expect(err.message).toEqual(errMsg);
                }
            });
        });
    });

    describe('when using apiVersion /v2', () => {
        it('should use the controllers route for slicers', async () => {
            nock('http://teraslice.example.dev/v2')
                .get('/cluster/controllers')
                .reply(200, v2Page([{ ex_id: 'some-ex-id' }]));

            const v2Cluster = new Cluster({
                baseUrl: 'http://teraslice.example.dev',
                apiVersion: '/v2'
            });
            const results = await v2Cluster.slicers();
            expect(results).toEqual([{ ex_id: 'some-ex-id' }]);
        });

        it('should return the controllers from the page', async () => {
            nock('http://teraslice.example.dev/v2')
                .get('/cluster/controllers')
                .reply(200, v2Page([{ ex_id: 'some-ex-id' }]));

            const v2Cluster = new Cluster({
                baseUrl: 'http://teraslice.example.dev',
                apiVersion: '/v2'
            });
            await expect(v2Cluster.controllers()).resolves.toEqual([{ ex_id: 'some-ex-id' }]);
        });

        it('should return the whole page for controllersPage', async () => {
            const page = v2Page([{ ex_id: 'some-ex-id' }], {
                total: 5, from: 2, size: 1, has_more: true
            });
            nock('http://teraslice.example.dev/v2')
                .get('/cluster/controllers')
                .query({ size: 1, from: 2 })
                .reply(200, page);

            const v2Cluster = new Cluster({
                baseUrl: 'http://teraslice.example.dev',
                apiVersion: '/v2'
            });
            await expect(v2Cluster.controllersPage({ size: 1, from: 2 }))
                .resolves.toEqual(page);
        });

        describe('->txt', () => {
            const v2Cluster = new Cluster({
                baseUrl: 'http://teraslice.example.dev',
                apiVersion: '/v2'
            });

            it.each(['jobs', 'ex', 'workers', 'nodes', 'controllers'])('should get /v2/txt/%s', async (type) => {
                nock('http://teraslice.example.dev/v2')
                    .get(`/txt/${type}`)
                    .reply(200, `${type}-txt-response`);

                await expect(v2Cluster.txt(type)).resolves.toEqual(`${type}-txt-response`);
            });

            it('should send the query', async () => {
                nock('http://teraslice.example.dev/v2')
                    .get('/txt/jobs')
                    .query({
                        fields: 'job_id,ex._status', ex: '_status', from: '100', size: '50'
                    })
                    .reply(200, 'jobs-txt-response');

                const results = await v2Cluster.txt('jobs', {
                    fields: 'job_id,ex._status', ex: '_status', from: 100, size: 50
                });
                expect(results).toEqual('jobs-txt-response');
            });

            it('should use the controllers table for slicers', async () => {
                nock('http://teraslice.example.dev/v2')
                    .get('/txt/controllers')
                    .reply(200, 'controllers-txt-response');

                await expect(v2Cluster.txt('slicers')).resolves.toEqual('controllers-txt-response');
            });

            it.each([
                'assets', 'assets/ex1', 'assets/ex1/0.0.1',
            ])('should get /v2/txt/%s', async (type) => {
                nock('http://teraslice.example.dev/v2')
                    .get(`/txt/${type}`)
                    .reply(200, 'assets-txt-response');

                await expect(v2Cluster.txt(type)).resolves.toEqual('assets-txt-response');
            });

            it('should page the assets table', async () => {
                nock('http://teraslice.example.dev/v2')
                    .get('/txt/assets')
                    .query({ size: '10', cursor: 'abc' })
                    .reply(200, 'assets-txt-response');

                await expect(v2Cluster.txt('assets', { size: 10, cursor: 'abc' }))
                    .resolves.toEqual('assets-txt-response');
            });

            it('should reject an invalid type', async () => {
                await expect(v2Cluster.txt('invalid')).rejects.toThrow(
                    '"invalid" is not a valid type. Must be one of ["assets","controllers","ex","jobs","nodes","workers"]'
                );
            });
        });
    });

    // nock >= 15 patches the shared http module, so undo it before the next test file in the worker
    afterAll(() => {
        nock.restore();
    });
});
