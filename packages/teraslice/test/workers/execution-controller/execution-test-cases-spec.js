'use strict';

const { pDelay, times, random } = require('@terascope/utils');
const Messaging = require('@terascope/teraslice-messaging');
const { TestContext } = require('../helpers');
const { getTestCases } = require('../helpers/execution-controller-helper');
const ExecutionController = require('../../../lib/workers/execution-controller');
const { findPort } = require('../../../lib/utils/port_utils');
const { newId } = require('../../../lib/utils/id_utils');

const ExecutionControllerClient = Messaging.ExecutionController.Client;

describe('ExecutionController Test Cases', () => {
    // [ message, config ]
    const testCases = [
        [
            'when processing one slice',
            {
                slicerResults: [{ example: 'single-slice' }, null],
                body: { example: 'single-slice' },
                count: 1,
                analytics: false
            }
        ],
        [
            'when processing a slicer requests a specific worker',
            {
                slicerResults: [
                    { request_worker: 'specific-worker-1', example: 'specific-worker' },
                    null
                ],
                workerIds: ['specific-worker-1'],
                body: { request_worker: 'specific-worker-1', example: 'specific-worker' },
                count: 1,
                analytics: true
            }
        ],
        [
            'when processing sub-slices',
            {
                slicerResults: [
                    [{ example: 'subslice' }, { example: 'subslice' }, { example: 'subslice' }],
                    null
                ],
                emitSlicerRecursion: true,
                count: 3,
                body: { example: 'subslice' },
                analytics: false
            }
        ],
        [
            'when processing slices with multiple workers and one reconnects',
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
                analytics: false
            }
        ],
        [
            'when processing a slice with dynamic queue length',
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
                analytics: true
            }
        ],
        [
            'when processing a slice and the slicer throws an error',
            {
                slicerResults: [{ example: 'slice-failure' }, { error: 'Slice failure' }, null],
                slicerFails: true,
                body: { example: 'slice-failure' },
                count: 1,
                analytics: false
            }
        ],
        [
            'when processing a slice fails',
            {
                slicerResults: [{ example: 'slice-fail' }, null],
                sliceFails: true,
                body: { example: 'slice-fail' },
                count: 1,
                analytics: false
            }
        ],
        [
            'when processing a slicer that emits slicer events',
            {
                slicerResults: [{ example: 'slicer-slice-range-expansion' }, null],
                updateMetadata: true,
                emitSlicerRangeExpansion: true,
                body: { example: 'slicer-slice-range-expansion' },
                count: 1,
                analytics: true
            }
        ],
        [
            'when processing a slice and the execution is paused and resumed',
            {
                slicerResults: [{ example: 'slice-pause-and-resume' }, null],
                pauseAndResume: true,
                body: { example: 'slice-pause-and-resume' },
                count: 1,
                analytics: false
            }
        ]
    ];

    // for testing add a "only" property to the test cases you want
    // or add a skip property to the test cases you don't want
    describe.each(getTestCases(testCases))('%s', (m, options) => {
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
            sliceFails = false,
            slicerFails = false,
            updateMetadata,
            emitSlicerRecursion = false,
            emitSlicerRangeExpansion = false,
            workerIds = []
        } = options;

        let exController;
        let testContext;
        let slices;
        let exStore;
        let stateStore;
        let exStatus;

        beforeAll(async () => {
            await TestContext.waitForCleanup();

            slices = [];

            const port = await findPort();

            testContext = new TestContext({
                assignment: 'execution_controller',
                slicerPort: port,
                slicerQueueLength,
                slicerResults,
                timeout: reconnect ? 5000 : 3000,
                lifecycle,
                workers,
                analytics,
                updateMetadata
            });

            await testContext.addClusterMaster();

            await testContext.initialize(true);

            const { clusterMaster, exId } = testContext;

            stateStore = await testContext.addStateStore();
            exStore = await testContext.addExStore();

            exController = new ExecutionController(
                testContext.context,
                testContext.executionContext
            );

            const {
                network_latency_buffer: networkLatencyBuffer,
                action_timeout: actionTimeout
            } = testContext.context.sysconfig.teraslice;

            testContext.attachCleanup(() => exController.shutdown());

            const opCount = testContext.executionContext.config.operations.length;

            await exController.initialize();

            const socketOptions = reconnect
                ? {
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 500,
                    reconnectionDelayMax: 500
                }
                : {
                    reconnection: false
                };

            let firedReconnect = false;

            const workerClients = [];

            clusterMaster.onExecutionFinished(() => {
                workerClients.forEach((workerClient) => {
                    workerClient.shutdown();
                });
            });

            async function startWorker(n) {
                const workerId = workerIds[n] || newId('worker');
                const workerClient = new ExecutionControllerClient({
                    executionControllerUrl: `http://localhost:${port}`,
                    workerId,
                    networkLatencyBuffer,
                    workerDisconnectTimeout: 1000,
                    actionTimeout,
                    connectTimeout: 1000,
                    socketOptions
                });

                workerClients.push(workerClient);

                testContext.attachCleanup(() => workerClient.shutdown());

                await workerClient.start();

                async function waitForReconnect() {
                    if (!reconnect) return;
                    if (firedReconnect) return;

                    firedReconnect = true;
                    await Promise.all([
                        workerClient.forceReconnect(),
                        exController.server.waitForClientReady(workerId)
                    ]);
                }

                const isDone = () => exController.isExecutionDone;

                async function processWork() {
                    if (isDone()) return;

                    const slice = await workerClient.waitForSlice(isDone);

                    if (!slice) return;

                    slices.push(slice);

                    const msg = { slice };

                    if (analytics) {
                        msg.analytics = {
                            time: times(opCount, () => random(0, 2000)),
                            size: times(opCount, () => random(0, 100)),
                            memory: times(opCount, () => random(0, 10000))
                        };
                    }

                    // add a natural delay for completing a slice
                    await pDelay(100);

                    if (sliceFails) {
                        msg.error = 'Oh no, slice failure';
                        await stateStore.updateState(slice, 'error', msg.error);
                    } else {
                        await stateStore.updateState(slice, 'completed');
                    }

                    async function completeSlice() {
                        if (pauseAndResume) {
                            await Promise.all([
                                clusterMaster
                                    .sendExecutionPause(exId)
                                    .then(() => clusterMaster.sendExecutionResume(exId)),
                                workerClient.sendSliceComplete(msg)
                            ]);
                            return;
                        }

                        await pDelay(0);
                        await workerClient.sendSliceComplete(msg);
                    }

                    await Promise.all([waitForReconnect(), completeSlice()]);

                    await processWork();
                }

                await processWork();
            }

            function startWorkers() {
                return Promise.all(times(workers, startWorker));
            }

            clusterMaster.onClientAvailable(() => {
                if (emitSlicerRecursion) {
                    exController.events.emit('slicer:slice:recursion');
                }

                if (emitSlicerRangeExpansion) {
                    exController.events.emit('slicer:slice:range_expansion');
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

            await Promise.all([startWorkers(), exController.run()]);

            clearTimeout(requestAnayltics);

            exStatus = await exStore.get(exId);
        });

        afterAll(() => testContext.cleanup());

        it('should process the correct slices', async () => {
            expect(slices).toBeArrayOfSize(count);
            times(count, (i) => {
                const slice = slices[i];
                expect(slice).toHaveProperty('request');
                expect(slice.request).toEqual(body);
            });
        });

        it('should have the correct number of slices', async () => {
            const { exId } = testContext.executionContext;
            const errorCount = await stateStore.count(`ex_id:${exId} AND state:error`, 0);
            const completedCount = await stateStore.count(`ex_id:${exId}`, 0);

            if (sliceFails) {
                expect(errorCount).toEqual(count);
            } else {
                expect(completedCount).toEqual(count);
                expect(errorCount).toEqual(0);
            }
        });

        it('should have the correct execution status', () => {
            const { exId } = testContext.executionContext;

            expect(exStatus).toBeObject();
            expect(exStatus).toHaveProperty('_slicer_stats.processed');
            expect(exStatus).toHaveProperty('_slicer_stats.queued');
            expect(exStatus).toHaveProperty('_slicer_stats.slicers');

            if (sliceFails || slicerFails) {
                if (sliceFails) {
                    expect(exStatus).toHaveProperty(
                        '_failureReason',
                        `execution: ${exId} had 1 slice failure during processing`
                    );
                    expect(exStatus._slicer_stats.failed).toEqual(count);

                    expect(exStatus).toMatchObject({
                        _has_errors: true,
                        _status: 'failed'
                    });
                }

                if (slicerFails) {
                    expect(exStatus._failureReason).toStartWith(
                        `TSError: slicer for ex ${exId} had an error, shutting down execution, caused by Error: Slice failure`
                    );
                    expect(exStatus._slicer_stats.failed).toEqual(0);

                    expect(exStatus).toMatchObject({
                        _has_errors: true,
                        _status: 'failed'
                    });
                }
            } else {
                expect(exStatus).toMatchObject({
                    _has_errors: false,
                    _status: 'completed'
                });

                if (slicerQueueLength !== 'QUEUE_MINIMUM_SIZE') {
                    expect(exStatus._slicer_stats.processed).toEqual(count);
                }
            }

            expect(exStatus._slicer_stats.workers_joined).toBeGreaterThanOrEqual(1);

            if (reconnect && slicerQueueLength !== 'QUEUE_MINIMUM_SIZE') {
                expect(exStatus._slicer_stats.workers_reconnected).toBeGreaterThan(0);
            }

            if (emitSlicerRangeExpansion) {
                expect(exStatus._slicer_stats).toHaveProperty('slice_range_expansion', 1);
            }

            if (emitSlicerRecursion) {
                expect(exStatus._slicer_stats).toHaveProperty('subslices', 1);
            }
        });

        it('should update the execution metadata (from the context apis)', () => {
            const metadata = updateMetadata ? { slice_calls: count + 1 } : {};
            expect(exStatus).toHaveProperty('metadata', metadata);
        });
    });
});
