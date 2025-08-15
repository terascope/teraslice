import { jest } from '@jest/globals';
import { times } from '@terascope/utils';
import { SliceExecution } from '../../../src/lib/workers/worker/slice.js';
import { TestContext } from '../helpers/index.js';

describe('Slice', () => {
    async function setupSlice(
        testContext: any,
        eventMocks: Record<string, jest.Mock> = {}
    ): Promise<SliceExecution> {
        await testContext.initialize();
        await testContext.executionContext.initialize();

        const [stateStore, analyticsStore] = await Promise.all([
            testContext.addStateStore(),
            testContext.addAnalyticsStore(),
        ]);

        const slice = new SliceExecution(
            testContext.context,
            testContext.executionContext,
            stateStore,
            analyticsStore
        );

        testContext.attachCleanup(() => slice.shutdown());

        const sliceConfig = await testContext.newSlice();

        await slice.initialize(sliceConfig);

        eventMocks['slice:success'] = jest.fn();
        eventMocks['slice:finalize'] = jest.fn();
        eventMocks['slice:failure'] = jest.fn();
        eventMocks['slice:retry'] = jest.fn();

        Object.keys(eventMocks).forEach((name) => {
            const mock = eventMocks[name];
            slice.events.on(name, mock);
        });

        return slice;
    }

    describe('with analytics', () => {
        describe('when the slice succeeds', () => {
            let slice: SliceExecution;
            let results: any;
            let testContext: any;
            const eventMocks: Record<string, jest.Mock> = {};

            beforeEach(async () => {
                testContext = new TestContext({ analytics: true });
                slice = await setupSlice(testContext, eventMocks);

                results = await slice.run();

                await Promise.all([
                    slice.stateStorage.refresh(),
                    slice.analyticsStorage.refresh(),
                ]);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                // should call of the operations
                expect(results).toEqual(times(10, () => ({ hi: true })));

                // should have the correct analytics data
                expect(slice.analyticsData).toBeObject();
                expect(slice.analyticsData.memory).toBeArrayOfSize(2);
                expect(slice.analyticsData.size).toBeArrayOfSize(2);
                expect(slice.analyticsData.time).toBeArrayOfSize(2);

                // should call the correct events
                expect(eventMocks['slice:success']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:success']).toHaveBeenCalled();
                expect(eventMocks['slice:finalize']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:finalize']).toHaveBeenCalled();
                expect(eventMocks['slice:failure']).not.toHaveBeenCalled();
                expect(eventMocks['slice:retry']).not.toHaveBeenCalled();

                // should have the correct state storage
                const { exId } = slice.executionContext;
                const query = `ex_id:${exId} AND state:completed`;
                return expect(slice.stateStorage.count(query)).resolves.toEqual(1);
            });
        });
    });

    describe('without analytics', () => {
        describe('when the slice succeeds', () => {
            let slice: SliceExecution;
            let results: any;
            let testContext: any;
            const eventMocks: Record<string, jest.Mock> = {};

            beforeEach(async () => {
                testContext = new TestContext({ analytics: false });
                slice = await setupSlice(testContext, eventMocks);

                results = await slice.run();
                await Promise.all([
                    slice.stateStorage.refresh(),
                    slice.analyticsStorage.refresh(),
                ]);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                // should call all of the operations
                expect(results).toEqual(times(10, () => ({ hi: true })));

                // should have have the analytics data
                expect(slice.analyticsData).toBeUndefined();

                // should call the correct events
                expect(eventMocks['slice:success']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:success']).toHaveBeenCalled();
                expect(eventMocks['slice:finalize']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:finalize']).toHaveBeenCalled();
                expect(eventMocks['slice:retry']).not.toHaveBeenCalled();
                expect(eventMocks['slice:failure']).not.toHaveBeenCalled();

                // should have the correct state storage
                const { exId } = slice.executionContext;
                const query = `ex_id:${exId} AND state:completed`;
                return expect(slice.stateStorage.count(query, 0)).resolves.toEqual(1);
            });
        });

        describe('when the slice retries', () => {
            let slice: SliceExecution;
            let results: any;
            let testContext: any;
            const eventMocks: Record<string, jest.Mock> = {};

            beforeEach(async () => {
                testContext = new TestContext({
                    maxRetries: 3,
                    analytics: false,
                    readerErrorAt: [0]
                });

                slice = await setupSlice(testContext, eventMocks);

                results = await slice.run();
                await Promise.all([
                    slice.stateStorage.refresh(),
                    slice.analyticsStorage.refresh(),
                ]);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                expect(results).toEqual(times(10, () => ({ hi: true })));

                // should have have the analytics data
                expect(slice.analyticsData).toBeUndefined();

                // should call the correct events
                expect(eventMocks['slice:retry']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:retry']).toHaveBeenCalledWith(slice.slice);
                expect(eventMocks['slice:success']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:success']).toHaveBeenCalledWith(slice.slice);
                expect(eventMocks['slice:finalize']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:finalize']).toHaveBeenCalledWith(slice.slice);
                expect(eventMocks['slice:failure']).not.toHaveBeenCalled();

                // should have the correct state storage
                const { exId } = slice.executionContext;
                const query = `ex_id:${exId} AND state:completed`;
                return expect(slice.stateStorage.count(query, 0)).resolves.toEqual(1);
            });
        });

        describe('when the slice fails to retry', () => {
            let slice: SliceExecution;
            let err: Error;
            let testContext: any;
            const eventMocks: Record<string, jest.Mock> = {};

            beforeEach(async () => {
                testContext = new TestContext({
                    maxRetries: 3,
                    analytics: false,
                    newOps: true,
                    failOnSliceRetry: true
                });

                slice = await setupSlice(testContext, eventMocks);

                try {
                    await slice.run();
                } catch (_err) {
                    err = _err;
                }

                await Promise.all([
                    slice.stateStorage.refresh(),
                    slice.analyticsStorage.refresh(),
                ]);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                // should have reject with the error
                expect(err).toBeDefined();
                const errMsg = err.toString();
                expect(errMsg).toInclude('Slice failed to retry');
                expect(errMsg).toInclude('I will not allow it');

                // should emit the events
                expect(eventMocks['slice:retry']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:retry']).toHaveBeenCalledWith(slice.slice);
                expect(eventMocks['slice:failure']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:failure']).toHaveBeenCalledWith(slice.slice);
                expect(eventMocks['slice:success']).not.toHaveBeenCalled();
                expect(eventMocks['slice:finalize']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:finalize']).toHaveBeenCalledWith(slice.slice);

                // should have the correct state storage
                const { exId } = slice.executionContext;
                const query = `ex_id:${exId} AND state:error`;
                return expect(slice.stateStorage.count(query, 0)).resolves.toEqual(1);
            });
        });

        describe('when the slice fails', () => {
            let slice: SliceExecution;
            let testContext: any;
            const eventMocks: Record<string, jest.Mock> = {};
            let err: Error;

            beforeEach(async () => {
                testContext = new TestContext({
                    maxRetries: 5,
                    analytics: false,
                    opErrorAt: times(6)
                });

                slice = await setupSlice(testContext, eventMocks);

                try {
                    await slice.run();
                } catch (_err) {
                    err = _err;
                }

                await Promise.all([
                    slice.stateStorage.refresh(),
                    slice.analyticsStorage.refresh(),
                ]);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                // should have reject with the error
                expect(err).toBeDefined();
                expect(err.toString()).toStartWith('TSError: Slice failed processing, caused by TSError: Bad news bears');

                // should emit the events
                expect(eventMocks['slice:retry']).toHaveBeenCalledTimes(5);
                expect(eventMocks['slice:retry']).toHaveBeenCalledWith(slice.slice);
                expect(eventMocks['slice:failure']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:failure']).toHaveBeenCalledWith(slice.slice);
                expect(eventMocks['slice:success']).not.toHaveBeenCalled();
                expect(eventMocks['slice:finalize']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:finalize']).toHaveBeenCalledWith(slice.slice);

                // should have the correct state storage
                const { exId } = slice.executionContext;
                const query = `ex_id:${exId} AND state:error`;
                return expect(slice.stateStorage.count(query, 0)).resolves.toEqual(1);
            });
        });

        describe('when the slice fails with zero retries', () => {
            let slice: SliceExecution;
            let testContext: any;
            const eventMocks: Record<string, jest.Mock> = {};
            let err: Error;

            beforeEach(async () => {
                testContext = new TestContext({
                    maxRetries: 0,
                    analytics: false,
                    opErrorAt: times(5)
                });

                slice = await setupSlice(testContext, eventMocks);

                try {
                    await slice.run();
                } catch (_err) {
                    err = _err;
                }

                await Promise.all([
                    slice.stateStorage.refresh(),
                    slice.analyticsStorage.refresh(),
                ]);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                // should have reject with the error
                expect(err).toBeDefined();
                expect(err.toString()).toStartWith('TSError: Slice failed processing, caused by TSError: Bad news bears');

                // should emit the events
                expect(eventMocks['slice:retry']).not.toHaveBeenCalled();
                expect(eventMocks['slice:failure']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:failure']).toHaveBeenCalledWith(slice.slice);
                expect(eventMocks['slice:success']).not.toHaveBeenCalled();
                expect(eventMocks['slice:finalize']).toHaveBeenCalledTimes(1);
                expect(eventMocks['slice:finalize']).toHaveBeenCalledWith(slice.slice);

                // should have the correct state storage
                const { exId } = slice.executionContext;
                const query = `ex_id:${exId} AND state:error`;
                return expect(slice.stateStorage.count(query, 0)).resolves.toEqual(1);
            });
        });
    });

    describe('when logging the analytics state', () => {
        describe('when given invalid state', () => {
            let testContext: any;
            let slice: SliceExecution;

            beforeEach(async () => {
                testContext = new TestContext({ analytics: true });
                slice = await setupSlice(testContext);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should not throw an error if given invalid state', async () => {
                const data = { should: 'break' };
                await expect(slice._logAnalytics(data as any)).resolves.not.toThrow();
            });
        });

        describe('when the slice is a string', () => {
            let testContext: any;
            let slice: SliceExecution;

            beforeEach(async () => {
                testContext = new TestContext({ analytics: true });
                slice = await setupSlice(testContext);
                slice.slice = 'hello-there' as any;
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the case when the slice is a string', async () => {
                // TODO: this is not actually testing a string
                await expect(slice._logAnalytics({} as any)).resolves.not.toThrow();
            });
        });
    });

    describe('when marking an invalid slice', () => {
        let testContext: any;
        let slice: SliceExecution;

        beforeEach(async () => {
            testContext = new TestContext();
            slice = await setupSlice(testContext);

            slice.slice = { should: 'break' } as any;
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should throw an error when marking it as failed', async () => {
            // @ts-expect-error
            await expect(slice._markFailed(new Error('some error'))).rejects.toThrow(/Failure to update error state/);
            // @ts-expect-error
            await expect(slice._markFailed()).rejects.toThrow(/Failure to update error state/);
        });

        it('should throw an error when marking it as complete', async () => {
            // @ts-expect-error
            await expect(slice._markCompleted()).rejects.toThrow(/Failure to update completed state/);
        });
    });
});
