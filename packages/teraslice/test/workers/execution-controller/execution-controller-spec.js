'use strict';

const Promise = require('bluebird');
const { TestContext } = require('../helpers');
const { findPort } = require('../../../lib/utils/port_utils');
const ExecutionController = require('../../../lib/workers/execution-controller');

process.env.BLUEBIRD_LONG_STACK_TRACES = '1';

describe('ExecutionController', () => {
    describe('when the execution context is invalid', () => {
        let testContext;
        let exController;
        let exStore;

        beforeEach(async () => {
            const port = await findPort();

            testContext = new TestContext({
                assignment: 'execution_controller',
                slicerPort: port,
            });

            await testContext.initialize(true);
            await testContext.addClusterMaster();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext,
            );

            exController.isExecutionFinished = true;

            await testContext.addExStore();
            ({ exStore } = testContext.stores);

            testContext.attachCleanup(() => exController.shutdown()
                .catch(() => { /* ignore-error */ }));
        });

        afterEach(() => testContext.cleanup());

        describe('when the execution does not exist', () => {
            beforeEach(async () => {
                await exStore.remove(testContext.exId);
            });

            it('should throw an error on initialize', async () => {
                expect.hasAssertions();
                try {
                    await exController.initialize();
                } catch (err) {
                    expect(err.message).toStartWith(`Cannot get execution status ${testContext.exId}, caused by invoking elasticsearch-api _runRequest resulted in a runtime error: Not Found`);
                }
            });
        });

        describe('when the execution is set to running', () => {
            beforeEach(async () => {
                await exStore.setStatus(testContext.exId, 'running');
            });

            it('should throw an error on initialize', async () => {
                expect.hasAssertions();
                await exController.initialize();
                expect(exController.isInitialized).toBeFalse();
                expect(exController.isShutdown).toBeTrue();
            });
        });

        describe('when the execution is in a terminal state', () => {
            beforeEach(async () => {
                await exStore.setStatus(testContext.exId, 'completed');
            });

            it('should throw an error on initialize', async () => {
                expect.hasAssertions();
                await exController.initialize();
                expect(exController.isInitialized).toBeFalse();
                expect(exController.isShutdown).toBeTrue();
            });
        });
    });

    describe('when the slice failure watch dog is started', () => {
        let testContext;
        let exStore;
        let exController;
        const probationWindow = 1000;

        beforeEach(async () => {
            const port = await findPort();

            testContext = new TestContext({
                assignment: 'execution_controller',
                slicerPort: port,
                probationWindow
            });

            await testContext.initialize(true);
            await testContext.addClusterMaster();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext,
            );

            await exController.initialize();

            await testContext.addExStore();
            ({ exStore } = testContext.stores);

            testContext.attachCleanup(() => exController.shutdown()
                .catch(() => { /* ignore-error */ }));
        });

        afterEach(() => testContext.cleanup());

        it('should handle the probation period correctly', async () => {
            exController.executionAnalytics.increment('processed');
            exController.executionAnalytics.increment('failed');

            expect(exController.sliceFailureInterval).toBeNil();
            await exController._startSliceFailureWatchDog();

            expect(exController.sliceFailureInterval).not.toBeNil();

            // should be able to call slice watch again without resetting the interval
            const { sliceFailureInterval } = exController;

            await exController._startSliceFailureWatchDog();
            expect(exController.sliceFailureInterval).toBe(sliceFailureInterval);

            await expect(exStore.getStatus(testContext.exId))
                .resolves.toEqual('failing');

            // should be able to setr the status back to running if more slices are processed
            exController.executionAnalytics.increment('processed');

            await Promise.delay(probationWindow);

            await expect(exStore.getStatus(testContext.exId))
                .resolves.toEqual('running');
        });
    });

    describe('when testing shutdown', () => {
        let testContext;
        let exController;

        beforeEach(async () => {
            testContext = new TestContext({
                assignment: 'execution_controller',
                shutdownTimeout: 100
            });

            await testContext.initialize();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext
            );

            testContext.attachCleanup(() => exController.shutdown()
                .catch(() => { /* ignore-error */ }));
        });

        afterEach(() => testContext.cleanup());

        describe('when not initialized', () => {
            it('should resolve', () => expect(exController.shutdown()).resolves.toBeNil());
        });

        describe('when initialized', () => {
            beforeEach(() => {
                exController.isInitialized = true;
            });

            describe('when controller is already being shutdown', () => {
                beforeEach(() => {
                    exController.isShuttingDown = true;
                });

                it('should resolve when shutdown passes', async () => {
                    setImmediate(() => {
                        exController.events.emit('worker:shutdown:complete');
                    });
                    await expect(exController.shutdown()).resolves.toBeNil();
                });

                it('should reject when shutdown fails', async () => {
                    setImmediate(() => {
                        exController.events.emit('worker:shutdown:complete', new Error('Uh oh'));
                    });
                    await expect(exController.shutdown()).rejects.toThrowError('Uh oh');
                });
            });

            describe('when everything errors', () => {
                beforeEach(() => {
                    exController.isExecutionFinished = true;

                    exController.stores = {};
                    exController.stores.someStore = {
                        shutdown: () => Promise.reject(new Error('Store Error'))
                    };

                    exController.executionAnalytics = {};
                    exController.executionAnalytics.shutdown = () => Promise.reject(new Error('Execution Analytics Error'));

                    exController.collectAnalytics = true;
                    exController.slicerAnalytics = {};
                    exController.slicerAnalytics.shutdown = () => Promise.reject(new Error('Slicer Analytics Error'));

                    exController.scheduler = {};
                    exController.scheduler.stop = () => {};
                    exController.scheduler.shutdown = () => Promise.reject(new Error('Scheduler Error'));

                    exController.server = {};
                    exController.server.shutdown = () => Promise.reject(new Error('Execution Controller Server Error'));

                    exController.client = {};
                    exController.client.shutdown = () => Promise.reject(new Error('Cluster Master Client Error'));
                });

                it('should reject with all of the errors', async () => {
                    expect.hasAssertions();
                    try {
                        await exController.shutdown();
                    } catch (err) {
                        const errMsg = err.toString();
                        expect(errMsg).toStartWith('Error: Failed to shutdown correctly');
                        expect(errMsg).toInclude('Store Error');
                        expect(errMsg).toInclude('Execution Analytics Error');
                        expect(errMsg).toInclude('Slicer Analytics Error');
                        expect(errMsg).toInclude('Scheduler Error');
                        expect(errMsg).toInclude('Execution Controller Server Error');
                        expect(errMsg).toInclude('Cluster Master Client Error');
                    }
                });
            });
        });
    });
});
