import 'jest-extended';

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
    });

    describe('Client & Server', () => {
        const clientId = newMsgId();
        let client: Messenger.Client;
        let server: Messenger.Server;
        let clientReadyFn: Messenger.ClientEventFn;
        const clientOnlineFn: Messenger.ClientEventFn = jest.fn();
        const clientOfflineFn: Messenger.ClientEventFn = jest.fn();
        const clientErrorFn: Messenger.ClientEventFn = jest.fn();

        beforeAll((done) => {
            clientReadyFn = jest.fn(() => { done(); });

            async function setup() {
                const port = await findPort();
                const hostUrl = formatURL('localhost', port);
                server = new Messenger.Server({
                    port,
                    networkLatencyBuffer: 0,
                    actionTimeout: 1000,
                    pingTimeout: 3000,
                    source: 'example',
                    to: 'example',
                });

                server.server.use((socket, next) => {
                    socket.join('example-room', next);
                });

                server.onClientOnline(clientOnlineFn);
                server.onClientReady(clientReadyFn);
                server.onClientOffline(clientOfflineFn);
                server.onClientError(clientErrorFn);

                await server.listen();

                client = new Messenger.Client({
                    source: 'example',
                    to: 'example',
                    clientId,
                    hostUrl,
                    networkLatencyBuffer: 0,
                    actionTimeout: 1000,
                    socketOptions: {
                        timeout: 1000,
                        reconnection: false,
                    },
                });

                await client.connect();
                await client.ready();
            }

            setup();
        });

        it('should call server.onClientReady', () => {
            expect(clientReadyFn).toHaveBeenCalledWith(clientId, undefined);
        });

        it('should call server.onClientOnline', () => {
            expect(clientOnlineFn).toHaveBeenCalledWith(clientId);
        });

        it('should not call server.onClientOffline', () => {
            expect(clientOfflineFn).not.toHaveBeenCalledWith(clientId, undefined);
        });

        it('should not call server.onClientError', () => {
            expect(clientErrorFn).not.toHaveBeenCalledWith(clientId);
        });

        describe('when waiting for message that will never come', () => {
            it('should throw a timeout error', async () => {
                expect.hasAssertions();
                try {
                    await client.onceWithTimeout('mystery:message');
                } catch (err) {
                    expect(err).not.toBeNil();
                    expect(err.message).toEqual('Timed out after 1000ms, waiting for event "mystery:message"');
                }
            });
        });

        describe('when the client responds with an error', () => {
            let responseMsg: Message | object | undefined;
            let responseErr: Error | undefined;

            beforeAll(async () => {
                client.socket.once('failure:message', (msg: Message) => {
                    client.respond(msg, { error: 'this should fail' });
                });
                try {
                    responseMsg = await server.sendWithResponse({
                        address: 'example-room',
                        message: 'failure:message',
                        payload: { hello: true }
                    });
                } catch (err) {
                    responseErr = err;
                }
            });

            it('server should get an error back', () => {
                // @ts-ignore
                expect(responseMsg).toBeNil();
                expect(responseErr && responseErr.toString()).toEqual('Error: this should fail');
            });
        });

        describe('when the client takes too long to respond', () => {
            let responseMsg: Message | object | undefined;
            let responseErr: Error | undefined;

            beforeAll(async () => {
                try {
                    responseMsg = await server.sendWithResponse({
                        address: 'example-room',
                        message: 'some:message',
                        payload: { hello: true }
                    });
                } catch (err) {
                    responseErr = err;
                }
            });

            it('server should get an error back', () => {
                // @ts-ignore
                expect(responseMsg).toBeNil();
                expect(responseErr && responseErr.toString()).toStartWith(`Error: Timeout error while communicating with example-room, with message:`);
            });
        });
    });
});
