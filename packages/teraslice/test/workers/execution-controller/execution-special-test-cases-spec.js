'use strict';

const uuidv4 = require('uuid/v4');
const { pDelay, times, random } = require('@terascope/utils');
const { RecoveryCleanupType } = require('@terascope/job-components');
const Messaging = require('@terascope/teraslice-messaging');
const { TestContext } = require('../helpers');
const { makeShutdownEarlyFn, getTestCases } = require('../helpers/execution-controller-helper');
const ExecutionController = require('../../../lib/workers/execution-controller');
const { findPort } = require('../../../lib/utils/port_utils');
const { newId } = require('../../../lib/utils/id_utils');

const ExecutionControllerClient = Messaging.ExecutionController.Client;
process.env.BLUEBIRD_LONG_STACK_TRACES = '1';

describe('ExecutionController Special Tests', () => {
    // [ message, config ]
    const testCases = [
        [
            'recovering a slicer no cleanup type',
            {
                slicerResults: [{ example: 'slice-recovery' }, { example: 'slice-recovery' }, null],
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
                body: { example: 'slice-recovery' },
                count: 4,
                finalCount: 2,
                analytics: true
            }
        ],
        [
            'recovering with no slices to recover',
            {
                slicerResults: [{ example: 'slice-recovery' }, { example: 'slice-recovery' }, null],
                isRecovery: true,
                recoverySlices: [],
                body: { example: 'slice-recovery' },
                count: 2,
                analytics: true
            }
        ],
        [
            'recovering a slicer with a cleanup type of errors',
            {
                slicerResults: [{ example: 'slice-recovery-error' }, null],
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
                body: { example: 'slice-recovery-error' },
                count: 1,
                finalCount: 0,
                analytics: false
            }
        ],
        [
            'recovering a slicer with a cleanup type of all',
            {
                slicerResults: [{ example: 'slice-recovery-all' }, null],
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
                body: { example: 'slice-recovery-all' },
                count: 2,
                finalCount: 0,
                analytics: true
            }
        ],
        [
            'processing slices and the execution gets shutdown early',
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
                body: { example: 'slice-shutdown-early' },
                count: 1,
                analytics: false
            }
        ]
    ];

    // for testing add a "only" property to the test cases you want
    // or add a skip property to the test cases you don't want
    describe.each(getTestCases(testCases))('when %s', (m, options) => {
        const {
            slicerResults,
            slicerQueueLength,
            count,
            finalCount = count,
            lifecycle = 'once',
            body,
            reconnect = false,
            analytics = false,
            workers = 1,
            lastStatus,
            shutdownTimeout = 4000,
            shutdownEarly = false,
            cleanupType,
            isRecovery = false,
            recoverySlices = []
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
        });

        afterEach(() => testContext.cleanup());

        it('should still process the execution correctly', async () => {
            const { exId } = testContext.executionContext;
            if (isRecovery) {
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
            }

            if (shutdownEarly) {
                expect(slices.length).toBeGreaterThanOrEqual(count);
            } else {
                expect(slices).toBeArrayOfSize(count);
                times(finalCount, (i) => {
                    const slice = slices[i];
                    expect(slice).toMatchObject({
                        request: body
                    });
                });
            }

            const exStatus = await exStore.get(exId);
            expect(exStatus).toBeObject();
            expect(exStatus).toHaveProperty('_slicer_stats');

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
                    expect(exStatus._slicer_stats.processed).toEqual(count);
                }

                const query = `ex_id:"${exId}" AND state:completed`;
                const actualCount = await stateStore.count(query, 0);
                expect(actualCount).toEqual(finalCount);
            }

            expect(exStatus._slicer_stats.workers_joined).toBeGreaterThanOrEqual(1);

            if (reconnect && slicerQueueLength !== 'QUEUE_MINIMUM_SIZE') {
                expect(exStatus._slicer_stats.workers_reconnected).toBeGreaterThan(0);
            }
        });
    });
});
