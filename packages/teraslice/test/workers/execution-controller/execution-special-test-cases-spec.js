import { v4 as uuidv4 } from 'uuid';
import { pDelay, times, random } from '@terascope/utils';
import { RecoveryCleanupType } from '@terascope/job-components';
import Messaging from '@terascope/teraslice-messaging';
import { TestContext } from '../helpers.js';
import { makeShutdownEarlyFn, getTestCases } from '../helpers/execution-controller-helper.js';
import ExecutionController from '../../../lib/workers/execution-controller.js';
import { findPort } from '../../../lib/utils/port_utils.js';
import { newId } from '../../../lib/utils/id_utils.js';

const ExecutionControllerClient = Messaging.ExecutionController.Client;
process.env.BLUEBIRD_LONG_STACK_TRACES = '1';

describe('ExecutionController Special Tests', () => {
    // [ message, config ]
    const testCases = [
        [
            'when recovering a slicer no cleanup type',
            {
                slicerResults: [
                    { example: 'slice-recovery-after' },
                    { example: 'slice-recovery-after' },
                    null
                ],
                isRecovery: true,
                recoverySlices: [
                    {
                        state: 'start',
                        slice: {
                            slice_id: uuidv4(),
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
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-recovery'
                            },
                            slicer_id: 0,
                            slicer_order: 1,
                            _created: new Date().toISOString()
                        }
                    }
                ],
                processedSliceCount: 4,
                incompleteSliceCount: 0,
                completedSliceCount: 4,
                analytics: true
            }
        ],
        [
            'when recovering with no slices to recover',
            {
                slicerResults: [
                    { example: 'slice-recovery-no-slices-after' },
                    { example: 'slice-recovery-no-slices-after' },
                    null
                ],
                isRecovery: true,
                recoverySlices: [],
                incompleteSliceCount: 0,
                completedSliceCount: 2,
                processedSliceCount: 2,
                analytics: true
            }
        ],
        [
            'when recovering a slicer with a cleanup type of errors',
            {
                slicerResults: [
                    { example: 'slice-recovery-error-after' },
                    null
                ],
                isRecovery: true,
                cleanupType: RecoveryCleanupType.errors,
                recoverySlices: [
                    {
                        state: 'completed',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-recovery-error-completed'
                            },
                            slicer_id: 0,
                            slicer_order: 0,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'start',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-recovery-error-start'
                            },
                            slicer_id: 0,
                            slicer_order: 1,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'error',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-recovery-error'
                            },
                            slicer_id: 0,
                            slicer_order: 2,
                            _created: new Date().toISOString()
                        }
                    }
                ],
                incompleteSliceCount: 1,
                completedSliceCount: 2,
                processedSliceCount: 1,
                analytics: false
            }
        ],
        [
            'when recovering a slicer with a cleanup type of all',
            {
                slicerResults: [
                    { example: 'slice-recovery-all-after' },
                    null
                ],
                isRecovery: true,
                cleanupType: RecoveryCleanupType.all,
                recoverySlices: [
                    {
                        state: 'error',
                        slice: {
                            slice_id: uuidv4(),
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
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-recovery-all'
                            },
                            slicer_id: 0,
                            slicer_order: 1,
                            _created: new Date().toISOString()
                        }
                    }
                ],
                processedSliceCount: 2,
                incompleteSliceCount: 0,
                completedSliceCount: 2,
                analytics: true
            }
        ],
        [
            'when recovering a slicer with a cleanup type of pending',
            {
                slicerResults: [
                    { example: 'slice-recovery-pending-after' },
                    null
                ],
                isRecovery: true,
                cleanupType: RecoveryCleanupType.pending,
                recoverySlices: [
                    {
                        state: 'completed',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-recovery-pending-completed'
                            },
                            slicer_id: 0,
                            slicer_order: 0,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'start',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-recovery-pending-start'
                            },
                            slicer_id: 0,
                            slicer_order: 1,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'pending',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-recovery-pending'
                            },
                            slicer_id: 0,
                            slicer_order: 2,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'pending',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-recovery-pending'
                            },
                            slicer_id: 0,
                            slicer_order: 3,
                            _created: new Date().toISOString()
                        }
                    }
                ],
                incompleteSliceCount: 1,
                completedSliceCount: 3,
                processedSliceCount: 2,
                analytics: false
            }
        ],
        [
            'when autorecovering a slicer with a cleanup type of pending',
            {
                slicerResults: [
                    { example: 'slice-autorecover-pending-after-1' },
                    { example: 'slice-autorecover-pending-after-2' },
                    { example: 'slice-autorecover-pending-after-3' },
                    null
                ],
                autorecover: true,
                isRecovery: true,
                recoverySlices: [
                    {
                        state: 'completed',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-autorecover-pending-completed'
                            },
                            slicer_id: 0,
                            slicer_order: 0,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'start',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-autorecover-pending-start'
                            },
                            slicer_id: 0,
                            slicer_order: 1,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'pending',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-autorecover-pending'
                            },
                            slicer_id: 0,
                            slicer_order: 2,
                            _created: new Date().toISOString()
                        }
                    },
                    {
                        state: 'pending',
                        slice: {
                            slice_id: uuidv4(),
                            request: {
                                example: 'slice-autorecover-pending'
                            },
                            slicer_id: 0,
                            slicer_order: 3,
                            _created: new Date().toISOString()
                        }
                    }
                ],
                incompleteSliceCount: 1,
                completedSliceCount: 6,
                processedSliceCount: 5,
                analytics: false
            }
        ],
        [
            'when processing slices and the execution gets shutdown early',
            {
                slicerResults: [
                    { example: 'slice-shutdown-early' },
                    { example: 'slice-shutdown-early' },
                    { example: 'slice-shutdown-early' },
                    { example: 'slice-shutdown-early' }
                ],
                lifecycle: 'persistent',
                shutdownTimeout: 2000,
                shutdownEarly: true,
                incompleteSliceCount: 1,
                completedSliceCount: 1,
                processedSliceCount: 1,
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
            incompleteSliceCount = 0,
            completedSliceCount = 0,
            processedSliceCount = 0,
            lifecycle = 'once',
            reconnect = false,
            analytics = false,
            workers = 1,
            lastStatus,
            shutdownTimeout = 4000,
            shutdownEarly = false,
            cleanupType,
            isRecovery = false,
            autorecover = false,
            recoverySlices = []
        } = options;

        let exController;
        let testContext;
        let slices;
        let exStore;
        let stateStore;
        let shutdownEarlyFn;
        let exStatus;

        beforeAll(async () => {
            await TestContext.cleanupAll(true);
            await TestContext.waitForCleanup();

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
                autorecover,
                analytics
            });

            await testContext.addClusterMaster();

            await testContext.initialize(true, {
                isRecovery,
                cleanupType,
                lastStatus,
                recoverySlices
            });

            const { clusterMaster, exId } = testContext;

            stateStore = await testContext.addStateStore();
            exStore = await testContext.addExStore();

            if (shutdownEarly) {
                testContext.executionContext.slicer().maxQueueLength = () => 1;
            }

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

            shutdownEarlyFn = makeShutdownEarlyFn({
                enabled: shutdownEarly,
                exController
            });

            const workerClients = [];

            clusterMaster.onExecutionFinished(() => {
                workerClients.forEach((workerClient) => {
                    workerClient.shutdown();
                });
            });

            async function startWorker() {
                const workerId = newId('worker');
                const workerClient = new ExecutionControllerClient({
                    executionControllerUrl: `http://localhost:${port}`,
                    workerId,
                    networkLatencyBuffer,
                    workerDisconnectTimeout: 5000,
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

                    await stateStore.updateState(slice, 'completed');

                    async function completeSlice() {
                        await pDelay(0);
                        await workerClient.sendSliceComplete(msg);

                        await shutdownEarlyFn.shutdown();
                    }

                    await Promise.all([waitForReconnect(), completeSlice()]);

                    await processWork();
                }

                await processWork();
            }

            function startWorkers() {
                return Promise.all(times(workers, startWorker));
            }

            const requestAnayltics = setTimeout(async () => {
                try {
                    await clusterMaster.sendExecutionAnalyticsRequest(exId);
                } catch (err) {
                    // it shouldn't matter
                }
            }, 100);

            testContext.attachCleanup(() => clearTimeout(requestAnayltics));

            await Promise.all([shutdownEarlyFn.wait(), startWorkers(), exController.run()]);

            clearTimeout(requestAnayltics);

            exStatus = await exStore.get(exId);
        });

        afterAll(() => testContext.cleanup());

        it('should have the correct complete slices', async () => {
            const { exId } = testContext.executionContext;
            const recoverFrom = testContext.executionContext.config.recovered_execution;
            const exIds = recoverFrom ? [exId, recoverFrom] : [exId];
            expect(
                await stateStore.count(`ex_id:("${exIds.join('" OR "')}") AND state:completed`, 0)
            ).toEqual(completedSliceCount);
        });

        it('should have the correct incomplete slices', async () => {
            const { exId } = testContext.executionContext;
            const recoverFrom = testContext.executionContext.config.recovered_execution;
            const exIds = recoverFrom ? [exId, recoverFrom] : [exId];
            expect(
                await stateStore.count(`ex_id:("${exIds.join('" OR "')}") AND NOT state:completed`, 0)
            ).toEqual(incompleteSliceCount);
        });

        if (isRecovery) {
            it('should recover the correct slices', async () => {
                const { exId } = testContext.executionContext;
                const recoverFrom = testContext.executionContext.config.recovered_execution;
                expect(recoverFrom).toBeString();
                expect(recoverFrom).not.toEqual(exId);
                if (cleanupType) {
                    const actualCleanupType = testContext
                        .executionContext
                        .config
                        .recovered_slice_type;
                    expect(actualCleanupType).toEqual(cleanupType);
                }
            });
        }

        it('should process the right number of slices', async () => {
            if (shutdownEarly) {
                expect(slices.length).toBeGreaterThanOrEqual(processedSliceCount);
            } else {
                expect(slices).toBeArrayOfSize(processedSliceCount);
            }
        });

        it('should have the correct execution status', () => {
            const { exId } = testContext.executionContext;
            expect(exStatus).toBeObject();
            expect(exStatus).toHaveProperty('_slicer_stats.processed');
            expect(exStatus).toHaveProperty('_slicer_stats.queued');
            expect(exStatus).toHaveProperty('_slicer_stats.slicers');

            if (shutdownEarly) {
                expect(exStatus).toHaveProperty(
                    '_failureReason',
                    `execution ${exId} received shutdown before the slicer could complete, setting status to "terminated"`
                );
                expect(exStatus._slicer_stats.failed).toEqual(0);

                expect(exStatus).toMatchObject({
                    _has_errors: true,
                    _status: 'terminated'
                });
            } else {
                expect(exStatus).toMatchObject({
                    _has_errors: false,
                    _status: 'completed'
                });

                if (slicerQueueLength !== 'QUEUE_MINIMUM_SIZE') {
                    expect(exStatus._slicer_stats.processed).toEqual(processedSliceCount);
                }
            }

            expect(exStatus._slicer_stats.workers_joined).toBeGreaterThanOrEqual(1);

            if (reconnect && slicerQueueLength !== 'QUEUE_MINIMUM_SIZE') {
                expect(exStatus._slicer_stats.workers_reconnected).toBeGreaterThan(0);
            }
        });
    });
});
