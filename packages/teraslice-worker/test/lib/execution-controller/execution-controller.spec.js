'use strict';

const _ = require('lodash');
const { EventEmitter } = require('events');
const { ExecutionController } = require('../../..');
const WorkerMessenger = require('../../../lib/worker/messenger');
const { TestContext, findPort } = require('../../helpers');
const newId = require('../../../lib/utils/new-id');

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
                useExecutionRunner: _.sample([true, false]),
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
                useExecutionRunner: _.sample([true, false]),
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
                useExecutionRunner: _.sample([true, false]),
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
                useExecutionRunner: _.sample([true, false]),
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
                useExecutionRunner: _.sample([true, false])
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
                useExecutionRunner: _.sample([true, false]),
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
                useExecutionRunner: _.sample([true, false])
            }
        ],
        [
            'processing a slicer that emits a "slicer:execution:update" event',
            {
                slicerResults: [
                    { example: 'slice-execution-update' },
                    null
                ],
                emitsExecutionUpdate: [
                    {
                        _op: 'some-example',
                        newData: true
                    }
                ],
                body: { example: 'slice-execution-update' },
                count: 1,
                analytics: _.sample([true, false]),
                useExecutionRunner: _.sample([true, false])
            }
        ],
        [
            'processing a slicer that emits a "slicer:slice:range_expansion" event',
            {
                slicerResults: [
                    { example: 'slicer-slice-range-expansion' },
                    null
                ],
                emitSlicerRangeExpansion: true,
                body: { example: 'slicer-slice-range-expansion' },
                count: 1,
                analytics: _.sample([true, false]),
                useExecutionRunner: _.sample([true, false])
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
                useExecutionRunner: _.sample([true, false])
            }
        ],
        [
            'processing a slice and the execution is stopped',
            {
                slicerResults: [
                    { example: 'slice-execution-stop' },
                    null
                ],
                sendClusterStop: true,
                body: { example: 'slice-execution-stop' },
                count: 1,
                analytics: _.sample([true, false]),
                useExecutionRunner: _.sample([true, false])
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
                useExecutionRunner: _.sample([true, false])
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
                useExecutionRunner: _.sample([true, false])
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
                useExecutionRunner: _.sample([true, false])
            }
        ]
    ];

    // fdescribe.each([testCases[10]])('when %s', (m, options) => {
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
            sendClusterStop = false,
            sliceFails = false,
            slicerFails = false,
            emitsExecutionUpdate,
            emitSlicerRecursion = false,
            emitSlicerRangeExpansion = false,
            useExecutionRunner = false,
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

        beforeEach(async () => {
            slices = [];

            const port = await findPort();

            testContext = new TestContext({
                assignment: 'execution_controller',
                slicerPort: port,
                slicerQueueLength,
                slicerResults,
                lifecycle,
                workers,
                analytics,
                useExecutionRunner,
            });

            await testContext.addClusterMaster();

            await testContext.initialize(true);

            const { clusterMaster, exId, nodeId } = testContext;

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
                timeout: 1000,
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 500,
                reconnectionDelayMax: 500
            } : {
                timeout: 1000,
                reconnection: false
            };

            let firedReconnect = false;

            async function startWorker(n) {
                const workerId = workerIds[n] || newId('worker');
                const workerMessenger = new WorkerMessenger({
                    executionControllerUrl: `http://localhost:${port}`,
                    workerId,
                    networkLatencyBuffer,
                    actionTimeout,
                    events: new EventEmitter(),
                    socketOptions
                });

                testContext.attachCleanup(() => workerMessenger.shutdown());

                await workerMessenger.start();

                async function waitForReconnect() {
                    if (!reconnect) return;
                    if (firedReconnect) return;

                    firedReconnect = true;
                    await Promise.all([
                        workerMessenger.forceReconnect(),
                        exController.messenger.onceWithTimeout('worker:reconnect', 5 * 1000)
                    ]);
                }

                async function process() {
                    if (exController.isDone()) return;

                    const slice = await workerMessenger.waitForSlice(() => exController.isDone());

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
                                clusterMaster.pauseExecution(nodeId, exId)
                                    .then(() => clusterMaster.resumeExecution(nodeId, exId)),
                                workerMessenger.sliceComplete(msg),
                            ]);
                            return;
                        }

                        if (sendClusterStop) {
                            await Promise.all([
                                clusterMaster.stopExecution(nodeId, exId),
                                workerMessenger.sliceComplete(msg)
                            ]);
                            return;
                        }

                        await Promise.delay(0);
                        await workerMessenger.sliceComplete(msg);
                    }

                    await Promise.all([
                        waitForReconnect(),
                        completeSlice(),
                    ]);

                    await process();
                }

                await process();

                await workerMessenger.shutdown();
            }

            function startWorkers() {
                return Promise.all(_.times(workers, startWorker));
            }

            if (!_.isEmpty(emitsExecutionUpdate)) {
                setImmediate(() => {
                    if (!exController) return;

                    exController.events.emit('slicer:execution:update', {
                        update: emitsExecutionUpdate
                    });
                });
            }

            if (emitSlicerRangeExpansion) {
                setImmediate(() => {
                    if (!exController) return;
                    exController.events.emit('slicer:slice:range_expansion');
                });
            }

            if (emitSlicerRecursion) {
                setImmediate(() => {
                    if (!exController) return;
                    exController.events.emit('slicer:slice:recursion');
                });
            }

            const requestAnayltics = setTimeout(async () => {
                try {
                    await clusterMaster.requestAnalytics(nodeId, exId);
                } catch (err) {
                    // it shouldn't matter
                }
            }, 100);

            testContext.attachCleanup(() => clearTimeout(requestAnayltics));

            await Promise.all([
                startWorkers(),
                exController.run(),
            ]);

            clearTimeout(requestAnayltics);
        });

        afterEach(() => testContext.cleanup());

        it('should process the execution correctly', async () => {
            const { ex_id: exId } = testContext.executionContext;

            expect(slices).toBeArrayOfSize(count);
            _.times(count, (i) => {
                const slice = slices[i];
                expect(slice).toHaveProperty('request');
                expect(slice.request).toEqual(body);
            });

            const exStatus = await exStore.get(exId);
            expect(exStatus).toBeObject();
            expect(exStatus).toHaveProperty('_slicer_stats');

            if (sliceFails || slicerFails) {
                if (sliceFails) {
                    expect(exStatus).toHaveProperty('_failureReason', `execution: ${exId} had 1 slice failures during processing`);
                    expect(exStatus._slicer_stats.failed).toEqual(count);
                    const query = `ex_id:${exId} AND state:error`;
                    const actualCount = await stateStore.count(query, 0);
                    expect(actualCount).toEqual(count);
                }

                if (slicerFails) {
                    expect(exStatus._failureReason).toStartWith(`Error: slicer for ex ${exId} had an error, shutting down execution, caused by Error: Slice failure`);
                    expect(exStatus._slicer_stats.failed).toEqual(0);
                }

                expect(exStatus).toHaveProperty('_has_errors', true);
                expect(exStatus).toHaveProperty('_status', 'failed');
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

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext,
            );

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
                    expect(err.message).toEqual(`No active execution context was found for execution: ${testContext.exId}`);
                }
            });
        });

        describe('when the execution is in a terminal state', () => {
            beforeEach(async () => {
                await exStore.setStatus(testContext.exId, 'completed');
            });

            it('should throw an error on initialize', async () => {
                expect.hasAssertions();
                try {
                    await exController.initialize();
                } catch (err) {
                    expect(err.message).toEqual(`No active execution context was found for execution: ${testContext.exId}`);
                }
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

                it('should resolve', () => expect(exController.shutdown()).resolves.toBeNil());
            });

            describe('when everything errors', () => {
                beforeEach(() => {
                    exController.isDone = () => false;
                    exController._doneProcessing = () => Promise.reject(new Error('Slicer Finish Error'));

                    exController.stores = {};
                    exController.stores.someStore = {
                        shutdown: () => Promise.reject(new Error('Store Error'))
                    };

                    exController.recover = {};
                    exController.recover.shutdown = () => Promise.reject(new Error('Recover Error'));

                    exController.executionAnalytics = {};
                    exController.executionAnalytics.shutdown = () => Promise.reject(new Error('Execution Analytics Error'));

                    exController.clusterMasterClient = {};
                    exController.clusterMasterClient.shutdown = () => Promise.reject(new Error('Cluster Master Client Error'));

                    exController.messenger = {};
                    exController.messenger.executionFinished = () => Promise.reject(new Error('Messenger Execution Finished Error'));
                    exController.messenger.shutdown = () => Promise.reject(new Error('Messenger Error'));
                });

                it('should reject with all of the errors', async () => {
                    expect.hasAssertions();
                    try {
                        await exController.shutdown();
                    } catch (err) {
                        const errMsg = err.toString();
                        expect(errMsg).toStartWith('Error: Failed to shutdown correctly');
                        expect(errMsg).toInclude('Slicer Finish Error');
                        expect(errMsg).toInclude('Store Error');
                        expect(errMsg).toInclude('Recover Error');
                        expect(errMsg).toInclude('Execution Analytics Error');
                        expect(errMsg).toInclude('Cluster Master Client Error');
                        expect(errMsg).toInclude('Messenger Execution Finished Error');
                        expect(errMsg).toInclude('Messenger Error');
                    }
                });
            });
        });
    });
});
