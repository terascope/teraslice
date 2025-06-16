import 'jest-extended';
import { jest } from '@jest/globals';
import { pDelay, findPort } from './helpers/index.js';
import { formatURL, newMsgId, ExecutionController } from '../src/index.js';

describe('ExecutionController', () => {
    describe('->Client', () => {
        describe('when constructed without a executionControllerUrl', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new ExecutionController.Client({});
                }).toThrow('ExecutionController.Client requires a valid executionControllerUrl');
            });
        });

        describe('when constructed without a workerId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new ExecutionController.Client({
                        executionControllerUrl: 'example.com',
                    });
                }).toThrow('ExecutionController.Client requires a valid workerId');
            });
        });

        describe('when constructed without a workerDisconnectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new ExecutionController.Client({
                        executionControllerUrl: 'example.com',
                        workerId: 'test'
                    });
                }).toThrow('ExecutionController.Client requires a valid workerDisconnectTimeout');
            });
        });

        describe('when constructed with an invalid executionControllerUrl', () => {
            let client: ExecutionController.Client;

            beforeAll(() => {
                client = new ExecutionController.Client({
                    executionControllerUrl: 'http://idk.example.com',
                    workerId: 'hello',
                    workerDisconnectTimeout: 1000,
                    actionTimeout: 1000,
                    connectTimeout: 1000,
                    socketOptions: {
                        reconnection: false,
                    },
                });
            });

            it('start should throw an error', () => {
                const errMsg = /^Unable to connect to ExecutionController/;
                return expect(client.start()).rejects.toThrow(errMsg);
            });
        });
    });

    describe('->Server', () => {
        describe('when constructed without a valid workerDisconnectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new ExecutionController.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                    });
                }).toThrow('ExecutionController.Server requires a valid workerDisconnectTimeout');
            });
        });
    });

    describe('Client & Server', () => {
        let client: ExecutionController.Client;
        let server: ExecutionController.Server;
        let workerId: string;
        const executionFinishedFn: () => void = jest.fn();

        beforeAll(async () => {
            workerId = await newMsgId();

            const slicerPort = await findPort();
            const executionControllerUrl = formatURL('localhost', slicerPort);
            server = new ExecutionController.Server({
                port: slicerPort,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
                workerDisconnectTimeout: 3000,
            });

            await server.start();

            client = new ExecutionController.Client({
                workerId,
                executionControllerUrl,
                networkLatencyBuffer: 0,
                workerDisconnectTimeout: 1000,
                actionTimeout: 1000,
                connectTimeout: 1000,
                socketOptions: {
                    reconnection: false,
                },
            });

            client.onExecutionFinished(executionFinishedFn);

            await client.start();
        });

        afterAll(async () => {
            await server.shutdown();
            await client.shutdown();
        });

        describe('when calling start on the client again', () => {
            it('should not throw an error', () => expect(client.start()).resolves.toBeNil());
        });

        it('should have no active workers', () => {
            expect(server.activeWorkerCount).toBe(0);
        });

        it('should have a worker queue size of 0', () => {
            expect(server.workerQueueSize).toBe(0);
        });

        it('should not call client.onExecutionFinished', () => {
            expect(executionFinishedFn).not.toHaveBeenCalled();
        });

        describe('when the client is ready', () => {
            beforeAll(() => {
                return new Promise((resolve) => {
                    server.onClientAvailable(() => {
                        resolve(true);
                    });
                    client.sendAvailable();
                });
            });

            it('should have one client connected', async () => {
                expect(server.availableClientCount).toEqual(1);
                expect(server.onlineClientCount).toEqual(1);
            });

            describe('when sending worker:slice:complete', () => {
                describe('when the slice succeeds', () => {
                    it('should respond with a slice recorded and emit slice success', async () => {
                        const sliceComplete = jest.fn();
                        server.onSliceSuccess(sliceComplete);

                        if (client.available) {
                            await client.sendUnavailable();
                        }

                        const msg = await client.sendSliceComplete({
                            slice: {
                                slicer_order: 0,
                                slicer_id: 1,
                                request: {},
                                slice_id: 'success-slice-complete',
                                _created: 'hello',
                            },
                            analytics: {
                                time: [],
                                memory: [],
                                size: [],
                            },
                        });

                        await pDelay(100);

                        expect(sliceComplete).toHaveBeenCalled();

                        if (msg == null) {
                            expect(msg).not.toBeNull();
                        } else {
                            expect(msg.payload).toEqual({
                                slice_id: 'success-slice-complete',
                                recorded: true,
                            });
                        }

                        expect(server.queue.exists('workerId', workerId)).toBeFalse();
                    });
                });

                describe('when the slice fails', () => {
                    it('should respond with a slice recorded and emit slice failure', async () => {
                        const sliceFailure = jest.fn();
                        server.onSliceFailure(sliceFailure);

                        if (client.available) {
                            await client.sendUnavailable();
                        }

                        const msg = await client.sendSliceComplete({
                            slice: {
                                slicer_order: 0,
                                slicer_id: 1,
                                request: {},
                                slice_id: 'failure-slice-complete',
                                _created: 'hello',
                            },
                            analytics: {
                                time: [],
                                memory: [],
                                size: [],
                            },
                            error: 'hello',
                        });

                        await pDelay(100);

                        expect(sliceFailure).toHaveBeenCalled();
                        if (msg == null) {
                            expect(msg).not.toBeNull();
                        } else {
                            expect(msg.payload).toEqual({
                                slice_id: 'failure-slice-complete',
                                recorded: true,
                            });
                        }

                        expect(server.queue.exists('workerId', workerId)).toBeFalse();
                    });
                });
            });

            describe('when receiving finished', () => {
                beforeAll(async () => {
                    await new Promise<void>((resolve) => {
                        client.onExecutionFinished(() => {
                            resolve();
                        });
                        server.sendExecutionFinishedToAll('some-ex-id');
                    });
                });

                it('should call client.onExecutionFinished', () => {
                    expect(executionFinishedFn).toHaveBeenCalled();
                });
            });

            describe('when receiving execution:slice:new', () => {
                describe('when the client is set as available', () => {
                    it('should resolve with correct messages', async () => {
                        await client.sendAvailable();

                        const newSlice = {
                            slicer_order: 0,
                            slicer_id: 1,
                            request: {},
                            slice_id: 'client-slice-complete',
                            _created: 'hello',
                        };

                        const stopAt = Date.now() + 2000;

                        const slice = client.waitForSlice(() => Date.now() - stopAt > 0);

                        await pDelay(500);

                        expect(server.queue.exists('workerId', workerId)).toBeTrue();

                        const id = server.dequeueWorker(newSlice);
                        if (!id) {
                            expect(id).not.toBeNull();
                            return;
                        }

                        const dispatched = await server.dispatchSlice(newSlice, id);

                        await expect(slice).resolves.toEqual(newSlice);

                        expect(dispatched).toBeTrue();

                        expect(server.activeWorkerCount).toBe(1);

                        await client.sendSliceComplete({
                            slice: newSlice,
                            analytics: {
                                time: [],
                                memory: [],
                                size: [],
                            },
                        });

                        await pDelay(100);

                        expect(server.activeWorkerCount).toBe(0);
                    });

                    describe('when no slice is sent from the server', () => {
                        it('should handle the timeout properly', async () => {
                            await client.sendAvailable();

                            const stopAt = Date.now() + 2000;
                            const stopFn = () => Date.now() - stopAt > 0;
                            const slice = client.waitForSlice(stopFn, 500);

                            await pDelay(600);

                            await expect(slice).resolves.toBeUndefined();

                            expect(server.activeWorkerCount).toBe(0);
                            expect(client.available).toBeFalse();
                        });
                    });
                });

                describe('when the client is set as unavailable', () => {
                    beforeAll(async () => {
                        await client.sendUnavailable();
                        await pDelay(100);
                    });

                    it('should reject with the correct error messages', () => {
                        expect(client.available).toBeFalse();

                        const newSlice = {
                            slicer_order: 0,
                            slicer_id: 1,
                            request: {},
                            slice_id: 'client-slice-complete',
                            _created: 'hello',
                        };

                        const id = server.dequeueWorker(newSlice);
                        expect(id).toBeNull();
                    });
                });
            });
        });
    });
});
