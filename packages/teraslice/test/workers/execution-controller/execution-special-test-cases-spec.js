'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const Messaging = require('@terascope/teraslice-messaging');
const { TestContext } = require('../helpers');
const { makeShutdownEarlyFn, getTestCases } = require('../helpers/execution-controller-helper');
const ExecutionController = require('../../../lib/workers/execution-controller');
const { findPort } = require('../../../lib/utils/port_utils');
const { newId } = require('../../../lib/utils/id_utils');

const ExecutionControllerClient = Messaging.ExecutionController.Client;
process.env.BLUEBIRD_LONG_STACK_TRACES = '1';

// FIXME
xdescribe('ExecutionController Special Tests', () => {
    // [ message, config ]
    const testCases = [
        [
            'recovering a slicer no cleanup type',
            {
                slicerResults: [
                    { example: 'slice-recovery' },
                    { example: 'slice-recovery' },
                    null
                ],
                recover: true,
                recoverySlices: [
                    {
                        state: 'start',
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
                count: 4,
                analytics: _.sample([true, false]),
            }
        ],
        [
            'recovering with no slices to recover',
            {
                slicerResults: [
                    { example: 'slice-recovery' },
                    { example: 'slice-recovery' },
                    null
                ],
                recover: true,
                recoverySlices: [],
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
            shutdownTimeout = 4000,
            shutdownEarly = false,
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

            if (shutdownEarly) {
                testContext.executionContext.queueLength = 1;
            }

            if (recover) {
                testContext.executionContext.config.recovered_execution = exId;

                if (cleanupType) {
                    testContext.executionContext.config.recovered_slice_type = cleanupType;
                }

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

                    await stateStore.updateState(slice, 'completed');

                    async function completeSlice() {
                        await Promise.delay(0);
                        await workerClient.sendSliceComplete(msg);

                        await shutdownEarlyFn.shutdown();
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
            const { exId } = testContext.executionContext;

            if (shutdownEarly) {
                expect(slices.length).toBeGreaterThanOrEqual(count);
            } else {
                expect(slices).toBeArrayOfSize(count);
                _.times(count, (i) => {
                    const slice = slices[i];
                    expect(slice).toHaveProperty('request');
                    expect(slice.request).toEqual(body);
                });
            }

            const exStatus = await exStore.get(exId);
            expect(exStatus).toBeObject();
            expect(exStatus).toHaveProperty('_slicer_stats');

            if (shutdownEarly) {
                expect(exStatus).toHaveProperty('_failureReason', `execution ${exId} received shutdown before the slicer could complete, setting status to "terminated"`);
                expect(exStatus._slicer_stats.failed).toEqual(0);

                expect(exStatus).toHaveProperty('_has_errors', true);
                expect(exStatus).toHaveProperty('_status', 'terminated');
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
        });
    });
});
