'use strict';

const nock = require('nock');
const Cluster = require('../lib/cluster');

describe('Teraslice Cluster', () => {
    let cluster;
    let scope;

    beforeEach(() => {
        cluster = new Cluster({
            baseUrl: 'http://teraslice.example.dev'
        });
        scope = nock('http://teraslice.example.dev/v1');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('->state', () => {
        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.get('/cluster/state')
                    .reply(200, { stateResponse: true });

                cluster.state()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the json result from Teraslice', () => {
                expect(result).toEqual({ stateResponse: true });
            });
        });
    });

    describe('->stats', () => {
        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.get('/cluster/stats')
                    .reply(200, { statsResponse: true });

                cluster.stats()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the json result from Teraslice', () => {
                expect(result).toEqual({ statsResponse: true });
            });
        });
    });

    describe('->slicers', () => {
        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.get('/cluster/slicers')
                    .reply(200, { slicerResponse: true });

                cluster.slicers()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the json result from Teraslice', () => {
                expect(result).toEqual({ slicerResponse: true });
            });
        });
    });

    describe('->txt', () => {
        describe('when called with workers', () => {
            let result;
            beforeEach((done) => {
                scope.get('/txt/workers')
                    .reply(200, 'workers-txt-response');

                cluster.txt('workers')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the plain test result from Teraslice', () => {
                expect(result).toEqual('workers-txt-response');
            });
        });

        describe('when called with nodes', () => {
            let result;
            beforeEach((done) => {
                scope.get('/txt/nodes')
                    .reply(200, 'nodes-txt-response');

                cluster.txt('nodes')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the plain test result from Teraslice', () => {
                expect(result).toEqual('nodes-txt-response');
            });
        });

        describe('when called with jobs', () => {
            let result;
            beforeEach((done) => {
                scope.get('/txt/jobs')
                    .reply(200, 'jobs-txt-response');

                cluster.txt('jobs')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the plain test result from Teraslice', () => {
                expect(result).toEqual('jobs-txt-response');
            });
        });

        describe('when called with ex', () => {
            let result;
            beforeEach((done) => {
                scope.get('/txt/ex')
                    .reply(200, 'ex-txt-response');

                cluster.txt('ex')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the plain test result from Teraslice', () => {
                expect(result).toEqual('ex-txt-response');
            });
        });

        describe('when called with slicers', () => {
            let result;
            beforeEach((done) => {
                scope.get('/txt/slicers')
                    .reply(200, 'slicers-txt-response');

                cluster.txt('slicers')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the plain test result from Teraslice', () => {
                expect(result).toEqual('slicers-txt-response');
            });
        });

        describe('when called with assets', () => {
            let result;
            beforeEach((done) => {
                scope.get('/txt/assets')
                    .reply(200, 'assets-txt-response');

                cluster.txt('assets')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the plain test result from Teraslice', () => {
                expect(result).toEqual('assets-txt-response');
            });
        });

        describe('when called with assets/assetName', () => {
            let result;
            beforeEach((done) => {
                scope.get('/txt/assets/assetName')
                    .reply(200, 'assets-txt-response');

                cluster.txt('assets/assetName')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve the plain test result from Teraslice', () => {
                expect(result).toEqual('assets-txt-response');
            });
        });


        describe('when called with a invalid type', () => {
            let err;
            beforeEach((done) => {
                scope.get('/txt/invalid')
                    .reply(404);

                cluster.txt('invalid')
                    .then(fail)
                    .catch((_err) => {
                        err = _err;
                        done();
                    });
            });

            it('should not call /txt/invalid', () => {
                expect(scope.isDone()).toBeFalse();
            });

            it('should reject with an error', () => {
                expect(err instanceof Error).toBeTrue();
            });

            it('should reject with invalid type', () => {
                expect(err.toString()).toEqual('Error: "invalid" is not a valid type. Must be one of ["assets","slicers","ex","jobs","nodes","workers"]');
            });
        });
    });
});
