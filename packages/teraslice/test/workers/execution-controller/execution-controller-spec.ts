import { jest } from '@jest/globals';
import { pDelay, get, set } from '@terascope/core-utils';
import { TestContext } from '../helpers/index.js';
import { ExecutionStorage } from '../../../src/lib/storage/index.js';
import { findPort } from '../../../src/lib/utils/port_utils.js';
import { ExecutionController } from '../../../src/lib/workers/execution-controller/index.js';

describe('ExecutionController', () => {
    describe('when the execution context is invalid', () => {
        let testContext: TestContext;
        let exController: ExecutionController;
        let executionStorage!: ExecutionStorage;
        const shutdownTimeout = 4000;

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

            testContext.attachCleanup(
                () => exController.shutdown(Date.now() + shutdownTimeout).catch(() => {
                    /* ignore-error */
                })
            );
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
        const shutdownTimeout = 4000;

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

            testContext.attachCleanup(
                () => exController.shutdown(Date.now() + shutdownTimeout).catch(() => {
                    /* ignore-error */
                })
            );
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
                const errMsg = `TSError: slicer for ex ${testContext.exId} had an error, shutting down execution, caused by Uh oh`;
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
        const shutdownTimeout = 100;

        beforeEach(async () => {
            testContext = new TestContext({
                assignment: 'execution_controller',
                shutdownTimeout
            });

            await testContext.initialize();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext as any
            );

            testContext.attachCleanup(
                () => exController.shutdown(Date.now() + shutdownTimeout).catch(() => {
                    /* ignore-error */
                })
            );
        });

        afterEach(() => testContext.cleanup());

        describe('when not initialized', () => {
            it('should resolve', () => expect(exController.shutdown(Date.now() + shutdownTimeout)).resolves.toBeNil());
        });

        describe('when initialized', () => {
            beforeEach(() => {
                // @ts-expect-error
                exController.isInitialized = true;
            });

            describe('when controller is already being shutdown', () => {
                beforeEach(() => {
                    // @ts-expect-error
                    exController.shutdownDeadline = Date.now() + shutdownTimeout;
                });

                it('should resolve when shutdown passes', async () => {
                    setTimeout(() => {
                        exController.events.emit('worker:shutdown:complete');
                    });
                    await expect(exController.shutdown(Date.now() + shutdownTimeout))
                        .resolves.toBeNil();
                });

                it('should reject when shutdown fails', async () => {
                    setTimeout(() => {
                        exController.events.emit('worker:shutdown:complete', new Error('Uh oh'));
                    });
                    await expect(exController.shutdown(Date.now() + shutdownTimeout)).rejects.toThrow('Uh oh');
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
                        stop: () => { },
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
                        await exController.shutdown(Date.now() + shutdownTimeout);
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

            describe('when kubernetesV2 receives SIGTERM', () => {
                let getStatus: jest.Mock<(exId: string) => Promise<string>>;
                let updatePartial: jest.Mock<() => Promise<void>>;
                let refresh: jest.Mock<() => Promise<void>>;
                let stop: jest.Mock<() => void>;
                let logErr: jest.Mock<(...args: any[]) => void>;

                beforeEach(() => {
                    testContext.context.sysconfig.teraslice.cluster_manager_type = 'kubernetesV2';

                    getStatus = jest.fn(async () => 'stopping');
                    updatePartial = jest.fn(async () => {});
                    refresh = jest.fn(async () => {});
                    stop = jest.fn(() => {});
                    logErr = jest.fn();
                    exController.logger.error = logErr as any;

                    const ec = exController as any;
                    ec.isStarted = true;
                    ec.stateStorage = {
                        refresh,
                        shutdown: () => Promise.resolve(true)
                    };
                    ec.executionStorage = {
                        getStatus,
                        updatePartial,
                        getRunningStatuses: () => ['initializing', 'running', 'failing', 'paused', 'stopping'],
                        executionMetaData: () => ({}),
                        shutdown: () => Promise.resolve()
                    };
                    ec.executionAnalytics = {
                        set: () => {},
                        getAnalytics: () => ({}),
                        shutdown: () => Promise.resolve()
                    };
                    ec.scheduler = {
                        stop,
                        shutdown: () => Promise.resolve()
                    };
                    ec.server = {
                        shutdown: () => Promise.resolve()
                    };
                    // not ready, so the main phase doesn't wait for the execution
                    ec.client = {
                        ready: false,
                        shutdown: () => Promise.resolve()
                    };
                });

                it('should skip the shutdown when the execution is relocating', async () => {
                    getStatus.mockResolvedValue('running');

                    await exController.shutdown(Date.now() + 5000, 'SIGTERM');

                    expect(stop).not.toHaveBeenCalled();
                    expect(refresh).not.toHaveBeenCalled();
                });

                it('should cap a slow status read and continue the shutdown', async () => {
                    getStatus.mockImplementation(() => new Promise(() => {}));

                    const start = Date.now();
                    await exController.shutdown(Date.now() + 5000, 'SIGTERM');

                    // the cap is 10% of the time left, 500ms here
                    expect(stop).toHaveBeenCalled();
                    expect(Date.now() - start).toBeLessThan(1500);
                    expect(logErr).toHaveBeenCalledWith(
                        expect.stringContaining(`unable to read the status of execution ${testContext.exId}`)
                    );
                    expect(refresh).not.toHaveBeenCalled();
                });

                it('should reuse the status and wait for a slow final stats write', async () => {
                    let writtenAt = 0;
                    updatePartial.mockImplementation(async () => {
                        await pDelay(300);
                        writtenAt = Date.now();
                    });
                    // stopping the scheduler ends run(), which finishes the execution
                    stop.mockImplementation(() => {
                        exController._finishExecution();
                    });

                    await exController.shutdown(Date.now() + 2000, 'SIGTERM');
                    const shutdownAt = Date.now();

                    expect(getStatus).toHaveBeenCalledTimes(1);
                    // only _finishExecution refreshes, not the relocation check
                    expect(refresh).toHaveBeenCalledTimes(1);
                    expect(updatePartial).toHaveBeenCalledTimes(1);
                    expect(writtenAt).toBeGreaterThan(0);
                    expect(writtenAt).toBeLessThanOrEqual(shutdownAt);
                    expect(logErr).not.toHaveBeenCalledWith(
                        expect.stringContaining('final status and stats were not written')
                    );
                });

                it('should cap a slow state index refresh and still write the final stats', async () => {
                    refresh.mockImplementation(() => new Promise(() => {}));
                    const logWarn = jest.fn();
                    exController.logger.warn = logWarn as any;
                    stop.mockImplementation(() => {
                        exController._finishExecution();
                    });

                    const start = Date.now();
                    await exController.shutdown(Date.now() + 5000, 'SIGTERM');

                    // the cap is 10% of the time left, under 500ms here
                    expect(Date.now() - start).toBeLessThan(1500);
                    expect(updatePartial).toHaveBeenCalledTimes(1);
                    expect(logWarn).toHaveBeenCalledWith(
                        expect.stringContaining('state index refresh did not finish within')
                    );
                    expect(logErr).not.toHaveBeenCalledWith(
                        expect.stringContaining('final status and stats were not written')
                    );
                });

                it('should log a final stats write that misses the deadline', async () => {
                    updatePartial.mockImplementation(() => new Promise(() => {}));
                    stop.mockImplementation(() => {
                        exController._finishExecution();
                    });

                    const start = Date.now();
                    await exController.shutdown(Date.now() + 1000, 'SIGTERM');

                    expect(Date.now() - start).toBeLessThan(2000);
                    expect(logErr).toHaveBeenCalledWith(
                        `execution ${testContext.exId} final status and stats were not written before shutdown`
                    );
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
            const shutdownTimeout = 100;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    shutdownTimeout
                });

                await testContext.initialize();

                exController = new ExecutionController(
                    testContext.context,
                    testContext.executionContext as any
                );

                testContext.attachCleanup(
                    () => exController.shutdown(Date.now() + shutdownTimeout).catch(() => {
                        /* ignore-error */
                    })
                );
            });

            it('should have a logger with log_level info', async () => {
                expect(exController.executionContext.context.logger.level()).toBe(30);
            });

            afterEach(() => testContext.cleanup());
        });

        describe('when no log_level is set in job configuration and terafoundation log level is error', () => {
            let testContext: TestContext;
            let exController: ExecutionController;
            const shutdownTimeout = 100;

            beforeEach(async () => {
                testContext = new TestContext({
                    assignment: 'execution_controller',
                    shutdownTimeout,
                    log_level_terafoundation: 'error'
                });

                await testContext.initialize();

                exController = new ExecutionController(
                    testContext.context,
                    testContext.executionContext as any
                );

                testContext.attachCleanup(
                    () => exController.shutdown(Date.now() + shutdownTimeout).catch(() => {
                        /* ignore-error */
                    })
                );
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

                testContext.attachCleanup(
                    () => exController.shutdown(
                        Date.now() + testContext.sysconfig.teraslice.shutdown_timeout
                    ).catch(() => {
                        /* ignore-error */
                    })
                );
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
