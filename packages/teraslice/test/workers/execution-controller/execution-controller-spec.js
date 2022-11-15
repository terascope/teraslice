import { pDelay } from '@terascope/utils';
import { TestContext } from '../helpers.js';
import { findPort } from '../../../lib/utils/port_utils.js';
import ExecutionController from '../../../lib/workers/execution-controller.js';

describe('ExecutionController', () => {
    describe('when the execution context is invalid', () => {
        let testContext;
        let exController;
        let exStore;

        beforeEach(async () => {
            await TestContext.cleanupAll(true);
            await TestContext.waitForCleanup();

            const port = await findPort();

            testContext = new TestContext({
                assignment: 'execution_controller',
                slicerPort: port
            });

            await testContext.initialize(true);
            await testContext.addClusterMaster();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext
            );

            exController.isExecutionFinished = true;

            await testContext.addExStore();
            ({ exStore } = testContext.stores);

            testContext.attachCleanup(() => exController.shutdown().catch(() => {
                /* ignore-error */
            }));
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
                    expect(err.message).toStartWith(
                        `Cannot get execution status ${testContext.exId}`
                    );
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
        const probationWindow = 500;

        beforeEach(async () => {
            await TestContext.waitForCleanup();
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
                testContext.executionContext
            );

            await exController.initialize();

            await testContext.addExStore();
            ({ exStore } = testContext.stores);

            testContext.attachCleanup(() => exController.shutdown().catch(() => {
                /* ignore-error */
            }));
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

            await expect(exStore.getStatus(testContext.exId)).resolves.toEqual('failing');

            await pDelay(probationWindow + 100);

            // should be able to setr the status back to running if more slices are processed
            exController.executionAnalytics.increment('processed');

            await pDelay(probationWindow + 100);

            await expect(exStore.getStatus(testContext.exId)).resolves.toEqual('running');

            expect(exController.sliceFailureInterval).toBeNil();

            await exController._startSliceFailureWatchDog();
            expect(exController.sliceFailureInterval).not.toBeNil();
        });
    });

    describe('when testing setFailingStatus', () => {
        let testContext;
        let exController;

        beforeEach(async () => {
            await TestContext.waitForCleanup();

            testContext = new TestContext({
                assignment: 'execution_controller'
            });

            await testContext.initialize();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext
            );
        });

        afterEach(() => testContext.cleanup());

        describe('when it fails to set the status', () => {
            it('should log the error twice', async () => {
                const logErr = jest.fn();
                const setStatus = jest.fn().mockRejectedValue(new Error('Uh oh'));
                const errMeta = { error: 'metadata' };
                const executionMetaData = jest.fn().mockReturnValue(errMeta);

                exController.stores = {
                    exStore: {
                        setStatus,
                        executionMetaData
                    }
                };
                exController.logger.error = logErr;

                const stats = exController.executionAnalytics.getAnalytics();
                await exController.setFailingStatus('some reason');

                expect(setStatus).toHaveBeenCalledWith(testContext.exId, 'failing', errMeta);
                expect(executionMetaData).toHaveBeenCalledWith(
                    stats,
                    `execution ${testContext.exId} has encountered a processing error, reason: some reason`
                );
                expect(logErr).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('when testing _terminalError', () => {
        let testContext;
        let exController;

        beforeEach(async () => {
            await TestContext.waitForCleanup();

            testContext = new TestContext({
                assignment: 'execution_controller'
            });

            await testContext.initialize();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext
            );
        });

        afterEach(() => testContext.cleanup());

        describe('when it fails to set the status', () => {
            it('should log the error twice', async () => {
                const logErr = jest.fn();
                const logFatal = jest.fn();
                const setStatus = jest.fn().mockRejectedValue(new Error('Uh oh'));
                const errMeta = { error: 'metadata' };
                const executionMetaData = jest.fn().mockReturnValue(errMeta);

                exController.stores = {
                    exStore: {
                        setStatus,
                        executionMetaData
                    }
                };
                exController.logger.error = logErr;
                exController.logger.fatal = logFatal;

                const stats = exController.executionAnalytics.getAnalytics();
                await exController._terminalError('Uh oh');
                expect(exController.slicerFailed).toBeTrue();

                expect(setStatus).toHaveBeenCalledWith(testContext.exId, 'failed', errMeta);
                const errMsg = `TSError: slicer for ex ${
                    testContext.exId
                } had an error, shutting down execution, caused by Uh oh`;
                expect(executionMetaData.mock.calls[0][0]).toEqual(stats);
                expect(executionMetaData.mock.calls[0][1]).toStartWith(errMsg);

                expect(logErr).toHaveBeenCalledTimes(2);
                expect(logFatal).toHaveBeenCalledWith(
                    `execution ${testContext.exId} is ended because of slice failure`
                );
            });
        });

        describe('when the execution is already done', () => {
            it('should not do anything', async () => {
                exController.isExecutionDone = true;

                const logErr = jest.fn();
                exController.logger.error = logErr;

                await exController._terminalError();

                expect(exController.slicerFailed).toBeFalsy();
                expect(logErr).not.toHaveBeenCalled();
            });
        });
    });

    describe('when testing shutdown', () => {
        let testContext;
        let exController;

        beforeEach(async () => {
            await TestContext.waitForCleanup();

            testContext = new TestContext({
                assignment: 'execution_controller',
                shutdownTimeout: 100
            });

            await testContext.initialize();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext
            );

            testContext.attachCleanup(() => exController.shutdown().catch(() => {
                /* ignore-error */
            }));
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
                    setTimeout(() => {
                        exController.events.emit('worker:shutdown:complete');
                    });
                    await expect(exController.shutdown()).resolves.toBeNil();
                });

                it('should reject when shutdown fails', async () => {
                    setTimeout(() => {
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
