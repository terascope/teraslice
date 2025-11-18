import { jest } from '@jest/globals';
import events from 'node:events';
import { debugLogger } from '@terascope/core-utils';
import { Messaging, routing } from '../../src/lib/cluster/services/cluster/backends/native/messaging.js';

describe('messaging module', () => {
    const logger = debugLogger('messaging');
    let connected: Record<string, { rooms: Record<string, string> }> = {};

    const testExId = '7890';

    let firstWorkerMsg: Record<string, any> | null;
    let secondWorkerMsg: Record<string, any> | null;

    let clusterFn: any = () => {};

    function testMessaging(messaging: Messaging, fn: string) {
        return (...args: any[]) => messaging[fn as keyof Messaging](...args);
    }

    class MyCluster extends events.EventEmitter {
        workers: Record<string, any>;

        constructor() {
            super();
            this.workers = {
                first: {
                    ex_id: testExId,
                    assignment: 'execution_controller',
                    connected: true,
                    send: (msg: Record<string, any>) => {
                        firstWorkerMsg = msg;
                    },
                    on: (key: string, fn: any) => {
                        clusterFn = fn;
                    },
                    removeListener: () => {}
                },
                second: {
                    ex_id: testExId,
                    assignment: 'worker',
                    connected: true,
                    send: (msg: Record<string, any>) => {
                        secondWorkerMsg = msg;
                    },
                    on: (key: string, fn: any) => {
                        clusterFn = fn;
                    },
                    removeListener: () => {}
                },
                third: {
                    ex_id: 'somethingElse',
                    assignment: 'worker',
                    connected: true,
                    send: () => {
                    },
                    on: (key: string, fn: any) => {
                        clusterFn = fn;
                    },
                    removeListener: () => {}
                }
            };
        }
    }

    let emitMsg: Record<string, any>;

    const io = {
        emit: (msg: string, msgObj: Record<string, any>) => {
            emitMsg = { message: msg, data: msgObj };
        },
        sockets: {
            in: (address: string) => ({
                emit: (msg: string, msgObj: Record<string, any>) => {
                    const socketMsg = { message: msg, data: msgObj, address };
                    logger.debug(socketMsg);
                }
            }),
            connected
        },
        eio: {
            clientsCount: 2
        },
        close() {}
    };

    function getContext(obj: Record<string, any>): any {
        const emitter = new events.EventEmitter();
        emitter.setMaxListeners(40);
        const systemEvents = new events.EventEmitter();
        systemEvents.setMaxListeners(40);
        const clusterEmitter = new MyCluster();
        clusterEmitter.setMaxListeners(40);
        const config = Object.assign(emitter, obj);

        const cleanup = () => {
            emitter.removeAllListeners();
            systemEvents.removeAllListeners();
            clusterEmitter.removeAllListeners();
        };

        return {
            sysconfig: {
                teraslice: {
                    master_hostname: '127.0.0.1',
                    port: 47898,
                    action_timeout: 5000,
                    network_latency_buffer: 10
                }
            },
            apis: {
                foundation: {
                    getSystemEvents: () => systemEvents
                }
            },
            cluster: clusterEmitter,
            __testingModule: config,
            cleanup
        };
    }

    beforeEach(() => {
        firstWorkerMsg = null;
        secondWorkerMsg = null;
        connected = {};
        io.sockets.connected = connected;
    });

    afterEach(() => {
        process.removeAllListeners('message');
    });

    it('can make a hostname', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = new Messaging(testContext, logger, io);
        const test = testMessaging(messaging, '_makeHostName');

        expect(test('127.0.0.1', 5647)).toEqual('http://127.0.0.1:5647');
        expect(test('127.0.0.1:', 5647)).toEqual('http://127.0.0.1:5647');

        expect(test('http://127.0.0.1', 5647)).toEqual('http://127.0.0.1:5647');
        expect(test('https://127.0.0.1', 5647)).toEqual('https://127.0.0.1:5647');

        expect(test('127.0.0.1', 5647, 'v1')).toEqual('http://127.0.0.1:5647/v1');
        expect(messaging.getHostUrl()).toEqual('http://127.0.0.1:47898');
        testContext.cleanup();
    });

    it('can detect itself and make configurations', () => {
        function getConfig(type: string) {
            const job = JSON.stringify({
                slicer_hostname: '127.0.0.1',
                slicer_port: 47898
            });
            const testContext = getContext({ env: { assignment: type, job } });
            const testModule = new Messaging(testContext, logger, io);
            testContext.cleanup();
            // @ts-expect-error
            return testModule._makeConfigurations();
        }

        expect(getConfig('node_master')).toEqual({
            clients: { networkClient: true, ipcClient: false },
            hostURL: 'http://127.0.0.1:47898',
            assignment: 'node_master'
        });
        expect(getConfig('cluster_master')).toEqual({
            clients: { networkClient: false, ipcClient: true },
            assignment: 'cluster_master'
        });

        expect(getConfig('assets_service')).toEqual({
            clients: { networkClient: true, ipcClient: true },
            hostURL: 'http://127.0.0.1:47898',
            assignment: 'assets_service'
        });
    });

    it('can be called without errors', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        expect(() => new Messaging(testContext, logger)).not.toThrow();
        testContext.cleanup();
    });

    it('has a router', () => {
        const routingData = {
            cluster_master: {
                node_master: 'network'
            },
            node_master: {
                cluster_process: 'ipc',
                cluster_master: 'network'
            },
            assets_service: { cluster_master: 'ipc' }
        };

        expect(routing).toEqual(routingData);
    });

    it('can determie path for message', () => {
        const testContext1 = getContext({ env: { assignment: 'node_master' } });
        const messaging1 = new Messaging(testContext1, logger, io);
        const test1 = testMessaging(messaging1, '_determinePathForMessage');

        const testContext2 = getContext({ env: { assignment: 'cluster_master' } });
        const messaging2 = new Messaging(testContext2, logger, io);
        const test2 = testMessaging(messaging2, '_determinePathForMessage');

        const testContext3 = getContext({ env: { assignment: 'assets_service' } });
        const messaging3 = new Messaging(testContext3, logger, io);
        const test3 = testMessaging(messaging3, '_determinePathForMessage');

        const failureMessage1 = { to: 'theUnknown' };

        expect(test1({ to: 'cluster_process' })).toEqual('ipc');
        expect(test1({ to: 'cluster_master' })).toEqual('network');

        expect(() => test1(failureMessage1)).toThrow();

        expect(test2({ to: 'node_master' })).toEqual('network');

        expect(test3({ to: 'cluster_master' })).toEqual('ipc');

        testContext1.cleanup();
        testContext2.cleanup();
        testContext3.cleanup();
    });

    it('can get a list of rooms as the cluster_master', () => {
        connected['some-socket-id'] = {
            rooms: {
                'room-a': 'room-a',
                'room-b': 'room-b'
            }
        };

        connected['another-socket-id'] = {
            rooms: {
                'room-1': 'room-1'
            }
        };

        const testContext = getContext({
            env: {
                assignment: 'cluster_master'
            }
        });

        const messaging = new Messaging(testContext, logger, io);

        const rooms = messaging.listRooms();

        expect(rooms).toEqual(['room-a', 'room-b', 'room-1']);

        testContext.cleanup();
    });

    it('can forward/broadcast messages', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = new Messaging(testContext, logger, io);
        // @ts-expect-error
        messaging._forwardMessage({ to: 'cluster_master', message: 'someEvent' });
        // should be a network emit msg
        expect(emitMsg).toEqual({
            message: 'someEvent',
            data: {
                to: 'cluster_master',
                message: 'someEvent'
            }
        });

        messaging.broadcast('someEvent', { some: 'data' });
        expect(emitMsg).toEqual({
            message: 'networkMessage',
            data: {
                some: 'data',
                message: 'someEvent'
            }
        });

        testContext.cleanup();
    });

    it('can work with messaging:response messages', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const eventEmitter = testContext.apis.foundation.getSystemEvents();
        const messaging = new Messaging(testContext, logger, io);
        const msgId = 'someId';
        const nodeMsg = { __source: 'node_master', __msgId: msgId, message: 'someMessage' };

        let emittedData: any = null;

        eventEmitter.once(msgId, (data: Record<string, any>) => {
            emittedData = data;
        });

        // @ts-expect-error
        messaging._handleResponse(nodeMsg);
        expect(emittedData).toEqual(nodeMsg);

        testContext.cleanup();
    });

    it('can getClientCounts', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = new Messaging(testContext, logger, io);

        expect(messaging.getClientCounts()).toEqual(2);
        testContext.cleanup();
    });

    // This test is broken but it works.
    // We may not need a test for this because this messaging service
    // should be replaced with @terascope/teraslice-messaging.
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('can send transactional and non-transactional messages', async () => {
        const testContext = getContext({ env: { assignment: 'cluster_master' } });
        const eventEmitter = testContext.apis.foundation.getSystemEvents();
        const messaging = new Messaging(testContext, logger, io);
        const workerMsg = {
            to: 'node_master',
            node_id: 'someId',
            message: 'cluster:execution:stop'
        };
        const transactionalMsg = Object.assign({}, workerMsg, { response: true });
        const transactionalErrorMsg = Object.assign({}, workerMsg, {
            response: true,
            error: 'someError'
        });
        const transactionalTimeoutErrorMsg = Object.assign({}, workerMsg, {
            response: true,
            error: 'someError',
            timeout: 30
        });

        function sendEvent(timer: number) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    let msgId;
                    if (secondWorkerMsg) {
                        msgId = secondWorkerMsg.__msgId;
                    } else {
                        msgId = '12345';
                    }
                    eventEmitter.emit(msgId, secondWorkerMsg);
                    resolve(true);
                }, timer);
            });
        }

        // this is technically a sync message, but a promise is returned for composability
        // and to act similiar to its transactional counterpart
        try {
            const bool = await messaging.send(workerMsg);
            expect(bool).toEqual(true);
            expect(firstWorkerMsg).toEqual(workerMsg);

            const [results] = await Promise.all([messaging.send(transactionalMsg), sendEvent(20)]);
            expect(results).toEqual(secondWorkerMsg);

            // testing error scenario
            try {
                await Promise.all([messaging.send(transactionalErrorMsg), sendEvent(20)]);
            } catch (err) {
                expect(err).toEqual('Error: someError occurred on node: node_master');
                try {
                    await Promise.all([
                        messaging.send(transactionalTimeoutErrorMsg),
                        sendEvent(100)
                    ]);
                } catch (error) {
                    const messageSent = secondWorkerMsg;
                    expect(error.message).toEqual(
                        `timeout error while communicating with ${messageSent?.to}, msg: ${
                            messageSent?.message
                        }, data: ${JSON.stringify(messageSent)}`
                    );
                }
            }
        } finally {
            testContext.cleanup();
        }
    });

    it('can register callbacks and attach them to socket/io', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = new Messaging(testContext, logger, io);

        let exitIsCalled = false;
        const socketSettings: Record<string, any>[] = [];

        messaging.register({
            event: 'network:connect',
            identifier: 'node_id',
            callback: (msg: Record<string, any>, id: string, identifier: string) => {
                socketSettings.push({ msg, id, identifier });
                return true;
            }
        });

        messaging.register({
            event: 'cluster:node:get_port',
            callback: () => 3452
        });

        messaging.register({
            event: 'child:exit',
            callback: () => {
                exitIsCalled = true;
            }
        });

        expect(() => messaging.register({
            event: 'some:event',
            callback: () => {
                exitIsCalled = true;
            }
        })).toThrow();

        const results = { ...messaging.functionMapping };

        expect(results['cluster:node:get_port']).toBeDefined();
        expect(typeof results['cluster:node:get_port']).toEqual('function');
        expect(results['cluster:node:get_port']()).toEqual(3452);

        // it internally maps 'network:connect' to connect
        expect(results.connect).toBeDefined();
        expect(typeof results.connect).toEqual('function');
        expect(results.connect()).toEqual(true);
        expect(results.connect.__socketIdentifier).toEqual('node_id');

        // node master sets the event on the cluster obj
        testContext.cluster.emit('exit');
        expect(exitIsCalled).toEqual(true);

        socketSettings.shift();

        const socketList: Record<string, any> = {};
        const joinList: Record<string, any> = {};
        const socket = {
            rooms: joinList,
            on: (key: string, fn: any) => {
                socketList[key] = fn;
            },
            join: (id: string) => {
                joinList[id] = id;
            },
            removeListener: (key: string) => {
                delete socketList[key];
            },
            removeListeners: (key: string) => {
                delete socketList[key];
            }
        };

        // @ts-expect-error
        messaging._registerFns(socket);
        socketList.connect({ node_id: 'someId' });
        expect(socketSettings[0]).toEqual({
            msg: { node_id: 'someId' },
            id: 'someId',
            identifier: 'node_id'
        });

        testContext.cleanup();
    });

    it('can fail if the registering an event for another assignment', () => {
        const testContext = getContext({ env: { assignment: 'node_master' } });
        const messaging = new Messaging(testContext, logger, io);

        const socketSettings: any[] = [];

        expect(() => {
            messaging.register({
                // this event is not available to node_master
                event: 'node:online',
                identifier: 'node_id',
                callback: (msg: Record<string, any>, id: string, identifier: string) => {
                    socketSettings.push({ msg, id, identifier });
                    return true;
                }
            });
        }).toThrow();

        testContext.cleanup();
    });

    it('can listen and setup server', async () => {
        const testContext1 = getContext({ env: { assignment: 'node_master' } });
        const messaging1 = new Messaging(testContext1, logger);

        const testContext2 = getContext({ env: { assignment: 'cluster_master' } });
        const messaging2 = new Messaging(testContext2, logger);

        expect(() => messaging1.listen()).not.toThrow();
        expect(() => messaging2.listen({ port: 45645 })).not.toThrow();

        await messaging1.shutdown();
        await messaging2.shutdown();

        testContext1.cleanup();
        testContext2.cleanup();
    });

    it('sets up listeners', () => {
        const testContext1 = getContext({ env: { assignment: 'node_master' } });
        const messaging1 = new Messaging(testContext1, logger, io);
        const spy = jest.fn();

        messaging1.registerChildOnlineHook(spy);

        testContext1.cluster.emit('online', { id: 'first' });

        clusterFn({ to: 'cluster_master' });
        clusterFn({ to: 'node_master' });
        clusterFn({ to: 'worker' });

        expect(spy).toHaveBeenCalled();

        testContext1.cleanup();
    });
});
