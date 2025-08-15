import { jest } from '@jest/globals';
import { pDelay, get, set } from '@terascope/utils';
import { TestContext } from '../helpers/index.js';
import { ExecutionStorage } from '../../../src/lib/storage/index.js';
import { findPort } from '../../../src/lib/utils/port_utils.js';
import { ExecutionController } from '../../../src/lib/workers/execution-controller/index.js';

describe('ExecutionController', () => {
    describe('when the execution context is invalid', () => {
        let testContext: TestContext;
        let exController: ExecutionController;
        let executionStorage!: ExecutionStorage;

        beforeEach(async () => {
            const port = await findPort();

            testContext = new TestContext({
                assignment: 'execution_controller',
                slicerPort: port,
            });

            // needs to be in this order
            await testContext.initialize(true);
            await testContext.addClusterMaster();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext as any
            );

            set(exController, 'isExecutionFinished', true);

            await testContext.addExStore();

            executionStorage = testContext.stores.executionStorage as ExecutionStorage;

            testContext.attachCleanup(() => exController.shutdown().catch(() => {
                /* ignore-error */
            }));
        });

        afterEach(() => testContext.cleanup());

        describe('when the execution does not exist', () => {
            beforeEach(async () => {
                await executionStorage.remove(testContext.exId);
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
                await executionStorage.setStatus(testContext.exId, 'running');
            });

            it('should throw an error on initialize', async () => {
                expect.hasAssertions();
                await exController.initialize();
                expect(get(exController, 'isInitialized')).toBeFalse();
                expect(get(exController, 'isShutdown')).toBeTrue();
            });
        });

        describe('when the execution is in a terminal state', () => {
            beforeEach(async () => {
                await executionStorage.setStatus(testContext.exId, 'completed');
            });

            it('should throw an error on initialize', async () => {
                expect.hasAssertions();
                await exController.initialize();
                expect(get(exController, 'isInitialized')).toBeFalse();
                expect(get(exController, 'isShutdown')).toBeTrue();
            });
        });
    });

    describe('when the slice failure watch dog is started', () => {
        let testContext: TestContext;
        let executionStorage: ExecutionStorage;
        let exController: ExecutionController;
        const probationWindow = 500;

        beforeEach(async () => {
            const port = await findPort();

            testContext = new TestContext({
                assignment: 'execution_controller',
                slicerPort: port,
                probationWindow
            });

            // needs to be in this order
            await testContext.initialize(true);
            await testContext.addClusterMaster();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext as any
            );

            await exController.initialize();

            await testContext.addExStore();
            executionStorage = testContext.stores.executionStorage as ExecutionStorage;

            testContext.attachCleanup(() => exController.shutdown().catch(() => {
                /* ignore-error */
            }));
        });

        afterEach(() => testContext.cleanup());

        it('should handle the probation period correctly', async () => {
            exController.executionAnalytics.increment('processed');
            exController.executionAnalytics.increment('failed');
            // @ts-expect-error
            expect(exController.sliceFailureInterval).toBeNil();
            // @ts-expect-error
            await exController._startSliceFailureWatchDog();
            // @ts-expect-error
            expect(exController.sliceFailureInterval).not.toBeNil();
            // @ts-expect-error
            // should be able to call slice watch again without resetting the interval
            const { sliceFailureInterval } = exController;
            // @ts-expect-error
            await exController._startSliceFailureWatchDog();
            // @ts-expect-error
            expect(exController.sliceFailureInterval).toBe(sliceFailureInterval);

            await expect(executionStorage.getStatus(testContext.exId)).resolves.toEqual('failing');

            await pDelay(probationWindow + 100);

            // should be able to setr the status back to running if more slices are processed
            exController.executionAnalytics.increment('processed');

            await pDelay(probationWindow + 100);

            await expect(executionStorage.getStatus(testContext.exId)).resolves.toEqual('running');
            // @ts-expect-error
            expect(exController.sliceFailureInterval).toBeNil();
            // @ts-expect-error
            await exController._startSliceFailureWatchDog();
            // @ts-expect-error
            expect(exController.sliceFailureInterval).not.toBeNil();
        });
    });

    describe('when testing setFailingStatus', () => {
        let testContext: TestContext;
        let exController: ExecutionController;

        beforeEach(async () => {
            testContext = new TestContext({
                assignment: 'execution_controller'
            });

            await testContext.initialize();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext as any
            );
        });

        afterEach(() => testContext.cleanup());

        describe('when it fails to set the status', () => {
            it('should log the error twice', async () => {
                const logErr = jest.fn() as any;
                // @ts-expect-error
                const setStatus = jest.fn().mockRejectedValue(new Error('Uh oh')) as any;
                const errMeta = { error: 'metadata' };
                const executionMetaData = jest.fn().mockReturnValue(errMeta) as any;
                // @ts-expect-error
                exController.executionStorage = {
                    setStatus,
                    executionMetaData
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
        let testContext: TestContext;
        let exController: ExecutionController;

        beforeEach(async () => {
            testContext = new TestContext({
                assignment: 'execution_controller'
            });

            await testContext.initialize();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext as any
            );
        });

        afterEach(() => testContext.cleanup());

        describe('when it fails to set the status', () => {
            it('should log the error twice', async () => {
                const logErr = jest.fn() as any;
                const logFatal = jest.fn() as any;
                // @ts-expect-error
                const setStatus = jest.fn().mockRejectedValue(new Error('Uh oh')) as any;
                const errMeta = { error: 'metadata' };
                const executionMetaData = jest.fn().mockReturnValue(errMeta) as any;
                // @ts-expect-error
                exController.executionStorage = {
                    setStatus,
                    executionMetaData
                };

                exController.logger.error = logErr;
                exController.logger.fatal = logFatal;

                const stats = exController.executionAnalytics.getAnalytics();
                // @ts-expect-error
                await exController._terminalError('Uh oh');
                // @ts-expect-error
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

                const logErr = jest.fn() as any;
                exController.logger.error = logErr;
                // @ts-expect-error
                await exController._terminalError();
                // @ts-expect-error
                expect(exController.slicerFailed).toBeFalsy();
                expect(logErr).not.toHaveBeenCalled();
            });
        });
    });

    describe('when testing shutdown', () => {
        let testContext: TestContext;
        let exController: ExecutionController;

        beforeEach(async () => {
            testContext = new TestContext({
                assignment: 'execution_controller',
                shutdownTimeout: 100
            });

            await testContext.initialize();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext as any
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
                // @ts-expect-error
                exController.isInitialized = true;
            });

            describe('when controller is already being shutdown', () => {
                beforeEach(() => {
                    // @ts-expect-error
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
                    await expect(exController.shutdown()).rejects.toThrow('Uh oh');
                });
            });

            describe('when everything errors', () => {
                beforeEach(() => {
                    // @ts-expect-error
                    exController.isExecutionFinished = true;
                    exController.stateStorage = {
                        // @ts-expect-error
                        shutdown: () => Promise.resolve(true)
                    };
                    // @ts-expect-error
                    exController.executionStorage = {
                        shutdown: () => Promise.reject(new Error('Store Error'))
                    };
                    // @ts-expect-error
                    exController.executionAnalytics = {
                        shutdown: () => Promise.reject(new Error('Execution Analytics Error'))
                    };
                    // @ts-expect-error
                    exController.collectAnalytics = true;
                    // @ts-expect-error
                    exController.slicerAnalytics = {
                        shutdown: () => Promise.reject(new Error('Slicer Analytics Error'))
                    };
                    // @ts-expect-error
                    exController.scheduler = {
                        stop: () => {},
                        shutdown: () => Promise.reject(new Error('Scheduler Error'))
                    };
                    // @ts-expect-error
                    exController.server = {
                        shutdown: () => Promise.reject(new Error('Execution Controller Server Error'))
                    };
                    // @ts-expect-error
                    exController.client = {
                        shutdown: () => Promise.reject(new Error('Cluster Master Client Error'))
                    };
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

    describe('when testing log_level', () => {
        beforeAll(() => {
            process.env.TESTING_LOG_LEVEL = 'true';
            return;
        });

        describe('when there is no log_level set in either job configuration or terafoundation', () => {
            let testContext: TestContext;
            let exController: ExecutionController;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    shutdownTimeout: 100
                });

                await testContext.initialize();

                exController = new ExecutionController(
                    testContext.context,
                    testContext.executionContext as any
                );

                testContext.attachCleanup(() => exController.shutdown().catch(() => {
                    /* ignore-error */
                }));
            });

            it('should have a logger with log_level info', async () => {
                expect(exController.executionContext.context.logger.level()).toBe(30);
            });

            afterEach(() => testContext.cleanup());
        });

        describe('when no log_level is set in job configuration and terafoundation log level is error', () => {
            let testContext: TestContext;
            let exController: ExecutionController;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    shutdownTimeout: 100,
                    log_level_terafoundation: 'error'
                });

                await testContext.initialize();

                exController = new ExecutionController(
                    testContext.context,
                    testContext.executionContext as any
                );

                testContext.attachCleanup(() => exController.shutdown().catch(() => {
                    /* ignore-error */
                }));
            });

            it('should have a logger with log_level error', async () => {
                expect(exController.executionContext.context.logger.level()).toBe(50);
            });

            afterEach(() => testContext.cleanup());
        });

        describe('when log_level set to trace in job configuration and terafoundation is set to error', () => {
            let testContext: TestContext;
            let exController: ExecutionController;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    shutdownTimeout: 100,
                    log_level: 'trace',
                    log_level_terafoundation: 'error'
                });

                await testContext.initialize();

                exController = new ExecutionController(
                    testContext.context,
                    testContext.executionContext as any
                );

                testContext.attachCleanup(() => exController.shutdown().catch(() => {
                    /* ignore-error */
                }));
            });

            it('should have a logger with log_level trace', async () => {
                expect(exController.executionContext.context.logger.level()).toBe(10);
            });

            afterEach(() => testContext.cleanup());
        });

        afterAll(() => {
            process.env.TESTING_LOG_LEVEL = 'false';
            return;
        });
    });
});
