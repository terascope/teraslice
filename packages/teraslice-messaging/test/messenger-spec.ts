import 'jest-extended';

import bluebird from 'bluebird';
import http from 'http';
import { Message } from '../src/messenger';
import { Messenger, formatURL, newMsgId } from '../src';
import findPort from './helpers/find-port';

describe('Messenger', () => {
    describe('->Core', () => {
        describe('when constructed without a valid actionTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Core({});
                }).toThrowError('Messenger requires a valid actionTimeout');
            });
        });

        describe('when constructed without a valid networkLatencyBuffer', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Core({
                        actionTimeout: 10,
                        // @ts-ignore
                        networkLatencyBuffer: 'abc'
                    });
                }).toThrowError('Messenger requires a valid networkLatencyBuffer');
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
            }).toThrowError(errorMsg);
        });
    });

    describe('->Client', () => {
        describe('when constructed without a valid hostUrl', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0
                    });
                }).toThrowError('Messenger.Client requires a valid hostUrl');
            });
        });

        describe('when constructed without a valid clientId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        hostUrl: 'some-host',
                    });
                }).toThrowError('Messenger.Client requires a valid clientId');
            });
        });

        describe('when constructed without a valid clientType', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        hostUrl: 'some-host',
                        clientId: newMsgId(),
                    });
                }).toThrowError('Messenger.Client requires a valid clientType');
            });
        });

        describe('when constructed without a valid serverName', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        hostUrl: 'some-host',
                        clientId: 'hello',
                        clientType: 'some-client'
                    });
                }).toThrowError('Messenger.Client requires a valid serverName');
            });
        });

        describe('when constructed without a valid connectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        hostUrl: 'some-host',
                        clientId: 'hello',
                        clientType: 'some-client',
                        serverName: 'some-server-name'
                    });
                }).toThrowError('Messenger.Client requires a valid connectTimeout');
            });
        });
    });

    describe('->Server', () => {
        describe('when constructed without a valid port', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0
                    });
                }).toThrowError('Messenger.Server requires a valid port');
            });
        });

        describe('when constructed without a valid clientDisconnectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        port: 80,
                        serverName: 'hello'
                    });
                }).toThrowError('Messenger.Server requires a valid clientDisconnectTimeout');
            });
        });

        describe('when constructed without a valid serverName', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        port: 80,
                        clientDisconnectTimeout: 1,
                        pingTimeout: 1,
                    });
                }).toThrowError('Messenger.Server requires a valid serverName');
            });
        });

        describe('when the port is already in-use', () => {
            let port: number;

            beforeAll((done) => {
                findPort().then((_port) => {
                    port = _port;
                    http.createServer((req, res) => {
                        res.end(req.url);
                    }).listen(port, done);
                });
            });

            it('should throw error', () => {
                const server = new Messenger.Server({
                    actionTimeout: 1,
                    networkLatencyBuffer: 0,
                    port,
                    clientDisconnectTimeout: 1,
                    pingTimeout: 1,
                    serverName: 'hello'
                });
                const error = `Port ${port} is already in-use`;
                return expect(server.listen()).rejects.toThrowError(error);
            });
        });
    });

    describe('Client & Server', () => {
        const clientId = newMsgId();
        let client: Messenger.Client;
        let server: Messenger.Server;
        type clientFn = (clientId: string) => void;
        let clientAvailableFn: clientFn;
        const clientUnavailableFn: clientFn = jest.fn();
        const clientOnlineFn: clientFn = jest.fn();
        const clientOfflineFn: clientFn = jest.fn();
        const clientDisconnectFn: clientFn = jest.fn();
        const clientReconnectFn: clientFn = jest.fn();
        const clientShutdownFn: clientFn = jest.fn();
        const clientErrorFn: clientFn = jest.fn();

        beforeAll((done) => {
            clientAvailableFn = jest.fn(() => { done(); });

            async function setup() {
                const port = await findPort();
                const hostUrl = formatURL('localhost', port);
                server = new Messenger.Server({
                    port,
                    networkLatencyBuffer: 0,
                    actionTimeout: 1000,
                    pingTimeout: 3000,
                    pingInterval: 1000,
                    clientDisconnectTimeout: 4000,
                    serverName: 'example'
                });

                server.onClientOnline(clientOnlineFn);
                server.onClientAvailable(clientAvailableFn);
                server.onClientUnavailable(clientUnavailableFn);
                server.onClientOffline(clientOfflineFn);
                server.onClientDisconnect(clientDisconnectFn);
                server.onClientReconnect(clientReconnectFn);
                server.onClientShutdown(clientShutdownFn);
                server.onClientError(clientErrorFn);

                await server.listen();

                client = new Messenger.Client({
                    serverName: 'example',
                    clientId,
                    clientType: 'example',
                    hostUrl,
                    networkLatencyBuffer: 0,
                    actionTimeout: 1000,
                    connectTimeout: 2000,
                    socketOptions: {
                        reconnection: true,
                        reconnectionAttempts: 10,
                        reconnectionDelay: 500,
                        reconnectionDelayMax: 500
                    },
                });

                await client.connect();
                await client.sendAvailable();
            }

            setup();
        });

        afterAll((done) => {
            server.onClientShutdown(() => {
                server.shutdown()
                    .then(() => { done(); })
                    .catch(fail);
            });
            client.shutdown().catch(fail);
        });

        it('should have the correct client properties', () => {
            expect(server.connectedClientCount).toEqual(1);
            expect(server.connectedClients).toBeArrayOfSize(1);
            expect(server.onlineClientCount).toEqual(1);
            expect(server.onlineClients).toBeArrayOfSize(1);
            expect(server.availableClientCount).toEqual(1);
            expect(server.availableClients).toBeArrayOfSize(1);
            expect(server.offlineClientCount).toEqual(0);
            expect(server.offlineClients).toBeArrayOfSize(0);
            expect(server.disconectedClientCount).toEqual(0);
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

        it('should not call server.onClientOffline', () => {
            expect(clientOfflineFn).not.toHaveBeenCalled();
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
                const once = server.onceWithTimeout('timeout:event', clientId, 500);
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
                const once = server.onceWithTimeout('success:event', clientId, 500);
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

                // @ts-ignore
                server.handleResponse(server.server.to(clientId), 'hello', async () => {
                    await bluebird.delay(1000);
                });

                try {
                    // @ts-ignore
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
                    // @ts-ignore
                    await server.send('mystery-client', 'hello');
                } catch (err) {
                    expect(err).not.toBeNil();
                    expect(err.message).toEqual('No client found by that id "mystery-client"');
                }
            });
        });

        xdescribe('when the client responds with an error', () => {
            let responseMsg: Message | object | undefined;
            let responseErr: Error | undefined;

            beforeAll(async () => {
                // @ts-ignore
                client.socket.once('failure:message', (msg: Message) => {
                    msg.error = 'this should fail';
                    client.socket.emit('message:response', msg);
                });
                try {
                    // @ts-ignore
                    responseMsg = await server.send(clientId, 'failure:message', { hi: true });
                } catch (err) {
                    responseErr = err;
                }
            });

            it('server should get an error back', () => {
                // @ts-ignore
                expect(responseMsg).toBeNil();
                expect(responseErr && responseErr.toString()).toEqual('Error: Message Response Failure: this should fail');
            });
        });

        xdescribe('when testing reconnect', () => {
            it('should call server.onClientReconnect', (done) => {
                server.onClientReconnect(() => {
                    done();
                });

                client.forceReconnect();
            });
        });
    });
});
