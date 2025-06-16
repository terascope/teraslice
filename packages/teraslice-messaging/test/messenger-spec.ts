import 'jest-extended';
import { jest } from '@jest/globals';
import http from 'node:http';
import { Message } from '../src/messenger/index.js';
import { Messenger, formatURL, newMsgId } from '../src/index.js';
import { findPort, pDelay } from './helpers/index.js';

jest.setTimeout(10000);

describe('Messenger', () => {
    describe('->Core', () => {
        describe('when constructed without a valid actionTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    new Messenger.Core({} as any);
                }).toThrow('Messenger requires a valid actionTimeout');
            });
        });

        describe('when constructed without a valid networkLatencyBuffer', () => {
            it('should throw an error', () => {
                expect(() => {
                    new Messenger.Core({
                        actionTimeout: 10,
                        // @ts-expect-error
                        networkLatencyBuffer: 'abc'
                    });
                }).toThrow('Messenger requires a valid networkLatencyBuffer');
            });
        });

        it('should throw an error when calling isClientReady', () => {
            const errorMsg = 'isClientReady should be implemented on the server and client class';
            const core = new Messenger.Core({
                actionTimeout: 10,
                networkLatencyBuffer: 0,
            });
            expect(() => {
                core.isClientReady();
            }).toThrow(errorMsg);
        });
    });

    describe('->Client', () => {
        describe('when constructed without a valid hostUrl', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0
                    });
                }).toThrow('Messenger.Client requires a valid hostUrl');
            });
        });

        describe('when constructed without a valid clientId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        hostUrl: 'some-host',
                    });
                }).toThrow('Messenger.Client requires a valid clientId');
            });
        });

        describe('when constructed without a valid clientType', () => {
            it('should throw an error', async () => {
                const clientId = await newMsgId();

                expect(() => {
                    // @ts-expect-error
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        hostUrl: 'some-host',
                        clientId,
                    });
                }).toThrow('Messenger.Client requires a valid clientType');
            });
        });

        describe('when constructed without a valid serverName', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        hostUrl: 'some-host',
                        clientId: 'hello',
                        clientType: 'some-client'
                    });
                }).toThrow('Messenger.Client requires a valid serverName');
            });
        });

        describe('when constructed without a valid connectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        hostUrl: 'some-host',
                        clientId: 'hello',
                        clientType: 'some-client',
                        serverName: 'some-server-name'
                    });
                }).toThrow('Messenger.Client requires a valid connectTimeout');
            });
        });
    });

    describe('->Server', () => {
        describe('when constructed without a valid port', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new Messenger.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0
                    });
                }).toThrow('Messenger.Server requires a valid port');
            });
        });

        describe('when constructed without a valid clientDisconnectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new Messenger.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        port: 80,
                        serverName: 'hello'
                    });
                }).toThrow('Messenger.Server requires a valid clientDisconnectTimeout');
            });
        });

        describe('when constructed without a valid serverName', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new Messenger.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        port: 80,
                        clientDisconnectTimeout: 1,
                    });
                }).toThrow('Messenger.Server requires a valid serverName');
            });
        });

        describe('when the port is already in-use', () => {
            let port: number;

            beforeAll(async () => {
                port = await findPort();

                return new Promise((resolves) => {
                    http.createServer((req, res) => {
                        res.end(req.url);
                    }).listen(port, () => {
                        resolves(true);
                    });
                });
            });

            it('should throw error', () => {
                const server = new Messenger.Server({
                    actionTimeout: 1,
                    networkLatencyBuffer: 0,
                    port,
                    clientDisconnectTimeout: 1,
                    serverName: 'hello'
                });
                const error = `Port ${port} is already in-use`;
                return expect(server.listen()).rejects.toThrow(error);
            });
        });
    });

    describe('Client & Server', () => {
        let clientId: string;
        let client: Messenger.Client;
        let server: Messenger.Server;
        type ClientFn = (id: string) => void;
        let clientAvailableFn: ClientFn;
        const clientUnavailableFn: ClientFn = jest.fn();
        const clientOnlineFn: ClientFn = jest.fn();
        const clientDisconnectFn: ClientFn = jest.fn();
        const clientReconnectFn: ClientFn = jest.fn();
        const clientShutdownFn: ClientFn = jest.fn();
        const clientErrorFn: ClientFn = jest.fn();

        beforeAll(() => {
            return new Promise((resolves) => {
                clientAvailableFn = jest.fn(() => {
                    resolves(true);
                });

                async function setup() {
                    clientId = await newMsgId();
                    const port = await findPort();
                    const hostUrl = formatURL('localhost', port);

                    server = new Messenger.Server({
                        port,
                        networkLatencyBuffer: 0,
                        actionTimeout: 1000,
                        serverTimeout: 2000,
                        clientDisconnectTimeout: 3000,
                        serverName: 'example'
                    });

                    server.onClientOnline(clientOnlineFn);
                    server.onClientAvailable(clientAvailableFn);
                    server.onClientUnavailable(clientUnavailableFn);
                    server.onClientDisconnect(clientDisconnectFn);
                    server.onClientReconnect(clientReconnectFn);
                    server.onClientShutdown(clientShutdownFn);
                    server.onClientError(clientErrorFn);

                    client = new Messenger.Client({
                        serverName: 'example',
                        clientId,
                        clientType: 'example',
                        hostUrl,
                        clientDisconnectTimeout: 1000,
                        networkLatencyBuffer: 0,
                        actionTimeout: 1000,
                        connectTimeout: 5000,
                    // this last arg is for overriding the
                    // connect timeout for the socket.io client
                    }, 500);

                    // let the client connect first so
                    // we can test that client can come up
                    // before the server
                    await Promise.all([
                        client.connect(),
                        pDelay(1000).then(() => server.listen())
                    ]);

                    await client.sendAvailable();
                }

                setup();
            });
        });

        afterAll(async () => {
            await Promise.all([
                client.shutdown(),
                server.shutdown(),
            ]);
        });

        it('should have the correct client properties', () => {
            expect(server.onlineClientCount).toEqual(1);
            expect(server.onlineClients).toBeArrayOfSize(1);
            expect(server.availableClientCount).toEqual(1);
            expect(server.availableClients).toBeArrayOfSize(1);
            expect(server.disconnectedClientCount).toEqual(0);
            expect(server.disconnectedClients).toBeArrayOfSize(0);
            expect(server.unavailableClientCount).toEqual(0);
            expect(server.unavailableClients).toBeArrayOfSize(0);
        });

        it('should call server.onClientOnline', () => {
            expect(clientOnlineFn).toHaveBeenCalledWith(clientId);
        });

        it('should call server.onClientAvailable', () => {
            expect(clientAvailableFn).toHaveBeenCalledWith(clientId);
        });

        it('should not call server.onClientUnavailable', () => {
            expect(clientUnavailableFn).not.toHaveBeenCalled();
        });

        it('should not call server.onClientDisconnect', () => {
            expect(clientDisconnectFn).not.toHaveBeenCalled();
        });

        it('should not call server.onClientShutdown', () => {
            expect(clientShutdownFn).not.toHaveBeenCalled();
        });

        it('should not call server.onClientReconnect', () => {
            expect(clientReconnectFn).not.toHaveBeenCalled();
        });

        it('should not call server.onClientError', () => {
            expect(clientErrorFn).not.toHaveBeenCalled();
        });

        it('should be able to handle getTimeoutWithMax', () => {
            expect(server.getTimeoutWithMax(100)).toBe(100);
            expect(server.getTimeoutWithMax(20000)).toBe(1000);
        });

        it('should be able to handle waitForClientReady', async () => {
            try {
                await server.waitForClientReady('hello', 100);
            } catch (err) {
                expect(err.message).toEqual('Client hello is not ready');
            }

            const clientReady = await server.waitForClientReady(client.clientId, 100);
            expect(clientReady).toBeTrue();

            const serverReady = await client.waitForClientReady(client.serverName, 100);
            expect(serverReady).toBeTrue();
        });

        describe('when testing onceWithTimeout', () => {
            it('should be able to handle timeouts', async () => {
                expect(server.listenerCount('timeout:event')).toBe(0);

                const once = server.onceWithTimeout('timeout:event', 500);
                expect(server.listenerCount('timeout:event')).toBe(1);
                const msg = await once;

                expect(msg).toBeUndefined();

                expect(server.listenerCount('timeout:event')).toBe(0);
            });

            it('should be able to handle timeouts when given a specific scope', () => {
                const once = server.onceWithTimeout(`timeout:event:${clientId}`, 500);
                return expect(once).resolves.toBeUndefined();
            });

            it('should be able to resolve the message', async () => {
                expect(server.listenerCount('success:event')).toBe(0);

                const once = server.onceWithTimeout('success:event', 500);
                expect(server.listenerCount('success:event')).toBe(1);

                await server.emit('success:event', {
                    scope: clientId,
                    payload: {
                        hello: true
                    }
                });

                const msg = await once;

                expect(server.listenerCount('success:event')).toBe(0);

                expect(msg).toEqual({
                    hello: true
                });
            });

            it('should be able to resolve the message when given a specific scope', () => {
                const once = server.onceWithTimeout(`success:event:${clientId}`, 500);
                server.emit('success:event', {
                    scope: clientId,
                    payload: {
                        hello: true
                    }
                });
                return expect(once).resolves.toEqual({
                    hello: true
                });
            });
        });

        describe('when waiting for message that will never come', () => {
            it('should throw a timeout error', async () => {
                expect.hasAssertions();

                // @ts-expect-error
                server.handleResponse(server.server.to(clientId), 'hello', async () => {
                    await pDelay(1000);
                });

                try {
                    // @ts-expect-error
                    await client.send('hello', {}, {
                        response: true,
                        volatile: false,
                        timeout: 500
                    });
                } catch (err) {
                    expect(err).not.toBeNil();
                    expect(err.message).toStartWith('Timed out after');
                    expect(err.message).toEndWith('waiting for message "hello"');
                }
            });
        });

        describe('when sending a message to client that does not exist', () => {
            it('should throw a timeout error', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await server.send('mystery-client', 'hello');
                } catch (err) {
                    expect(err).not.toBeNil();
                    expect(err.message).toEqual('No client found by that id "mystery-client"');
                }
            });
        });

        // eslint-disable-next-line jest/no-disabled-tests
        describe.skip('when the client responds with an error', () => {
            let responseMsg: Message | Record<string, any> | undefined;
            let responseErr: Error | undefined;

            beforeAll(async () => {
                client.socket.once('failure:message', (msg: Message) => {
                    msg.error = 'this should fail';
                    client.socket.emit('message:response', msg);
                });
                try {
                    // @ts-expect-error
                    responseMsg = await server.send(clientId, 'failure:message', { hi: true });
                } catch (err) {
                    responseErr = err;
                }
            });

            it('server should get an error back', () => {
                expect(responseMsg).toBeNil();
                expect(responseErr && responseErr.toString()).toEqual('Error: Message Response Failure: this should fail');
            });
        });

        describe('when testing reconnect', () => {
            it('should call server.onClientReconnect', () => {
                expect.hasAssertions();

                return new Promise((resolves) => {
                    server.onClientReconnect(() => {
                        resolves(true);
                        expect(true).toBeTrue();
                    });

                    client.forceReconnect();
                });
            });
        });
    });
});
