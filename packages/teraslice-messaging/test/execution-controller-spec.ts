import 'jest-extended';
import { jest } from '@jest/globals';
import { pDelay, findPort } from './helpers/index.js';
import { formatURL, newMsgId, ExecutionController } from '../src/index.js';
import type * as i from '../src/execution-controller/interfaces.js';

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

            describe('when sending execution:slice:tap', () => {
                const tapResults = {
                    sliceId: 'tapped-slice',
                    records: [
                        [{ record: { id: 1 }, metadata: { _key: '1' } }],
                        []
                    ]
                };

                // only queued workers are tapped
                beforeAll(async () => {
                    await client.sendAvailable();
                    await pDelay(100);
                });

                it('should reject when the worker has no tap handler registered', async () => {
                    await expect(server.sendSliceTapRequest(10, 500, 2000))
                        .rejects.toThrow();
                });

                describe('when the worker has a tap handler registered', () => {
                    const handler = jest.fn<i.SliceTapHandler>();

                    beforeAll(() => {
                        client.onSliceTapRequest(handler);
                    });

                    beforeEach(() => {
                        handler.mockReset();
                        handler.mockImplementation(() => tapResults);
                    });

                    it('should pass the request to the worker and return its tap', async () => {
                        const result = await server.sendSliceTapRequest(10, 3000, 2000);

                        expect(handler).toHaveBeenCalledWith({
                            size: 10,
                            tapTimeout: expect.toBeWithin(1000, 2001)
                        });
                        expect(result).toEqual({ workerId, ...tapResults });
                    });

                    it('should support an async tap handler', async () => {
                        handler.mockImplementation(async () => {
                            await pDelay(100);
                            return tapResults;
                        });

                        await expect(server.sendSliceTapRequest(0, 3000, 2000))
                            .resolves.toEqual({ workerId, ...tapResults });
                    });

                    it('should reject with the worker error when the tap fails', async () => {
                        handler.mockImplementation(async () => {
                            throw new Error('slice slice-1 failed before completing');
                        });

                        await expect(server.sendSliceTapRequest(10, 3000, 2000))
                            .rejects.toThrow('slice slice-1 failed before completing');
                    });

                    it('should reject when the worker does not respond before the send timeout', async () => {
                        let handlerDone!: Promise<void>;
                        handler.mockImplementation(async () => {
                            handlerDone = pDelay(600);
                            await handlerDone;
                            return tapResults;
                        });

                        await expect(server.sendSliceTapRequest(10, 300, 2000))
                            .rejects.toThrow();

                        // let the late response land before teardown
                        await handlerDone;
                        await pDelay(100);
                    });

                    it('should wait for the worker to be enqueued', async () => {
                        await client.sendUnavailable();
                        await pDelay(100);

                        const result = server.sendSliceTapRequest(10, 3000, 2000);

                        await pDelay(300);
                        await client.sendAvailable();

                        await expect(result).resolves.toEqual({ workerId, ...tapResults });
                    });

                    it('should reject when no worker is enqueued before the timeout', async () => {
                        await client.sendUnavailable();
                        await pDelay(100);

                        await expect(server.sendSliceTapRequest(10, 3000, 1500))
                            .rejects.toThrow(/Slice tap timeout/);
                    });
                });
            });
        });
    });

    describe('Server with multiple workers tapping slices', () => {
        let server: ExecutionController.Server;
        let executionControllerUrl: string;
        const clients: ExecutionController.Client[] = [];
        const handlers: Record<string, jest.Mock<i.SliceTapHandler>> = {};

        async function addWorker(workerId: string) {
            const client = new ExecutionController.Client({
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

            handlers[workerId] = jest.fn<i.SliceTapHandler>(async () => {
                await pDelay(300);
                return { sliceId: `${workerId}-slice`, records: [] };
            });
            client.onSliceTapRequest(handlers[workerId]);

            await client.start();
            clients.push(client);
            return client;
        }

        beforeAll(async () => {
            const slicerPort = await findPort();
            executionControllerUrl = formatURL('localhost', slicerPort);
            server = new ExecutionController.Server({
                port: slicerPort,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
                workerDisconnectTimeout: 3000,
            });

            await server.start();
        });

        afterAll(async () => {
            await server.shutdown();
            await Promise.all(clients.map((client) => client.shutdown()));
        });

        it('should reject when no workers connect before the timeout', async () => {
            await expect(server.sendSliceTapRequest(10, 3000, 1500))
                .rejects.toThrow(/Slice tap timeout/);
        });

        describe('when one worker is enqueued', () => {
            let first: ExecutionController.Client;

            beforeAll(async () => {
                first = await addWorker('worker-1');
                await first.sendAvailable();
                await pDelay(100);
            });

            it('should not send a second tap to a worker that is already tapping', async () => {
                const handler = handlers['worker-1'];
                handler.mockClear();
                handler.mockImplementationOnce(async () => {
                    await pDelay(1500);
                    return { sliceId: 'worker-1-slice', records: [] };
                });

                const tap = server.sendSliceTapRequest(10, 3000, 2000);
                await pDelay(100);

                await expect(server.sendSliceTapRequest(10, 3000, 1200))
                    .rejects.toThrow(/Slice tap timeout/);

                await expect(tap).resolves.toMatchObject({ workerId: 'worker-1' });
                expect(handler).toHaveBeenCalledTimes(1);
            });
        });

        describe('when two workers are enqueued', () => {
            beforeAll(async () => {
                const second = await addWorker('worker-2');
                await second.sendAvailable();
                await pDelay(100);
            });

            it('should tap the worker at the head of the queue', async () => {
                await expect(server.sendSliceTapRequest(10, 3000, 2000))
                    .resolves.toMatchObject({ workerId: 'worker-1', sliceId: 'worker-1-slice' });
            });

            it('should send concurrent taps to different workers', async () => {
                const results = await Promise.all([
                    server.sendSliceTapRequest(10, 3000, 2000),
                    server.sendSliceTapRequest(10, 3000, 2000),
                ]);

                expect(results.map((r) => r.workerId)).toEqual(['worker-1', 'worker-2']);
            });

            it('should wait for a worker to finish tapping when all are busy', async () => {
                const start = Date.now();
                const results = await Promise.all([
                    server.sendSliceTapRequest(10, 3000, 2000),
                    server.sendSliceTapRequest(10, 3000, 2000),
                    server.sendSliceTapRequest(10, 3000, 2000),
                ]);

                expect(results.map((r) => r.workerId)).toIncludeSameMembers([
                    'worker-1', 'worker-2', expect.stringMatching(/^worker-[12]$/)
                ]);
                // the third tap can only start after one of the first two finishes
                expect(Date.now() - start).toBeGreaterThanOrEqual(600);
            });
        });
    });
});
