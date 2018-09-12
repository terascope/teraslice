'use strict';

const Promise = require('bluebird');
const { TestContext, findPort } = require('../helpers');
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

    describe('when testing shutdown', () => {
        let testContext;
        let exController;

        beforeEach(async () => {
            testContext = new TestContext({
                assignment: 'execution_controller',
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

                    exController.recover = {};
                    exController.recover.shutdown = () => Promise.reject(new Error('Recover Error'));

                    exController.executionAnalytics = {};
                    exController.executionAnalytics.shutdown = () => Promise.reject(new Error('Execution Analytics Error'));

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
                        expect(errMsg).toInclude('Recover Error');
                        expect(errMsg).toInclude('Execution Analytics Error');
                        expect(errMsg).toInclude('Execution Controller Server Error');
                        expect(errMsg).toInclude('Cluster Master Client Error');
                    }
                });
            });
        });
    });
});
