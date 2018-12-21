'use strict';

const nock = require('nock');
const Ex = require('../lib/ex');

describe('Teraslice Ex', () => {
    let ex;
    let scope;

    beforeEach(() => {
        ex = new Ex({
            baseUrl: 'http://teraslice.example.dev'
        });
        scope = nock('http://teraslice.example.dev/v1');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('->list', () => {
        describe('when called with nothing', () => {
            let result;
            beforeEach((done) => {
                scope.get('/ex')
                    .query({ status: '*' })
                    .reply(200, [
                        {
                            id: 'example'
                        },
                        {
                            id: 'example-other'
                        }
                    ]);

                ex.list()
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual([
                    {
                        id: 'example'
                    },
                    {
                        id: 'example-other'
                    }
                ]);
            });
        });

        describe('when called with a string', () => {
            let result;
            beforeEach((done) => {
                scope.get('/ex')
                    .query({ status: 'hello' })
                    .reply(200, [
                        {
                            id: 'hello-example'
                        },
                        {
                            id: 'hello-example-2'
                        }
                    ]);

                ex.list('hello')
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual([
                    {
                        id: 'hello-example'
                    },
                    {
                        id: 'hello-example-2'
                    }
                ]);
            });
        });

        describe('when called with an object', () => {
            let result;
            beforeEach((done) => {
                scope.get('/ex')
                    .query({ anything: true })
                    .reply(200, [
                        {
                            id: 'object-example'
                        },
                        {
                            id: 'object-example-2'
                        }
                    ]);

                ex.list({ anything: true })
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual([
                    {
                        id: 'object-example'
                    },
                    {
                        id: 'object-example-2'
                    }
                ]);
            });
        });
    });

    describe('->errors', () => {
        describe('when called with nothing', () => {
            const errors = [
                {
                    slice_id: 'hello',
                    slicer_id: 0,
                    slicer_order: 1,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                },
                {
                    slice_id: 'hello-there',
                    slicer_id: 0,
                    slicer_order: 2,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                }
            ];

            let result;
            beforeEach((done) => {
                scope.get('/ex/errors')
                    .query({ size: 10 })
                    .reply(200, errors);

                ex.errors({ size: 10 })
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual(errors);
            });
        });

        describe('when called with an exId', () => {
            const errors = [
                {
                    slice_id: 'hello',
                    slicer_id: 0,
                    slicer_order: 1,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                },
                {
                    slice_id: 'hello-there',
                    slicer_id: 0,
                    slicer_order: 2,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                }
            ];

            let result;
            beforeEach((done) => {
                scope.get('/ex/foo/errors')
                    .query({ from: 10 })
                    .reply(200, errors);

                ex.errors('foo', { from: 10, })
                    .then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
            });

            it('should resolve json result from Teraslice', () => {
                expect(result).toEqual(errors);
            });
        });
    });
});
