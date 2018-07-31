'use strict';

/* eslint-disable no-console */

const _ = require('lodash');
const { EventEmitter } = require('events');
const { Worker } = require('../../..');
const ExecutionControllerMessenger = require('../../../lib/execution-controller/messenger');
const {
    TestContext,
    findPort,
} = require('../../helpers');

describe('Worker', () => {
    async function setupTest(options = {}) {
        const slicerPort = await findPort();
        options.slicerPort = slicerPort;

        options.useExecutionRunner = _.sample([true, false]);

        const testContext = new TestContext(options);
        await testContext.initialize();

        const exMessenger = new ExecutionControllerMessenger({
            port: slicerPort,
            networkLatencyBuffer: 0,
            actionTimeout: 1000,
            events: new EventEmitter()
        });

        testContext.attachCleanup(() => {
            exMessenger.events.removeAllListeners();
            return exMessenger.shutdown();
        });

        await exMessenger.start();

        const worker = new Worker(
            testContext.context,
            testContext.executionContext,
        );

        testContext.attachCleanup(() => worker.shutdown());

        return { exMessenger, worker, testContext };
    }

    beforeAll(() => TestContext.cleanupAll(true));

    describe('when running forever', () => {
        let sliceConfig;
        let worker;
        let testContext;
        let exMessenger;
        let sliceSuccess;
        let sliceFailure;

        beforeEach(async () => {
            ({ worker, testContext, exMessenger } = await setupTest());

            await worker.initialize();

            const workerStart = worker.run();

            sliceConfig = await testContext.newSlice();

            exMessenger.events.once('slice:success', (_msg) => {
                sliceSuccess = _msg;
                worker.events.emit('worker:shutdown');
            });

            exMessenger.events.once('slice:failure', (_msg) => {
                sliceFailure = _msg;
                worker.events.emit('worker:shutdown');
            });

            await exMessenger.sendNewSlice(
                worker.workerId,
                sliceConfig
            );

            await workerStart;
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should complete the slice', () => {
            expect(sliceSuccess).toMatchObject({
                worker_id: worker.workerId,
                slice: sliceConfig,
            });

            expect(sliceFailure).toBeNil();
        });
    });

    describe('when a slice is sent from the execution controller', () => {
        let sliceConfig;
        let worker;
        let testContext;
        let exMessenger;
        let sliceSuccess;
        let sliceFailure;

        beforeEach(async () => {
            ({ worker, testContext, exMessenger } = await setupTest());

            await worker.initialize();

            const workerStart = worker.runOnce();

            sliceConfig = await testContext.newSlice();

            exMessenger.events.once('slice:success', (_msg) => {
                sliceSuccess = _msg;
            });

            exMessenger.events.once('slice:failure', (_msg) => {
                sliceFailure = _msg;
            });

            await exMessenger.sendNewSlice(
                worker.workerId,
                sliceConfig
            );

            await workerStart;
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should complete the slice', () => {
            expect(sliceSuccess).toMatchObject({
                worker_id: worker.workerId,
                slice: sliceConfig,
            });

            expect(sliceFailure).toBeNil();
        });
    });

    describe('when a new slice is not sent right away', () => {
        let msg;
        let sliceConfig;
        let worker;
        let testContext;
        let exMessenger;
        let sliceFailure;
        let sliceSuccess;

        beforeEach(async () => {
            ({ worker, testContext, exMessenger } = await setupTest());
            await worker.initialize();


            exMessenger.events.once('slice:success', (_msg) => {
                sliceSuccess = _msg;
            });

            exMessenger.events.once('slice:failure', (_msg) => {
                sliceFailure = _msg;
            });

            exMessenger.once('worker:enqueue', (_msg) => {
                msg = _msg;
            });

            const workerStart = worker.runOnce();

            await Promise.delay(500);
            sliceConfig = await testContext.newSlice();

            await exMessenger.sendNewSlice(
                worker.workerId,
                sliceConfig
            );

            await workerStart;

            await Promise.delay(100);
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should re-enqueue the worker after receiving the slice complete message', () => {
            expect(msg).toMatchObject({
                worker_id: worker.workerId,
            });
            expect(sliceSuccess).toMatchObject({
                worker_id: worker.workerId,
                slice: sliceConfig,
            });
            expect(sliceFailure).toBeNil();
        });
    });

    describe('when a slice errors', () => {
        let worker;
        let testContext;
        let exMessenger;
        let sliceFailure;
        let sliceSuccess;
        let msg;

        beforeEach(async () => {
            ({ worker, testContext, exMessenger } = await setupTest());

            await worker.initialize();

            worker.executionContext.queue[1] = jest.fn().mockRejectedValue(new Error('Bad news bears'));

            exMessenger.events.once('slice:success', (_msg) => {
                sliceSuccess = _msg;
            });

            exMessenger.events.once('slice:failure', (_msg) => {
                sliceFailure = _msg;
            });

            exMessenger.once('worker:enqueue', (_msg) => {
                msg = _msg;
            });

            const sliceConfig = await testContext.newSlice();

            exMessenger.sendNewSlice(
                worker.workerId,
                sliceConfig
            ).catch((_err) => {
                expect(_err).not.toBeNil();
            });

            await worker.runOnce();

            await Promise.delay(100);
        });

        afterEach(() => testContext.cleanup());

        it('should return send a slice completed message with an error', () => {
            expect(sliceSuccess).not.toBeObject();

            const errMsg = 'Error: Slice failed processing, caused by Error: Bad news bears';
            expect(sliceFailure).toBeObject();
            expect(sliceFailure.error).toStartWith(errMsg);

            expect(msg).not.toBeNil();
        });
    });

    describe('when a slice is in-progress and shutdown is called', () => {
        let workerShutdownEvent;
        let shutdownErr;
        let worker;
        let testContext;
        let exMessenger;

        beforeEach(async () => {
            ({ worker, testContext, exMessenger } = await setupTest());
            await worker.initialize();

            workerShutdownEvent = jest.fn();
            worker.events.on('worker:shutdown', workerShutdownEvent);

            worker.shutdownTimeout = 1000;
            worker.slice.run = jest.fn(() => Promise.delay(500));

            const workerStart = worker.runOnce();
            const sliceConfig = await testContext.newSlice();

            await exMessenger.sendNewSlice(
                worker.workerId,
                sliceConfig
            );

            try {
                await worker.shutdown();
            } catch (err) {
                shutdownErr = err;
            }

            await workerStart;
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should not have a shutdown err', () => {
            expect(shutdownErr).toBeNil();
            expect(workerShutdownEvent).toHaveBeenCalled();
        });
    });

    describe('when a slice is in-progress and has to be forced to shutdown', () => {
        let shutdownErr;
        let worker;
        let testContext;
        let exMessenger;

        beforeEach(async () => {
            ({ worker, testContext, exMessenger } = await setupTest());
            await worker.initialize();

            worker.shutdownTimeout = 500;

            worker.slice.run = jest.fn(() => Promise.delay(1000));
            const sliceConfig = await testContext.newSlice();
            const runOnce = worker.runOnce();

            await exMessenger.sendNewSlice(
                worker.workerId,
                sliceConfig
            );

            await Promise.delay(100);

            try {
                await worker.shutdown();
                await runOnce;
            } catch (err) {
                shutdownErr = err;
            }
        });

        afterEach(() => testContext.cleanup());

        it('shutdown should throw an error', () => {
            const errMsg = 'Error: Failed to shutdown correctly: Error: Worker shutdown timeout after 0.5 seconds, forcing shutdown';
            expect(shutdownErr.toString()).toStartWith(errMsg);
        });
    });

    describe('when constructed without nothing', () => {
        it('should throw an error', () => {
            expect(() => {
                new Worker() // eslint-disable-line
            }).toThrow();
        });
    });

    describe('when testing shutdown', () => {
        let testContext;
        let worker;

        beforeEach(async () => {
            testContext = new TestContext();

            await testContext.initialize();

            worker = new Worker(testContext.context, testContext.executionContext);
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

                it('should resolve', () => expect(worker.shutdown()).resolves.toBeNil());
            });

            describe('when everything errors', () => {
                beforeEach(() => {
                    worker._waitForSliceToFinish = () => Promise.reject(new Error('Slice Finish Error'));

                    worker.stores = {};
                    worker.stores.someStore = {
                        shutdown: () => Promise.reject(new Error('Store Error'))
                    };

                    worker.slice = {};
                    worker.slice.shutdown = () => Promise.reject(new Error('Slice Error'));

                    worker.messenger = {};
                    worker.messenger.shutdown = () => Promise.reject(new Error('Messenger Error'));
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
                        expect(errMsg).toInclude('Slice Error');
                        expect(errMsg).toInclude('Messenger Error');
                    }
                });
            });
        });
    });
});
