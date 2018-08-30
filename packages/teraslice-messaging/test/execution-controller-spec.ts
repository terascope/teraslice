import 'jest-extended';

import findPort from './helpers/find-port';
import * as core from '../src/messenger';
import {
    formatURL,
    newMsgId,
    ExecutionController
} from '../src';

describe('ExecutionController', () => {
    describe('->Client', () => {
        describe('when constructed without a executionControllerUrl', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ExecutionController.Client({});
                }).toThrowError('ExecutionController.Client requires a valid executionControllerUrl');
            });
        });

        describe('when constructed without a workerId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ExecutionController.Client({
                        executionControllerUrl: 'example.com'
                    });
                }).toThrowError('ExecutionController.Client requires a valid workerId');
            });
        });

        describe('when constructed with an invalid executionControllerUrl', () => {
            let client: ExecutionController.Client;

            beforeAll(() => {
                client = new ExecutionController.Client({
                    executionControllerUrl: 'http://idk.example.com',
                    workerId: 'hello',
                    actionTimeout: 1000,
                    socketOptions: {
                        timeout: 1000,
                        reconnection: false,
                    }
                });
            });

            it('start should throw an error', () => {
                const errMsg = /^Unable to connect to execution controller/;
                return expect(client.start()).rejects.toThrowError(errMsg);
            });
        });
    });

    describe('->Server', () => {
        describe('when constructed without a valid workerDisconnectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ExecutionController.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                    });
                }).toThrowError('ExecutionController.Server requires a valid workerDisconnectTimeout');
            });
        });
    });

    describe('Client & Server', () => {
        let client: ExecutionController.Client;
        let server: ExecutionController.Server;
        const workerId: string = newMsgId();
        const workerReconnectFn: core.ClientEventFn = jest.fn();
        const workerShutdownFn: ExecutionController.WorkerShutdownFn = jest.fn();

        beforeAll(async () => {
            const slicerPort = await findPort();
            const executionControllerUrl = formatURL('localhost', slicerPort);
            server = new ExecutionController.Server({
                controllerId: newMsgId(),
                port: slicerPort,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
                workerDisconnectTimeout: 3000,
            });

            server.onWorkerReconnect(workerReconnectFn);

            await server.start();

            client = new ExecutionController.Client({
                workerId,
                executionControllerUrl,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
                socketOptions: {
                    timeout: 1000,
                    reconnection: false,
                },
            });

            client.onWorkerShutdown(workerShutdownFn);

            await client.start();
        });

        afterAll(async () => {
            await server.shutdown();
            await client.shutdown();
        });

        describe('when calling start on the client again', () => {
            it('should not throw an error', () => {
                return expect(client.start()).resolves.toBeNil();
            });
        });

        it('should have no available workers', () => {
            expect(server.availableWorkers()).toEqual(0);
        });

        it('should not call server.onWorkerReconnect', () => {
            expect(workerReconnectFn).not.toHaveBeenCalledWith(workerId);
        });

        it('should not call client.onWorkerShutdown', () => {
            expect(workerShutdownFn).not.toHaveBeenCalled();
        });

        describe('when the client is ready', () => {
            beforeAll((done) => {
                server.onClientReady(() => { done(); });
                client.ready();
            });

            it('should have one client connected', async () => {
                expect(server.availableWorkers()).toEqual(1);
                expect(server.getClientCounts()).toEqual(1);
            });

            describe('when sending client:slice:complete', () => {
                it('should emit client:slice:complete on the server', async () => {
                    const msg = await client.sliceComplete({
                        slice: {
                            slicer_order: 0,
                            slicer_id: 1,
                            request: {},
                            slice_id: 'client-slice-complete',
                            _created: 'hello'
                        },
                        analytics: {
                            time: [],
                            memory: [],
                            size: []
                        },
                        error: 'hello'
                    });

                    expect(msg).toEqual({
                        slice_id: 'client-slice-complete',
                        recorded: true,
                    });
                    expect(server.queue.exists('workerId', workerId)).toBeTrue();
                });
            });

            describe('when receiving finished', () => {
                beforeAll((done) => {
                    client.onWorkerShutdown(() => { done(); });
                    server.executionFinished('some-ex-id');
                });

                it('should call client.onWorkerShutdown', () => {
                    expect(workerShutdownFn).toHaveBeenCalled();
                });
            });

            describe('when receiving slicer:slice:new', () => {
                describe('when the client is set as available', () => {
                    beforeAll(() => {
                        client.available = true;
                    });

                    it('should resolve with correct messages', async () => {
                        const newSlice = {
                            slicer_order: 0,
                            slicer_id: 1,
                            request: {},
                            slice_id: 'client-slice-complete',
                            _created: 'hello'
                        };

                        const response = server.sendNewSlice(workerId, newSlice);

                        const slice = client.waitForSlice();

                        await expect(response).resolves.toEqual({ willProcess: true });
                        await expect(slice).resolves.toEqual(newSlice);
                    });
                });

                describe('when the client is set as unavailable', () => {
                    beforeAll(() => {
                        client.available = false;
                    });

                    it('should reject with the correct error messages', async () => {
                        const newSlice = {
                            slicer_order: 0,
                            slicer_id: 1,
                            request: {},
                            slice_id: 'client-slice-complete',
                            _created: 'hello'
                        };

                        const response = server.sendNewSlice(workerId, newSlice);

                        const slice = client.onceWithTimeout('slicer:slice:new');

                        await expect(response).rejects.toThrowError(`Worker ${workerId} will not process new slice`);
                        await expect(slice).rejects.toThrowError('Timed out after 1000ms, waiting for event "slicer:slice:new"');
                    });
                });
            });
        });
    });
});
