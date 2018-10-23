'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const Messaging = require('@terascope/teraslice-messaging');
const { TestContext } = require('../helpers');
const { getTestCases } = require('../helpers/execution-controller-helper');
const ExecutionController = require('../../../lib/workers/execution-controller');
const { findPort } = require('../../../lib/utils/port_utils');
const { newId } = require('../../../lib/utils/id_utils');

const ExecutionControllerClient = Messaging.ExecutionController.Client;
process.env.BLUEBIRD_LONG_STACK_TRACES = '1';

describe('ExecutionController Test Cases', () => {
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
    ];

    // for testing add a "only" property to the test cases you want
    // or add a skip property to the test cases you don't want
    describe.each(getTestCases(testCases))('when %s', (m, options) => {
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
            emitsExecutionUpdate,
            emitSlicerRecursion = false,
            emitSlicerRangeExpansion = false,
            workerIds = [],
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
                        exController.server.waitForClientReady(workerId),
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
                    }

                    await Promise.all([
                        waitForReconnect(),
                        completeSlice(),
                    ]);

                    await processWork();
                }

                await processWork();
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
                startWorkers(),
                exController.run(),
            ]);

            clearTimeout(requestAnayltics);
        });

        afterEach(() => testContext.cleanup());

        it('should process the execution correctly', async () => {
            const { exId } = testContext.executionContext;

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
                    expect(exStatus).toHaveProperty('_failureReason', `execution: ${exId} had 1 slice failure during processing`);
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
});
