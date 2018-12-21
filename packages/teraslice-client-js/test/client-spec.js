'use strict';

const nock = require('nock');
const terasliceClientJs = require('../');
const Client = require('../lib/client');

describe('Teraslice Client', () => {
    describe('when using the main export function', () => {
        it('returns a function', () => {
            expect(typeof terasliceClientJs).toEqual('function');
        });

        it('should not throw an error if constructed with nothing', () => {
            expect(() => terasliceClientJs()).not.toThrow();
        });

        it('should have jobs, cluster, and assets', () => {
            const client = terasliceClientJs();
            expect(client.jobs).not.toBeUndefined();
            expect(client.cluster).not.toBeUndefined();
            expect(client.assets).not.toBeUndefined();
        });
    });

    describe('when using the Client constructor', () => {
        let client;
        let scope;

        beforeEach(() => {
            client = new Client({
                baseUrl: 'http://teraslice.example.dev'
            });
            scope = nock('http://teraslice.example.dev/v1');
        });

        afterEach(() => {
            nock.cleanAll();
        });

        describe('->get', () => {
            describe('when called with nothing', () => {
                let err;
                beforeEach((done) => {
                    client.get()
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with a empty path message', () => {
                    expect(err.toString()).toEqual('Error: endpoint must not be empty');
                });
            });


            describe('when called with a non-string value', () => {
                let err;
                beforeEach((done) => {
                    client.get({ hello: 'hi' })
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid endpoint error', () => {
                    expect(err.toString()).toEqual('Error: endpoint must be a string');
                });
            });

            describe('when called with too many options', () => {
                let err;
                beforeEach((done) => {
                    client.get('/hi', 'hello', 'here', 'oh no')
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid endpoint error', () => {
                    expect(err.toString()).toEqual('Error: Too many arguments passed to client');
                });
            });

            describe('when called with a valid path', () => {
                let result;

                beforeEach((done) => {
                    scope.get('/hello')
                        .reply(200, { example: 'hello' });

                    client.get('/hello')
                        .then((_result) => {
                            result = _result;
                            done();
                        })
                        .catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a valid path', () => {
                let result;

                beforeEach((done) => {
                    scope.get('/hello')
                        .reply(200, { example: 'hello' });

                    client.get('/hello')
                        .then((_result) => {
                            result = _result;
                            done();
                        })
                        .catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path, query and options', () => {
                let result;

                beforeEach((done) => {
                    scope.get('/hello')
                        .query({ hello: true })
                        .reply(200, { example: 'hello' });

                    client.get('/hello', {
                        hello: true
                    }, {
                        json: false,
                        headers: { 'Some-Header': 'yes' }
                    }).then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual(JSON.stringify({ example: 'hello' }));
                });
            });

            describe('when called with a path and plain query options', () => {
                let result;

                beforeEach((done) => {
                    scope.get('/hello')
                        .query({ hello: true })
                        .reply(200, { example: 'hello' });

                    client.get('/hello', {
                        hello: true
                    }).then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual({ example: 'hello' });
                });
            });
        });

        describe('->post', () => {
            describe('when called with nothing', () => {
                let err;
                beforeEach((done) => {
                    client.post()
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with a empty path message', () => {
                    expect(err.toString()).toEqual('Error: endpoint must not be empty');
                });
            });

            describe('when called with too many options', () => {
                let err;
                beforeEach((done) => {
                    client.post('/hi', 'hello', 'here', 'oh no')
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid endpoint error', () => {
                    expect(err.toString()).toEqual('Error: Too many arguments passed to client');
                });
            });

            describe('when called with a non-string value', () => {
                let err;
                beforeEach((done) => {
                    client.post({ hello: 'hi' })
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid endpoint error', () => {
                    expect(err.toString()).toEqual('Error: endpoint must be a string');
                });
            });

            describe('when called the request throws an error', () => {
                let err;
                beforeEach((done) => {
                    scope.post('/hello')
                        .replyWithError('Oh no');

                    client.post('/hello', { hello: 'hi' })
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid error', () => {
                    expect(err.toString()).toEqual('Error: Oh no');
                });
            });

            describe('when called the server replys with an error', () => {
                let err;
                beforeEach((done) => {
                    scope.post('/hello')
                        .reply(500, {
                            message: 'Oh no',
                            error: 1232
                        });

                    client.post('/hello', { hello: 'hi' })
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid error', () => {
                    expect(err.toString()).toEqual('Error: Oh no');
                    expect(err.error).toEqual(1232);
                    expect(err.code).toEqual(1232);
                });
            });

            describe('when called the server replys and the error is a string', () => {
                let err;
                beforeEach((done) => {
                    scope.post('/hello')
                        .reply(428, {
                            error: 'Uh-oh here is an error'
                        });

                    client.post('/hello', { hello: 'hi' })
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid error', () => {
                    expect(err.toString()).toEqual('Error: Uh-oh here is an error');
                    expect(err.error).toEqual(428);
                    expect(err.code).toEqual(428);
                });
            });

            describe('when called the server replys with empty error', () => {
                let err;
                beforeEach((done) => {
                    scope.post('/hello')
                        .reply(500);

                    client.post('/hello', { hello: 'hi' })
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid error', () => {
                    expect(err.toString()).toEqual('Error: Internal Server Error');
                    expect(err.error).toEqual(500);
                    expect(err.code).toEqual(500);
                });
            });

            describe('when called the server replys with an string', () => {
                let err;
                beforeEach((done) => {
                    scope.post('/hello')
                        .reply(500, 'Oh no');

                    client.post('/hello', { hello: 'hi' })
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid error', () => {
                    expect(err.toString()).toEqual('Error: Oh no');
                    expect(err.error).toEqual(500);
                    expect(err.code).toEqual(500);
                });
            });

            describe('when called with a valid path', () => {
                let result;

                beforeEach((done) => {
                    scope.post('/hello')
                        .reply(200, { example: 'hello' });

                    client.post('/hello')
                        .then((_result) => {
                            result = _result;
                            done();
                        })
                        .catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path and json', () => {
                let result;

                beforeEach((done) => {
                    scope.post('/hello', { hello: true })
                        .reply(200, { example: 'hello' });

                    client.post('/hello', {
                        json: {
                            hello: true
                        }
                    }).then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path and body', () => {
                let result;

                beforeEach((done) => {
                    scope.post('/hello', JSON.stringify({ hello: true }))
                        .reply(200, { example: 'hello' });

                    client.post('/hello', {
                        body: JSON.stringify({ hello: true }),
                        json: false,
                    }).then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual(JSON.stringify({ example: 'hello' }));
                });
            });

            describe('when called with a path and headers', () => {
                let result;

                beforeEach((done) => {
                    scope.post('/hello', { hello: true })
                        .reply(200, { example: 'hello' });

                    client.post('/hello', {
                        headers: {
                            SomeHeader: 'hi'
                        },
                        json: { hello: true },
                    }).then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path and a buffer', () => {
                let result;

                beforeEach((done) => {
                    scope.post('/hello', 'hello')
                        .reply(200, 'response-hello');

                    client.post('/hello', Buffer.from('hello')).then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual('response-hello');
                });
            });
        });

        describe('->put', () => {
            describe('when called with nothing', () => {
                let err;
                beforeEach((done) => {
                    client.put()
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with a empty path message', () => {
                    expect(err.toString()).toEqual('Error: endpoint must not be empty');
                });
            });

            describe('when called with a non-string value', () => {
                let err;
                beforeEach((done) => {
                    client.put({ hello: 'hi' })
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid endpoint error', () => {
                    expect(err.toString()).toEqual('Error: endpoint must be a string');
                });
            });

            describe('when called with a valid path', () => {
                let result;

                beforeEach((done) => {
                    scope.put('/hello')
                        .reply(200, { example: 'hello' });

                    client.put('/hello')
                        .then((_result) => {
                            result = _result;
                            done();
                        })
                        .catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path and body', () => {
                let result;

                beforeEach((done) => {
                    scope.put('/hello', { hello: true })
                        .reply(200, { example: 'hello' });

                    client.put('/hello', {
                        json: {
                            hello: true
                        }
                    }).then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path and data', () => {
                let result;

                beforeEach((done) => {
                    scope.put('/hello', { hello: true })
                        .reply(200, { example: 'hello' });

                    client.put('/hello', {
                        hello: true
                    }).then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).toEqual({ example: 'hello' });
                });
            });
        });

        describe('->delete', () => {
            describe('when called with nothing', () => {
                let err;
                beforeEach((done) => {
                    client.delete()
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with a empty path message', () => {
                    expect(err.toString()).toEqual('Error: endpoint must not be empty');
                });
            });


            describe('when called with a non-string value', () => {
                let err;
                beforeEach((done) => {
                    client.delete({ hello: 'hi' })
                        .then(fail)
                        .catch((_err) => {
                            err = _err;
                            done();
                        });
                });

                it('should reject with an error', () => {
                    expect(err instanceof Error).toBeTrue();
                });

                it('should reject with invalid endpoint error', () => {
                    expect(err.toString()).toEqual('Error: endpoint must be a string');
                });
            });

            describe('when called with a valid path', () => {
                let result;

                beforeEach((done) => {
                    scope.delete('/hello')
                        .reply(204);

                    client.delete('/hello')
                        .then((_result) => {
                            result = _result;
                            done();
                        })
                        .catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).not.toEqual(null);
                });
            });

            describe('when called with a path and query', () => {
                let result;

                beforeEach((done) => {
                    scope.delete('/hello')
                        .query({ hello: true })
                        .reply(204);

                    client.delete('/hello', {
                        qs: {
                            hello: true
                        }
                    }).then((_result) => {
                        result = _result;
                        done();
                    }).catch(fail);
                });

                it('should resolve with the response from the server', () => {
                    expect(result).not.toEqual(null);
                });
            });
        });
    });
});
