
import nock from 'nock';
import Cluster from '../src/lib/cluster';

describe('Teraslice Cluster', () => {
    let cluster: Cluster;
    let scope: nock.Scope;

    beforeEach(() => {
        cluster = new Cluster({
            baseUrl: 'http://teraslice.example.dev',
        });
        scope = nock('http://teraslice.example.dev');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('->state', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/v1/cluster/state')
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
                scope.get('/v1/cluster/stats')
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
                scope.get('/v1/cluster/slicers')
                    .reply(200, { slicerResponse: true });
            });

            it('should resolve the json results from Teraslice', async () => {
                const results = await cluster.slicers();
                expect(results).toEqual({ slicerResponse: true });
            });
        });
    });

    describe('->txt', () => {
        describe('when called with workers', () => {
            beforeEach(() => {
                scope.get('/v1/txt/workers')
                    .reply(200, 'workers-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('workers');
                expect(results).toEqual('workers-txt-response');
            });
        });

        describe('when called with nodes', () => {
            beforeEach(() => {
                scope.get('/v1/txt/nodes')
                    .reply(200, 'nodes-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('nodes');
                expect(results).toEqual('nodes-txt-response');
            });
        });

        describe('when called with jobs', () => {
            beforeEach(() => {
                scope.get('/v1/txt/jobs')
                    .reply(200, 'jobs-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('jobs');
                expect(results).toEqual('jobs-txt-response');
            });
        });

        describe('when called with ex', () => {
            beforeEach(() => {
                scope.get('/v1/txt/ex')
                    .reply(200, 'ex-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('ex');
                expect(results).toEqual('ex-txt-response');
            });
        });

        describe('when called with slicers', () => {
            beforeEach(() => {
                scope.get('/v1/txt/slicers')
                    .reply(200, 'slicers-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('slicers');
                expect(results).toEqual('slicers-txt-response');
            });
        });

        describe('when called with assets', () => {
            beforeEach(() => {
                scope.get('/v1/txt/assets')
                    .reply(200, 'assets-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                const results = await cluster.txt('assets');
                expect(results).toEqual('assets-txt-response');
            });
        });

        describe('when called with assets/assetName', () => {
            beforeEach(() => {
                scope.get('/v1/txt/assets/assetName')
                    .reply(200, 'assets-txt-response');
            });

            it('should resolve the plain test results from Teraslice', async () => {
                // @ts-ignore TODO: fixme
                const results = await cluster.txt('assets/assetName');
                expect(results).toEqual('assets-txt-response');
            });
        });

        describe('when called with a invalid type', () => {
            beforeEach(() => {
                scope.get('/v1/txt/invalid')
                    .reply(404);
            });

            it('should reject with invalid type', async () => {
                expect.hasAssertions();
                const errMsg = '"invalid" is not a valid type. Must be one of ["assets","slicers","ex","jobs","nodes","workers"]';
                try {
                    // @ts-ignore
                    await cluster.txt('invalid');
                } catch (err) {
                    expect(err.message).toEqual(errMsg);
                }
            });
        });
    });
});
