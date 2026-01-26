import nock from 'nock';
import TerasliceClient from '../src/index.js';
import Client from '../src/client.js';

describe('Teraslice Client', () => {
    describe('when using the main export function', () => {
        it('returns a function', () => {
            expect(typeof TerasliceClient).toEqual('function');
        });

        it('should not throw an error if constructed with nothing', () => {
            expect(() => new TerasliceClient()).not.toThrow();
        });

        it('should have jobs, cluster, and assets', () => {
            const client = new TerasliceClient();
            expect(client.jobs).not.toBeUndefined();
            expect(client.cluster).not.toBeUndefined();
            expect(client.assets).not.toBeUndefined();
        });
    });

    describe('when using the Client constructor', () => {
        let client: Client;
        let scope: nock.Scope;

        beforeEach(() => {
            nock.cleanAll();
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
                it('should reject with a empty path message', async () => {
                    expect.hasAssertions();
                    try {
                        // @ts-expect-error
                        await client.get();
                    } catch (err) {
                        expect(err.message).toEqual('endpoint must not be empty');
                    }
                });
            });

            describe('when called with a non-string value', () => {
                it('should reject with invalid endpoint error', async () => {
                    expect.hasAssertions();
                    try {
                        // @ts-expect-error
                        await client.get({ hello: 'hi' });
                    } catch (err) {
                        expect(err.message).toEqual('endpoint must be a string');
                    }
                });
            });

            describe('when called with a valid path', () => {
                beforeEach(() => {
                    scope.get('/hello')
                        .reply(200, { example: 'hello' });
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.get('/hello');
                    expect(results).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path, query and options', () => {
                beforeEach(() => {
                    scope.get('/hello')
                        .matchHeader('Some-Header', 'yes')
                        .query({ hello: true })
                        .reply(200, { example: 'hello' });
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.get('/hello', {
                        headers: { 'Some-Header': 'yes' },
                        searchParams: { hello: 'true' }
                    });
                    expect(results).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path and plain query options', () => {
                beforeEach(() => {
                    scope.get('/hello')
                        .query({ hello: true })
                        .reply(200, { example: 'hello' });
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.get('/hello', { searchParams: { hello: 'true' } });
                    expect(results).toEqual({ example: 'hello' });
                });
            });
        });

        describe('->post', () => {
            describe('when called with nothing', () => {
                it('should reject with a empty path message', async () => {
                    expect.hasAssertions();
                    try {
                        // @ts-expect-error
                        await client.post();
                    } catch (err) {
                        expect(err.message).toEqual('endpoint must not be empty');
                    }
                });
            });
            // TODO: need better story around validations

            describe('when called with a non-string value', () => {
                it('should reject with invalid endpoint error', async () => {
                    expect.hasAssertions();
                    try {
                        // @ts-expect-error
                        await client.post({ hello: 'hi' });
                    } catch (err) {
                        expect(err.message).toEqual('endpoint must be a string');
                    }
                });
            });

            describe('when called the request throws an error', () => {
                beforeEach(() => {
                    scope.post('/hello')
                        .replyWithError('Oh no');
                });

                it('should reject with invalid error', async () => {
                    expect.hasAssertions();
                    try {
                        await client.post('/hello', null);
                    } catch (err) {
                        expect(err.message).toEqual('Oh no');
                    }
                });
            });

            describe('when called the server replys with an error', () => {
                beforeEach(() => {
                    scope.post('/hello')
                        .reply(500, {
                            message: 'Oh no',
                            error: 1232
                        });
                });

                it('should reject with invalid error', async () => {
                    expect.hasAssertions();
                    try {
                        await client.post('/hello', null);
                    } catch (err) {
                        expect(err.message).toEqual('Oh no');
                        expect(err.error).toEqual(1232);
                        expect(err.code).toEqual(1232);
                        expect(err.statusCode).toEqual(1232);
                    }
                });
            });

            describe('when called the server replys and the error is a string', () => {
                beforeEach(() => {
                    scope.post('/hello')
                        .reply(428, {
                            error: 'Uh-oh here is an error'
                        });
                });

                it('should reject with invalid error', async () => {
                    expect.hasAssertions();
                    try {
                        await client.post('/hello', null);
                    } catch (err) {
                        expect(err.message).toEqual('Uh-oh here is an error');
                        expect(err.error).toEqual(428);
                        expect(err.code).toEqual(428);
                    }
                });
            });

            describe('when called the server replys with empty error', () => {
                beforeEach(() => {
                    scope.post('/hello')
                        .reply(500);
                });

                it('should reject with invalid error', async () => {
                    expect.hasAssertions();
                    try {
                        await client.post('/hello', null);
                    } catch (err) {
                        expect(err.message).toEqual('Internal Server Error');
                        expect(err.error).toEqual(500);
                        expect(err.code).toEqual(500);
                    }
                });
            });

            describe('when called the server replys with an string error', () => {
                beforeEach(() => {
                    scope.post('/hello')
                        .reply(500, 'Oh no');
                });

                it('should reject with invalid error', async () => {
                    expect.hasAssertions();
                    try {
                        await client.post('/hello', null);
                    } catch (err) {
                        expect(err.message).toEqual('Oh no');
                        expect(err.error).toEqual(500);
                        expect(err.code).toEqual(500);
                    }
                });
            });

            describe('when called with a valid path', () => {
                const data = { example: 'hello' };

                beforeEach(() => {
                    scope.post('/hello')
                        .reply(200, data);
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.post('/hello', null, {});
                    expect(results).toEqual(data);
                });
            });

            describe('when called with a path and query', () => {
                const data = { example: 'hello' };

                beforeEach(() => {
                    scope.post('/hello', { hello: true })
                        .reply(200, data);
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.post('/hello', { hello: true }, {});
                    expect(results).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path and body', () => {
                const data = { example: 'hello' };
                const strData = JSON.stringify(data);

                beforeEach(() => {
                    scope.post('/hello', strData)
                        .reply(200, data);
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.post('/hello', null, {
                        body: strData,
                        responseType: 'text'
                    });
                    expect(results).toEqual(strData);
                });
            });

            describe('when called with a path and headers', () => {
                beforeEach(() => {
                    scope.post('/hello', { hello: true })
                        .reply(200, { example: 'hello' });
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.post('/hello', { hello: true }, {
                        headers: {
                            SomeHeader: 'hi'
                        }
                    });
                    expect(results).toEqual({ example: 'hello' });
                });
            });

            describe('when called with a path and a buffer', () => {
                const response = { message: 'response-hello' };
                const strData = JSON.stringify(response);

                beforeEach(() => {
                    scope.post('/hello', 'hello')
                        .reply(200, response);
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.post('/hello', Buffer.from('hello'), {
                        responseType: 'text'
                    });
                    expect(results).toEqual(strData);
                });
            });
        });

        describe('->put', () => {
            describe('when called with nothing', () => {
                it('should reject with a empty path message', async () => {
                    expect.hasAssertions();
                    try {
                        // @ts-expect-error
                        await client.put();
                    } catch (err) {
                        expect(err.message).toEqual('endpoint must not be empty');
                    }
                });
            });

            describe('when called with a non-string value', () => {
                it('should reject with invalid endpoint error', async () => {
                    expect.hasAssertions();
                    try {
                        // @ts-expect-error
                        await client.put({ hello: 'hi' });
                    } catch (err) {
                        expect(err.message).toEqual('endpoint must be a string');
                    }
                });
            });

            describe('when called with a path and body', () => {
                const data = { example: 'hello' };

                beforeEach(() => {
                    scope.put('/hello', { hello: true })
                        .reply(200, data);
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.put('/hello', { hello: true });
                    expect(results).toEqual(data);
                });
            });

            describe('when called with a path and data', () => {
                const data = { example: 'hello' };

                beforeEach(() => {
                    scope.put('/hello', { hello: true })
                        .reply(200, data);
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.put('/hello', { hello: true });
                    expect(results).toEqual(data);
                });
            });
        });

        describe('->delete', () => {
            describe('when called with nothing', () => {
                it('should reject with a empty path message', async () => {
                    expect.hasAssertions();
                    try {
                        // @ts-expect-error
                        await client.delete();
                    } catch (err) {
                        expect(err.message).toEqual('endpoint must not be empty');
                    }
                });
            });

            describe('when called with a non-string value', () => {
                it('should reject with invalid endpoint error', async () => {
                    expect.hasAssertions();
                    try {
                        // @ts-expect-error
                        await client.delete({ hello: 'hi' });
                    } catch (err) {
                        expect(err.message).toEqual('endpoint must be a string');
                    }
                });
            });

            describe('when called with a valid path', () => {
                const response = { _id: 'someID' };

                beforeEach(() => {
                    scope.delete('/hello')
                        .reply(200, response);
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.delete('/hello');
                    expect(results).toEqual(response);
                });
            });

            describe('when called with a path and query', () => {
                const response = { _id: 'someID' };

                beforeEach(() => {
                    scope.delete('/hello')
                        .query({ hello: true })
                        .reply(200, response);
                });

                it('should resolve with the response from the server', async () => {
                    const results = await client.delete('/hello', { searchParams: { hello: 'true' } });
                    expect(results).toEqual(response);
                });
            });
        });
    });
});
