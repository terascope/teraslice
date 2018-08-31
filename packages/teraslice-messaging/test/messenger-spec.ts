import 'jest-extended';

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
                        networkLatencyBuffer: 'abc'
                    });
                }).toThrowError('Messenger requires a valid networkLatencyBuffer');
            });
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

        describe('when constructed without a valid serverName', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Client({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        hostUrl: 'some-host',
                        clientId: 'hello'
                    });
                }).toThrowError('Messenger.Client requires a valid serverName');
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

        describe('when constructed without a valid pingTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new Messenger.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                        port: 80,
                    });
                }).toThrowError('Messenger.Server requires a valid pingTimeout');
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
        let clientAvailableFn: Messenger.ClientEventFn;
        const clientUnavailableFn: Messenger.ClientEventFn = jest.fn();
        const clientOnlineFn: Messenger.ClientEventFn = jest.fn();
        const clientOfflineFn: Messenger.ClientEventFn = jest.fn();
        const clientReconnectFn: Messenger.ClientEventFn = jest.fn();
        const clientErrorFn: Messenger.ClientEventFn = jest.fn();

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
                    serverName: 'example'
                });

                server.server.use((socket, next) => {
                    socket.join('example-room', next);
                });

                server.onClientOnline(clientOnlineFn);
                server.onClientAvailable(clientAvailableFn);
                server.onClientUnavailable(clientUnavailableFn);
                server.onClientOffline(clientOfflineFn);
                server.onClientReconnect(clientReconnectFn);
                server.onClientError(clientErrorFn);

                await server.listen();

                client = new Messenger.Client({
                    serverName: 'example',
                    clientId,
                    hostUrl,
                    networkLatencyBuffer: 0,
                    actionTimeout: 1000,
                    socketOptions: {
                        timeout: 1000,
                    },
                });

                await client.connect();
                await client.sendAvailable();
            }

            setup();
        });

        it('should have the correct client properties', () => {
            expect(server.onlineClientCount).toEqual(1);
            expect(server.onlineClients).toBeArrayOfSize(1);
            expect(server.availableClientCount).toEqual(1);
            expect(server.availableClients).toBeArrayOfSize(1);
            expect(server.offlineClientCount).toEqual(0);
            expect(server.offlineClients).toBeArrayOfSize(0);
            expect(server.unavailableClientCount).toEqual(0);
            expect(server.unavailableClients).toBeArrayOfSize(0);
        });

        it('should call server.onClientOnline', () => {
            expect(clientOnlineFn).toHaveBeenCalledWith(clientId, undefined);
        });

        it('should call server.onClientAvailable', () => {
            expect(clientAvailableFn).toHaveBeenCalledWith(clientId, undefined);
        });

        it('should not call server.onClientAvailable', () => {
            expect(clientUnavailableFn).not.toHaveBeenCalled();
        });

        it('should not call server.onClientOffline', () => {
            expect(clientOfflineFn).not.toHaveBeenCalled();
        });

        it('should not call server.onClientReconnect', () => {
            expect(clientReconnectFn).not.toHaveBeenCalled();
        });

        it('should not call server.onClientError', () => {
            expect(clientErrorFn).not.toHaveBeenCalled();
        });

        describe('when sending a message to client that does not exist', () => {
            it('should throw a timeout error', async () => {
                expect.hasAssertions();
                try {
                    // @ts-ignore
                    await server.send('mystery-client', 'hello');
                } catch (err) {
                    expect(err).not.toBeNil();
                    expect(err.message).toEqual(`No client found by that id "mystery-client"`);
                }
            });
        });

        describe('when testing server.onceWithTimeout', () => {
            it('should be able to handle timeouts', () => {
                const once = server.onceWithTimeout('timeout:event', 500);
                return expect(once).resolves.toBeUndefined();
            });

            it('should be able to handle timeouts when given a specific clientId', () => {
                const once = server.onceWithTimeout('timeout:event', clientId, 500);
                return expect(once).resolves.toBeUndefined();
            });

            it('should be able to resolve the message', () => {
                const once = server.onceWithTimeout('success:event', 500);
                server.emit('success:event', clientId, { hello: true });
                return expect(once).resolves.toEqual({
                    hello: true
                });
            });

            it('should be able to resolve the message when given a specific clientId', () => {
                const once = server.onceWithTimeout('success:event', clientId, 500);
                server.emit('success:event', clientId, { hello: true });
                return expect(once).resolves.toEqual({
                    hello: true
                });
            });
        });

        describe('when testing client.onceWithTimeout', () => {
            it('should be able to handle timeouts', () => {
                const once = client.onceWithTimeout('timeout:event', 500);
                return expect(once).resolves.toBeUndefined();
            });

            it('should be able to resolve the message', () => {
                const once = client.onceWithTimeout('success:event', 500);
                client.emit('success:event', { hello: true });
                return expect(once).resolves.toEqual({
                    hello: true
                });
            });
        });

        describe('when waiting for message that will never come', () => {
            it('should throw a timeout error', async () => {
                expect.hasAssertions();
                try {
                    // @ts-ignore
                    await client.send('mystery:message');
                } catch (err) {
                    expect(err).not.toBeNil();
                    expect(err.message).toEqual('Timed out after 1000ms, waiting for message');
                }
            });
        });

        describe('when the client responds with an error', () => {
            let responseMsg: Message | object | undefined;
            let responseErr: Error | undefined;

            beforeAll(async () => {
                // @ts-ignore
                client.socket.once('failure:message', (msg: Message, callback: Function) => {
                    callback('this sould fail');
                });
                try {
                    // @ts-ignore
                    responseMsg = await server.send(clientId, 'failure:message');
                } catch (err) {
                    responseErr = err;
                }
            });

            it('server should get an error back', () => {
                // @ts-ignore
                expect(responseMsg).toBeNil();
                expect(responseErr && responseErr.toString()).toEqual('Error: Message Response Failure: this sould fail');
            });
        });

        describe('when testing reconnect', () => {
            it('should call server.onClientReconnect', (done) => {
                server.onClientReconnect(() => {
                    done();
                });

                client.forceReconnect();
            });
        });
    });
});
