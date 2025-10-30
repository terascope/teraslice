import { jest } from '@jest/globals';
import 'jest-extended';
import { pDelay } from '@terascope/core-utils';
import { ExecutionController } from '@terascope/teraslice-messaging';
import { Slice } from '@terascope/types';
import { findPort } from '../../../src/lib/utils/port_utils.js';
import { Worker } from '../../../src/lib/workers/worker/index.js';
import { TestContext } from '../helpers/index.js';

describe('Worker', () => {
    interface SetupTestResults {
        server: ExecutionController.Server;
        worker: Worker;
        testContext: TestContext;
    }

    async function setupTest(options: any = {}): Promise<SetupTestResults> {
        const slicerPort = await findPort();
        options.slicerPort = slicerPort;

        const testContext = new TestContext(options);
        await testContext.initialize();

        const server = new ExecutionController.Server({
            port: slicerPort,
            networkLatencyBuffer: 0,
            actionTimeout: 1000,
            workerDisconnectTimeout: 3000
        });

        testContext.attachCleanup(() => server.shutdown());

        await server.start();

        const worker = new Worker(testContext.context, testContext.executionContext as any);

        testContext.attachCleanup(() => worker.shutdown());

        return { server, worker, testContext };
    }

    describe('when running forever', () => {
        let sliceConfig: Slice;
        let worker: Worker;
        let testContext: TestContext;
        let server: ExecutionController.Server;
        let sliceSuccess: Record<string, any>;
        let sliceFailure: Record<string, any>;

        beforeEach(async () => {
            ({ worker, testContext, server } = await setupTest());

            await worker.initialize();

            sliceConfig = await testContext.newSlice();

            server.onClientAvailable(() => {
                server.dispatchSlice(sliceConfig, worker.workerId);
            });
            let shutdownPromise;

            server.onSliceSuccess((workerId, _msg) => {
                sliceSuccess = _msg;
                shutdownPromise = worker.shutdown();
            });

            server.onSliceFailure((workerId, _msg) => {
                sliceFailure = _msg;
                shutdownPromise = worker.shutdown();
            });

            await worker.run();
            await shutdownPromise;
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should complete the slice', () => {
            expect(sliceFailure).toBeNil();

            expect(sliceSuccess).toMatchObject({
                slice: sliceConfig
            });
        });
    });

    describe('when running and the execution controller disconnects', () => {
        let sliceConfig: Slice;
        let worker: Worker;
        let testContext: TestContext;
        let server: ExecutionController.Server;
        let sliceSuccess: Record<string, any>;
        let sliceFailure: Record<string, any>;

        beforeEach(async () => {
            ({ worker, testContext, server } = await setupTest());

            await worker.initialize();

            sliceConfig = await testContext.newSlice();

            server.onClientAvailable(() => {
                server.dispatchSlice(sliceConfig, worker.workerId);
            });

            let shutdownPromise;

            server.onSliceSuccess((workerId, _msg) => {
                sliceSuccess = _msg;
                setTimeout(async () => {
                    shutdownPromise = server.shutdown();
                });
            });

            server.onSliceFailure((workerId, _msg) => {
                sliceFailure = _msg;
                setTimeout(async () => {
                    shutdownPromise = server.shutdown();
                });
            });

            await worker.run();
            await shutdownPromise;
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should complete the slice', () => {
            expect(sliceFailure).toBeNil();

            expect(sliceSuccess).toMatchObject({
                slice: sliceConfig
            });
        });
    });

    describe('when a slice is sent from the execution controller', () => {
        let sliceConfig: Slice;
        let worker: Worker;
        let testContext: TestContext;
        let server: ExecutionController.Server;
        let sliceSuccess: Record<string, any>;
        let sliceFailure: Record<string, any>;

        beforeEach(async () => {
            ({ worker, testContext, server } = await setupTest());

            await worker.initialize();

            sliceConfig = await testContext.newSlice();

            server.onClientAvailable(() => {
                server.dispatchSlice(sliceConfig, worker.workerId);
            });

            server.onSliceSuccess((workerId, _msg) => {
                sliceSuccess = _msg;
            });

            server.onSliceFailure((workerId, _msg) => {
                sliceFailure = _msg;
            });

            await worker.runOnce();

            // avoid on slice events don't fire immediatley now
            await pDelay(0);
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should complete the slice', () => {
            expect(sliceFailure).toBeNil();

            expect(sliceSuccess).toMatchObject({
                slice: sliceConfig
            });
        });
    });

    describe('when a new slice is not sent right away', () => {
        let msg: Record<string, any>;
        let sliceConfig: Slice;
        let worker: Worker;
        let testContext: TestContext;
        let server: ExecutionController.Server;
        let sliceFailure: Record<string, any>;
        let sliceSuccess: Record<string, any>;

        beforeEach(async () => {
            ({ worker, testContext, server } = await setupTest());
            await worker.initialize();

            server.onSliceSuccess((workerId, _msg) => {
                sliceSuccess = _msg;
            });

            server.onSliceFailure((workerId, _msg) => {
                sliceFailure = _msg;
            });

            const msgPromise = server.onceWithTimeout('worker:enqueue');

            const workerStart = worker.runOnce();

            await pDelay(500);
            sliceConfig = await testContext.newSlice();

            await server.dispatchSlice(sliceConfig, worker.workerId);

            await workerStart;

            msg = await msgPromise;

            await pDelay(100);
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should re-enqueue the worker after receiving the slice complete message', () => {
            expect(msg).not.toBeNil();
            expect(sliceSuccess).toMatchObject({
                slice: sliceConfig
            });
            expect(sliceFailure).toBeNil();
        });
    });

    describe('when a slice errors', () => {
        let worker: Worker;
        let testContext: TestContext;
        let server: ExecutionController.Server;
        let sliceFailure: Record<string, any>;
        let sliceSuccess: Record<string, any>;
        let msg: Record<string, any>;

        beforeEach(async () => {
            ({ worker, testContext, server } = await setupTest());

            await worker.initialize();

            const operations = worker.executionContext.getOperations();

            for (const op of operations) {
                // @ts-expect-error
                op.handle = jest.fn().mockRejectedValue(new Error('Bad news bears'));
            }

            server.onSliceSuccess((workerId, _msg) => {
                sliceSuccess = _msg;
            });

            server.onSliceFailure((workerId, _msg) => {
                sliceFailure = _msg;
            });

            const msgPromise = server.onceWithTimeout('worker:enqueue');

            const sliceConfig = await testContext.newSlice();

            server.onClientAvailable(() => {
                server.dispatchSlice(sliceConfig, worker.workerId);
            });

            await worker.runOnce();

            msg = await msgPromise;

            await pDelay(100);
        });

        afterEach(() => testContext.cleanup());

        it('should return send a slice completed message with an error', () => {
            expect(sliceSuccess).not.toBeObject();

            const errMsg = 'TSError: Slice failed processing, caused by TSError: Bad news bears';
            expect(sliceFailure).toBeObject();
            expect(sliceFailure.error).toStartWith(errMsg);

            expect(msg).not.toBeNil();
        });
    });

    describe('when a slice is in-progress and shutdown is called', () => {
        let workerShutdownEvent: any;
        let worker: Worker;
        let testContext: TestContext;
        let server: ExecutionController.Server;

        beforeEach(async () => {
            ({ worker, testContext, server } = await setupTest());
            await worker.initialize();

            workerShutdownEvent = jest.fn();
            worker.events.once('worker:shutdown', workerShutdownEvent);

            worker.context.sysconfig.teraslice.shutdown_timeout = 1000;
            // @ts-expect-error
            worker.shutdownTimeout = 1000;
            // @ts-expect-error
            worker.slice.run = jest.fn(async () => pDelay(500));

            const sliceConfig = await testContext.newSlice();

            server.onClientAvailable(() => {
                server.dispatchSlice(sliceConfig, worker.workerId);
            });
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should not have a shutdown err', async () => {
            const promise = server.sendExecutionFinishedToAll(testContext.exId);
            await expect(worker.shutdown()).resolves.toBeNil();
            expect(workerShutdownEvent).toHaveBeenCalled();
            await promise;
        });
    });

    describe('when a slice is in-progress and has to be forced to shutdown', () => {
        let shutdownErr: any;
        let worker: Worker;
        let testContext: TestContext;
        let server: ExecutionController.Server;

        beforeEach(async () => {
            ({ worker, testContext, server } = await setupTest());
            await worker.initialize();

            worker.context.sysconfig.teraslice.shutdown_timeout = 500;
            // @ts-expect-error
            worker.shutdownTimeout = 500;
            // @ts-expect-error
            worker.slice.run = jest.fn(() => pDelay(1000));
            const sliceConfig = await testContext.newSlice();

            server.onClientAvailable(() => {
                server.dispatchSlice(sliceConfig, worker.workerId);
            });

            let shutdown;
            worker.events.once('slice:initialize', () => {
                shutdown = worker.shutdown().catch((err) => {
                    shutdownErr = err;
                });
            });

            await worker.run();
            await shutdown;
        });

        afterEach(() => testContext.cleanup());

        it('shutdown should throw an error', () => {
            const errMsg = 'Error: Failed to shutdown correctly: Error: Worker shutdown timeout after 0.5 seconds, forcing shutdown';
            expect(shutdownErr).not.toBeNil();
            expect(shutdownErr.toString()).toStartWith(errMsg);
        });
    });

    describe('when constructed without nothing', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-expect-error
                new Worker();
            }).toThrow();
        });
    });

    describe('when testing shutdown', () => {
        let testContext: TestContext;
        let worker: Worker;

        beforeEach(async () => {
            testContext = new TestContext();

            await testContext.initialize();

            worker = new Worker(testContext.context, testContext.executionContext as any);
        });

        afterEach(() => testContext.cleanup());

        describe('when not initialized', () => {
            it('should resolve', () => expect(worker.shutdown()).resolves.toBeNil());
        });

        describe('when initialized', () => {
            beforeEach(() => {
                worker.isInitialized = true;
            });

            describe('when controller is already being shutdown', () => {
                beforeEach(() => {
                    worker.isShuttingDown = true;
                });

                it('should resolve when shutdown passes', async () => {
                    setTimeout(() => {
                        worker.events.emit('worker:shutdown:complete');
                    });
                    await expect(worker.shutdown()).resolves.toBeNil();
                });

                it('should reject when shutdown fails', async () => {
                    setTimeout(() => {
                        worker.events.emit('worker:shutdown:complete', new Error('Uh oh'));
                    });
                    await expect(worker.shutdown()).rejects.toThrow('Uh oh');
                });
            });

            describe('when everything errors', () => {
                beforeEach(() => {
                    worker._waitForSliceToFinish = () => Promise.reject(new Error('Slice Finish Error'));
                    // @ts-expect-error
                    worker.stateStorage = {
                        shutdown: () => Promise.reject(new Error('Store Error'))
                    };
                    worker.analyticsStorage = {
                        // @ts-expect-error
                        shutdown: async () => Promise.resolve(true)
                    };
                    // @ts-expect-error
                    worker.slice = {
                        flush: () => Promise.reject(new Error('Flush Error')),
                        shutdown: () => Promise.reject(new Error('Slice Error'))
                    };
                    // @ts-expect-error
                    worker.client = {
                        shutdown: () => Promise.reject(new Error('Messenger Error'))
                    };
                });

                it('should reject with all of the errors', async () => {
                    expect.hasAssertions();
                    try {
                        await worker.shutdown();
                    } catch (err) {
                        const errMsg = err.toString();
                        expect(errMsg).toStartWith('Error: Failed to shutdown correctly');
                        expect(errMsg).toInclude('Slice Finish Error');
                        expect(errMsg).toInclude('Store Error');
                        expect(errMsg).toInclude('Flush Error');
                        expect(errMsg).toInclude('Slice Error');
                        expect(errMsg).toInclude('Messenger Error');
                    }
                });
            });
        });
    });
});
