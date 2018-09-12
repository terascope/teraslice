'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const Messaging = require('@terascope/teraslice-messaging');
const { TestContext, findPort } = require('../helpers');
const { makeShutdownEarlyFn } = require('../helpers/execution-controller-helper');
const ExecutionController = require('../../../lib/workers/execution-controller');
const { newId } = require('../../../lib/utils/id_utils');

const ExecutionControllerClient = Messaging.ExecutionController.Client;
process.env.BLUEBIRD_LONG_STACK_TRACES = '1';

describe('ExecutionController', () => {
    // [ message, config ]
    const testCases = [
        [
            'processing one slice',
            {
                slicerResults: [
                    { example: 'single-slice' },
                    null
                ],
                body: { example: 'single-slice' },
                count: 1,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'processing a slicer requests a specific worker',
            {
                slicerResults: [
                    { request_worker: 'specific-worker-1', example: 'specific-worker' },
                    null
                ],
                workerIds: ['specific-worker-1'],
                body: { request_worker: 'specific-worker-1', example: 'specific-worker' },
                count: 1,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'processing sub-slices',
            {
                slicerResults: [
                    [
                        { example: 'subslice' },
                        { example: 'subslice' },
                        { example: 'subslice' },
                    ],
                    null,
                ],
                emitSlicerRecursion: true,
                count: 3,
                body: { example: 'subslice' },
                analytics: _.sample([true, false]),
            }
        ],
        [
            'processing slices with multiple workers and one reconnects',
            {
                slicerResults: [
                    { example: 'slice-disconnect' },
                    { example: 'slice-disconnect' },
                    { example: 'slice-disconnect' },
                    { example: 'slice-disconnect' },
                    null
                ],
                reconnect: true,
                body: { example: 'slice-disconnect' },
                count: 4,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'processing a slice with dynamic queue length',
            {
                slicerResults: [
                    { example: 'slice-dynamic' },
                    { example: 'slice-dynamic' },
                    { example: 'slice-dynamic' },
                    { example: 'slice-dynamic' },
                    null
                ],
                reconnect: true,
                slicerQueueLength: 'QUEUE_MINIMUM_SIZE',
                body: { example: 'slice-dynamic' },
                count: 4,
                workers: 2,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'processing a slice and the slicer throws an error',
            {
                slicerResults: [
                    { example: 'slice-failure' },
                    new Error('Slice failure'),
                    null
                ],
                slicerFails: true,
                body: { example: 'slice-failure' },
                count: 1,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'processing a slice fails',
            {
                slicerResults: [
                    { example: 'slice-fail' },
                    null
                ],
                sliceFails: true,
                body: { example: 'slice-fail' },
                count: 1,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'processing a slicer that emits slicer events',
            {
                slicerResults: [
                    { example: 'slicer-slice-range-expansion' },
                    null
                ],
                emitsExecutionUpdate: [
                    {
                        _op: 'some-example',
                        newData: true
                    }
                ],
                emitSlicerRangeExpansion: true,
                body: { example: 'slicer-slice-range-expansion' },
                count: 1,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'processing a slice and the execution is paused and resumed',
            {
                slicerResults: [
                    { example: 'slice-pause-and-resume' },
                    null
                ],
                pauseAndResume: true,
                body: { example: 'slice-pause-and-resume' },
                count: 1,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'processing slices and the execution gets shutdown early',
            {
                slicerResults: [
                    { example: 'slice-shutdown-early' },
                    { example: 'slice-shutdown-early' },
                    { example: 'slice-shutdown-early' },
                    { example: 'slice-shutdown-early' },
                ],
                lifecycle: 'persistent',
                shutdownTimeout: 2000,
                shutdownEarly: true,
                body: { example: 'slice-shutdown-early' },
                count: 2,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'recovering a slicer with no cleanup type',
            {
                slicerResults: [
                    { example: 'slice-recovery' },
                    null
                ],
                recover: true,
                recoverySlices: [
                    {
                        state: 'error',
                        slice: {
                            slice_id: newId(),
                            request: {
                                example: 'slice-recovery'
                            },
                            slicer_id: 0,
                            slicer_order: 0,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'start',
                        slice: {
                            slice_id: newId(),
                            request: {
                                example: 'slice-recovery'
                            },
                            slicer_id: 0,
                            slicer_order: 1,
                            _created: new Date().toISOString()
                        }
                    }
                ],
                body: { example: 'slice-recovery' },
                count: 2,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'recovering a slicer with a cleanup type of errors',
            {
                slicerResults: [
                    { example: 'slice-recovery-error-after' },
                    null
                ],
                recover: true,
                cleanupType: 'errors',
                recoverySlices: [
                    {
                        state: 'idk',
                        slice: {
                            slice_id: newId(),
                            request: {
                                example: 'slice-recovery-error-idk'
                            },
                            slicer_id: 0,
                            slicer_order: 0,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'error',
                        slice: {
                            slice_id: newId(),
                            request: {
                                example: 'slice-recovery-error'
                            },
                            slicer_id: 0,
                            slicer_order: 1,
                            _created: new Date().toISOString()
                        }
                    },
                ],
                body: { example: 'slice-recovery-error' },
                count: 1,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'recovering a slicer with a cleanup type of all',
            {
                slicerResults: [
                    { example: 'slice-recovery-all-after' },
                    null
                ],
                recover: true,
                cleanupType: 'all',
                recoverySlices: [
                    {
                        state: 'error',
                        slice: {
                            slice_id: newId(),
                            request: {
                                example: 'slice-recovery-all'
                            },
                            slicer_id: 0,
                            slicer_order: 0,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'start',
                        slice: {
                            slice_id: newId(),
                            request: {
                                example: 'slice-recovery-all'
                            },
                            slicer_id: 0,
                            slicer_order: 1,
                            _created: new Date().toISOString()
                        }
                    }
                ],
                body: { example: 'slice-recovery-all' },
                count: 2,
                analytics: _.sample([true, false]),
            }
        ]
    ];

    // for testing enable the next line and a "only" property to the test cases you want
    // fdescribe.each(_.filter(testCases, ts => ts[1].only))('when %s', (m, options) => {
    describe.each(testCases)('when %s', (m, options) => {
        const {
            slicerResults,
            slicerQueueLength,
            count,
            lifecycle = 'once',
            body,
            reconnect = false,
            analytics = false,
            workers = 1,
            pauseAndResume = false,
            shutdownTimeout = 4000,
            shutdownEarly = false,
            sliceFails = false,
            slicerFails = false,
            emitsExecutionUpdate,
            emitSlicerRecursion = false,
            emitSlicerRangeExpansion = false,
            workerIds = [],
            cleanupType,
            recover = false,
            recoverySlices = [],
        } = options;

        let exController;
        let testContext;
        let slices;
        let exStore;
        let stateStore;
        let shutdownEarlyFn;

        beforeEach(async () => {
            slices = [];

            const port = await findPort();

            testContext = new TestContext({
                assignment: 'execution_controller',
                slicerPort: port,
                slicerQueueLength,
                slicerResults,
                shutdownTimeout,
                timeout: reconnect ? 5000 : 3000,
                lifecycle,
                workers,
                analytics,
            });

            await testContext.addClusterMaster();

            await testContext.initialize(true);

            const { clusterMaster, exId } = testContext;

            stateStore = await testContext.addStateStore();
            exStore = await testContext.addExStore();

            if (recover) {
                testContext.executionContext.config.recovered_slice_type = cleanupType;
                testContext.executionContext.config.recovered_execution = exId;

                await Promise.map(recoverySlices, (recoverySlice) => {
                    const { slice, state } = recoverySlice;
                    return stateStore.createState(exId, slice, state);
                });
            }

            if (shutdownEarly) {
                testContext.executionContext.queueLength = 1;
            }

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext,
            );

            const {
                network_latency_buffer: networkLatencyBuffer,
                action_timeout: actionTimeout,
            } = testContext.context.sysconfig.teraslice;

            testContext.attachCleanup(() => exController.shutdown());

            const opCount = testContext.executionContext.config.operations.length;

            await exController.initialize();

            const socketOptions = reconnect ? {
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 500,
                reconnectionDelayMax: 500
            } : {
                reconnection: false
            };

            let firedReconnect = false;

            shutdownEarlyFn = makeShutdownEarlyFn({
                enabled: shutdownEarly,
                exController,
            });

            async function startWorker(n) {
                const workerId = workerIds[n] || newId('worker');
                const workerClient = new ExecutionControllerClient({
                    executionControllerUrl: `http://localhost:${port}`,
                    workerId,
                    networkLatencyBuffer,
                    actionTimeout,
                    connectTimeout: 1000,
                    socketOptions
                });

                testContext.attachCleanup(() => workerClient.shutdown());

                await workerClient.start();

                async function waitForReconnect() {
                    if (!reconnect) return;
                    if (firedReconnect) return;

                    firedReconnect = true;
                    await Promise.all([
                        workerClient.forceReconnect(),
                        exController.server.waitForClientReady(workerId),
                    ]);
                }

                const isDone = () => exController.isExecutionFinished;

                async function process() {
                    if (isDone()) return;

                    const slice = await workerClient.waitForSlice(isDone);

                    if (!slice) return;

                    slices.push(slice);

                    const msg = { slice };

                    if (analytics) {
                        msg.analytics = {
                            time: _.times(opCount, () => _.random(0, 2000)),
                            size: _.times(opCount, () => _.random(0, 100)),
                            memory: _.times(opCount, () => _.random(0, 10000)),
                        };
                    }

                    // add a natural delay for completing a slice
                    await Promise.delay(100);

                    if (sliceFails) {
                        msg.error = 'Oh no, slice failure';
                        await stateStore.updateState(slice, 'error', msg.error);
                    } else {
                        await stateStore.updateState(slice, 'completed');
                    }

                    async function completeSlice() {
                        if (pauseAndResume) {
                            await Promise.all([
                                clusterMaster.sendExecutionPause(exId)
                                    .then(() => clusterMaster.sendExecutionResume(exId)),
                                workerClient.sendSliceComplete(msg),
                            ]);
                            return;
                        }

                        await Promise.delay(0);
                        await workerClient.sendSliceComplete(msg);

                        await shutdownEarlyFn.shutdown();
                    }

                    await Promise.all([
                        waitForReconnect(),
                        completeSlice(),
                    ]);

                    await process();
                }

                await process();

                await workerClient.shutdown();
            }

            function startWorkers() {
                return Promise.all(_.times(workers, startWorker));
            }

            clusterMaster.onClientAvailable(() => {
                if (emitSlicerRecursion) {
                    exController.events.emit('slicer:slice:recursion');
                }

                if (emitSlicerRangeExpansion) {
                    exController.events.emit('slicer:slice:range_expansion');
                }

                if (!_.isEmpty(emitsExecutionUpdate)) {
                    exController.events.emit('slicer:execution:update', {
                        update: emitsExecutionUpdate
                    });
                }
            });

            const requestAnayltics = setTimeout(async () => {
                try {
                    await clusterMaster.sendExecutionAnalyticsRequest(exId);
                } catch (err) {
                    // it shouldn't matter
                }
            }, 100);

            testContext.attachCleanup(() => clearTimeout(requestAnayltics));

            await Promise.all([
                shutdownEarlyFn.wait(),
                startWorkers(),
                exController.run(),
            ]);

            clearTimeout(requestAnayltics);
        });

        afterEach(() => testContext.cleanup());

        it('should process the execution correctly', async () => {
            const { ex_id: exId } = testContext.executionContext;

            if (shutdownEarly) {
                expect(shutdownEarlyFn.error().message).toStartWith('Failed to shutdown correctly: Error:');
            }

            expect(slices).toBeArrayOfSize(count);
            _.times(count, (i) => {
                const slice = slices[i];
                expect(slice).toHaveProperty('request');
                expect(slice.request).toEqual(body);
            });

            const exStatus = await exStore.get(exId);
            expect(exStatus).toBeObject();
            expect(exStatus).toHaveProperty('_slicer_stats');

            if (sliceFails || slicerFails || shutdownEarly) {
                if (sliceFails) {
                    expect(exStatus).toHaveProperty('_failureReason', `execution: ${exId} had 1 slice failures during processing`);
                    expect(exStatus._slicer_stats.failed).toEqual(count);
                    const query = `ex_id:${exId} AND state:error`;
                    const actualCount = await stateStore.count(query, 0);
                    expect(actualCount).toEqual(count);

                    expect(exStatus).toHaveProperty('_has_errors', true);
                    expect(exStatus).toHaveProperty('_status', 'failed');
                }

                if (slicerFails) {
                    expect(exStatus._failureReason).toStartWith(`slicer for ex ${exId} had an error, shutting down execution, caused by Error: Slice failure`);
                    expect(exStatus._slicer_stats.failed).toEqual(0);

                    expect(exStatus).toHaveProperty('_has_errors', true);
                    expect(exStatus).toHaveProperty('_status', 'failed');
                }

                if (shutdownEarly) {
                    expect(exStatus).toHaveProperty('_failureReason', `execution ${exId} received shutdown before the slicer could complete, setting status to "terminated"`);
                    expect(exStatus._slicer_stats.failed).toEqual(0);

                    expect(exStatus).toHaveProperty('_has_errors', true);
                    expect(exStatus).toHaveProperty('_status', 'terminated');
                }
            } else {
                expect(exStatus).toHaveProperty('_status', 'completed');
                expect(exStatus).toHaveProperty('_has_errors', false);

                if (slicerQueueLength !== 'QUEUE_MINIMUM_SIZE') {
                    expect(exStatus._slicer_stats.processed).toEqual(count);
                }

                const query = `ex_id:${exId} AND state:completed`;
                const actualCount = await stateStore.count(query, 0);
                expect(actualCount).toEqual(count);
            }

            expect(exStatus._slicer_stats.workers_joined).toBeGreaterThanOrEqual(1);

            if (reconnect && slicerQueueLength !== 'QUEUE_MINIMUM_SIZE') {
                expect(exStatus._slicer_stats.workers_reconnected).toBeGreaterThan(0);
            }

            if (!_.isEmpty(emitsExecutionUpdate)) {
                expect(exStatus).toHaveProperty('operations', emitsExecutionUpdate);
            }

            if (emitSlicerRangeExpansion) {
                expect(exStatus._slicer_stats).toHaveProperty('slice_range_expansion', 1);
            }

            if (emitSlicerRecursion) {
                expect(exStatus._slicer_stats).toHaveProperty('subslices', 1);
            }
        });
    });

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
