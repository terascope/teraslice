'use strict';

const Promise = require('bluebird');
const times = require('lodash/times');
const Slice = require('../../../lib/workers/worker/slice');
const { TestContext } = require('../helpers');

describe('Slice', () => {
    async function setupSlice(testContext, eventMocks = {}) {
        await testContext.initialize();
        await testContext.executionContext.initialize();

        const slice = new Slice(testContext.context, testContext.executionContext);
        testContext.attachCleanup(() => slice.shutdown());

        await Promise.all([
            testContext.addAnalyticsStore(),
            testContext.addStateStore(),
        ]);

        const sliceConfig = await testContext.newSlice();

        await slice.initialize(sliceConfig, testContext.stores);

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
            let slice;
            let results;
            let testContext;
            const eventMocks = {};

            beforeEach(async () => {
                testContext = new TestContext({ analytics: true });
                slice = await setupSlice(testContext, eventMocks);

                results = await slice.run();
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
                return expect(slice.stateStore.count(query)).resolves.toEqual(1);
            });
        });
    });

    describe('without analytics', () => {
        describe('when the slice succeeds', () => {
            let slice;
            let results;
            let testContext;
            const eventMocks = {};

            beforeEach(async () => {
                testContext = new TestContext({ analytics: false });
                slice = await setupSlice(testContext, eventMocks);

                results = await slice.run();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                // should call all of the operations
                expect(results).toEqual(times(10, () => ({ hi: true })));

                // should have have the analytics data
                expect(slice).not.toHaveProperty('analyticsData');

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
                return expect(slice.stateStore.count(query, 0)).resolves.toEqual(1);
            });
        });

        describe('when the slice retries', () => {
            let slice;
            let results;
            let testContext;
            const eventMocks = {};

            beforeEach(async () => {
                testContext = new TestContext({
                    maxRetries: 3,
                    analytics: false,
                    readerErrorAt: [0]
                });

                slice = await setupSlice(testContext, eventMocks);

                results = await slice.run();
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                expect(results).toEqual(times(10, () => ({ hi: true })));

                // should have have the analytics data
                expect(slice).not.toHaveProperty('analyticsData');

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
                return expect(slice.stateStore.count(query, 0)).resolves.toEqual(1);
            });
        });

        describe('when the slice fails to retry', () => {
            let slice;
            let err;
            let testContext;
            const eventMocks = {};

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
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                // should have reject with the error
                expect(err).toBeDefined();
                expect(err.toString()).toStartWith('Error: Slice failed to retry: Error: I will not allow it, caused by');

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
                return expect(slice.stateStore.count(query, 0)).resolves.toEqual(1);
            });
        });

        describe('when the slice fails', () => {
            let slice;
            let testContext;
            const eventMocks = {};
            let err;

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
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                // should have reject with the error
                expect(err).toBeDefined();
                expect(err.toString()).toStartWith('Error: Slice failed processing, caused by Error: Bad news bears');

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
                return expect(slice.stateStore.count(query, 0)).resolves.toEqual(1);
            });
        });

        describe('when the slice fails with zero retries', () => {
            let slice;
            let testContext;
            const eventMocks = {};
            let err;

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
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the slice correctly', () => {
                // should have reject with the error
                expect(err).toBeDefined();
                expect(err.toString()).toStartWith('Error: Slice failed processing, caused by Error: Bad news bears');

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
                return expect(slice.stateStore.count(query, 0)).resolves.toEqual(1);
            });
        });
    });

    describe('when logging the analytics state', () => {
        describe('when given invalid state', () => {
            let testContext;
            let slice;

            beforeEach(async () => {
                testContext = new TestContext({ analytics: true });

                slice = await setupSlice(testContext);
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should throw an error if given invalid state', async () => {
                const data = { should: 'break' };
                return expect(slice._logAnalytics(data)).rejects.toThrowError(/Failure to update analytics/);
            });
        });

        describe('when the slice is a string', () => {
            let testContext;
            let slice;

            beforeEach(async () => {
                testContext = new TestContext({ analytics: true });

                slice = await setupSlice(testContext);
                slice.slice = 'hello-there';
            });

            afterEach(async () => {
                await testContext.cleanup();
            });

            it('should handle the case when the slice is a string', async () => {
                await slice._logAnalytics();
            });
        });
    });

    describe('when marking an invalid slice', () => {
        let testContext;
        let slice;

        beforeEach(async () => {
            testContext = new TestContext();
            slice = await setupSlice(testContext);

            slice.slice = { should: 'break' };
        });

        afterEach(async () => {
            await testContext.cleanup();
        });

        it('should throw an error when marking it as failed', async () => {
            await expect(slice._markFailed(new Error('some error'))).rejects.toThrowError(/Failure to update failed state/);
            await expect(slice._markFailed()).rejects.toThrowError(/Failure to update failed state/);
        });

        it('should throw an error when marking it as complete', async () => {
            await expect(slice._markCompleted()).rejects.toThrowError(/Failure to update success state/);
        });
    });
});
