import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { pDelay } from '@terascope/utils';
import TestContext from '../helpers/test-context';
import Scheduler from '../../../lib/workers/execution-controller/scheduler';

describe('Scheduler', () => {
    const slicers = 3;
    const countPerSlicer = 200;
    let expectedCount;
    let testContext;
    let scheduler;

    function getSlices() {
        const slices = [];

        return new Promise((resolve) => {
            const intervalId = setInterval(() => {
                if (scheduler.isFinished) {
                    clearInterval(intervalId);
                    resolve(slices);
                } else {
                    const result = scheduler.getSlices(100);
                    if (result.length > 0) {
                        slices.push(...result);
                    }
                }
            }, 1);
        });
    }

    beforeEach(async () => {
        await TestContext.cleanupAll(true);
        await TestContext.waitForCleanup();

        expectedCount = slicers * countPerSlicer;

        testContext = new TestContext({
            assignment: 'execution_controller',
            slicers,
            newOps: true,
            countPerSlicer
        });

        await testContext.initialize();

        scheduler = new Scheduler(testContext.context, testContext.executionContext);

        scheduler.stateStore = {
            async getStartingPoints(exId, numSlicers) {
                if (numSlicers !== slicers) {
                    throw new Error(`Got invalid slicer ids, ${numSlicers.join(' ')}`);
                }
            },
            createState: () => pDelay(0),
            createSlices: async (exId, slices) => {
                if (!exId || typeof exId !== 'string' || exId !== testContext.exId) {
                    throw new Error(`Got invalid ex_id ${exId}`);
                }
                await pDelay(0);
                return slices.length;
            }
        };

        scheduler.exStore = {
            async get() {
                return { slicers };
            },
            setStatus: jest.fn(() => pDelay(0)),
        };

        testContext.attachCleanup(() => scheduler.shutdown());
    });

    afterEach(() => testContext.cleanup());

    describe('when testing a normal execution', () => {
        beforeEach(() => scheduler.initialize());

        it('should be constructed wih the correct values', async () => {
            expect(scheduler.slicersDone).toBeFalse();
            expect(scheduler.ready).toBeFalse();
            expect(scheduler.paused).toBeTrue();
            expect(scheduler.stopped).toBeFalse();
            expect(scheduler.queueLength).toEqual(0);
            expect(scheduler.isFinished).toBeFalse();
        });

        it('should be able to reenqueue a slice', () => {
            scheduler.enqueueSlices([
                {
                    slice_id: 1
                },
                {
                    slice_id: 2
                }
            ]);

            scheduler.enqueueSlice({ slice_id: 1 });

            scheduler.enqueueSlice(
                {
                    slice_id: 3
                },
                true
            );

            const slices = scheduler.getSlices(100);
            expect(slices).toEqual([
                {
                    slice_id: 3
                },
                {
                    slice_id: 1
                },
                {
                    slice_id: 2
                }
            ]);
        });

        it(`should be able to schedule ${expectedCount} slices`, async () => {
            let slices = [];

            await Promise.all([
                scheduler.run(),
                getSlices().then((_slices) => {
                    slices = _slices;
                })
            ]);

            expect(scheduler.paused).toBeFalse();
            expect(scheduler.slicersDone).toBeTrue();
            expect(scheduler.queueLength).toEqual(0);
            expect(slices).toHaveLength(expectedCount);
            expect(scheduler.isFinished).toBeTrue();
        });

        it('should handle pause and resume correctly', async () => {
            let slices = [];

            const pause = _.once(() => {
                scheduler.pause();
                _.delay(() => scheduler.start(), 10);
            });

            scheduler.events.on('slicer:done', pause);

            await Promise.all([
                scheduler.run(),
                getSlices().then((_slices) => {
                    slices = _slices;
                })
            ]);

            expect(slices).toHaveLength(expectedCount);
            expect(scheduler.isFinished).toBeTrue();
            expect(scheduler.slicersDone).toBeTrue();
        });

        it('should handle stop correctly', async () => {
            let slices = [];

            scheduler.events.once('slicer:done', () => scheduler.stop());

            await Promise.all([
                scheduler.run(),
                getSlices().then((_slices) => {
                    slices = _slices;
                })
            ]);

            // be more flexible
            const min = expectedCount - slicers * 8;
            const max = expectedCount + slicers * 8;
            expect(slices.length).toBeWithin(min, max);

            expect(scheduler.isFinished).toBeTrue();
            expect(scheduler.stopped).toBeTrue();
            expect(scheduler.slicersDone).toBeFalse();
        });
    });

    describe('when testing recovery', () => {
        let recoveryRecords;
        let emitDone;
        let exitAfterComplete = false;

        beforeEach(() => {
            emitDone = _.once(() => {
                scheduler.events.emit('execution:recovery:complete', []);
            });

            scheduler.recoverExecution = true;
            scheduler.recovering = true;
            scheduler.recover = {
                initialize() {
                    return Promise.resolve();
                },
                shutdown() {
                    return Promise.resolve();
                },
                handle() {
                    return recoveryRecords.length === 0;
                },
                getSlices(max = 1) {
                    const result = recoveryRecords.splice(0, max);
                    if (!recoveryRecords.length) {
                        emitDone();
                    }
                    return result;
                },
                recoveryComplete() {
                    if (!recoveryRecords.length) {
                        emitDone();
                        return true;
                    }
                    return false;
                },
                sliceCount() {
                    return 10;
                },
                exitAfterComplete() {
                    return exitAfterComplete;
                }
            };

            return scheduler.initialize();
        });

        it('should handle recovery correctly and exit', async () => {
            recoveryRecords = _.times(countPerSlicer * slicers, () => ({
                slice_id: uuidv4(),
                slicer_id: 1,
                slicer_order: 0,
                request: {
                    id: _.uniqueId('recover-')
                },
                _created: new Date().toISOString()
            }));

            let slices = [];

            expectedCount += recoveryRecords.length;

            await Promise.all([
                scheduler.run(),
                getSlices().then((_slices) => {
                    slices = _slices;
                })
            ]);

            expect(slices).toHaveLength(expectedCount);
            expect(scheduler.ready).toBeTrue();
            expect(scheduler.isFinished).toBeTrue();
            expect(scheduler.stopped).toBeFalse();
            expect(scheduler.recovering).toBeFalse();
            expect(scheduler.slicersDone).toBeTrue();
        });

        it('should handle recovery with cleanup type correctly and not exit', async () => {
            exitAfterComplete = true;

            recoveryRecords = _.times(countPerSlicer, () => ({
                slice_id: uuidv4(),
                slicer_id: 1,
                slicer_order: 0,
                request: {
                    id: _.uniqueId('recover-')
                },
                _created: new Date().toISOString()
            }));

            let slices = [];

            expectedCount = recoveryRecords.length;

            await Promise.all([
                scheduler.run(),
                getSlices().then((_slices) => {
                    slices = _slices;
                })
            ]);

            expect(slices).toHaveLength(expectedCount);
            expect(scheduler.ready).toBeFalse();
            expect(scheduler.isFinished).toBeTrue();
            expect(scheduler.stopped).toBeFalse();
            expect(scheduler.recovering).toBeFalse();
            expect(scheduler.slicersDone).toBeTrue();
        });
    });
});
