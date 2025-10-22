import { jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { pDelay, once, times } from '@terascope/core-utils';
import { TestContext } from '../helpers/test-context.js';
import { Scheduler } from '../../../src/lib/workers/execution-controller/scheduler.js';

describe('Scheduler', () => {
    const slicers = 3;
    const countPerSlicer = 200;
    let expectedCount: number;
    let testContext: TestContext;
    let scheduler: Scheduler;
    let stateStorage: any;
    let executionStorage: any;

    function getSlices(): Promise<any[]> {
        const slices: any[] = [];

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
        expectedCount = slicers * countPerSlicer;

        testContext = new TestContext({
            assignment: 'execution_controller',
            slicers,
            newOps: true,
            countPerSlicer
        });

        await testContext.initialize();

        scheduler = new Scheduler(testContext.context, testContext.executionContext as any);

        stateStorage = {
            async getStartingPoints(exId: string, numSlicers: any) {
                if (numSlicers !== slicers) {
                    throw new Error(`Got invalid slicer ids, ${numSlicers.join(' ')}`);
                }
            },
            createState: () => pDelay(0),
            createSlices: async (exId: string, slices: any[]) => {
                if (!exId || typeof exId !== 'string' || exId !== testContext.exId) {
                    throw new Error(`Got invalid ex_id ${exId}`);
                }
                await pDelay(0);
                return slices.length;
            }
        };

        executionStorage = {
            async get() {
                return { slicers };
            },
            setStatus: jest.fn(() => pDelay(0)),
        };

        testContext.attachCleanup(() => scheduler.shutdown());
    });

    afterEach(() => testContext.cleanup());

    describe('when testing a normal execution', () => {
        beforeEach(() => scheduler.initialize(stateStorage, executionStorage));

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
            ] as any[]);

            scheduler.enqueueSlice({ slice_id: 1 } as any);

            scheduler.enqueueSlice(
                {
                    slice_id: 3
                } as any,
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
            let slices: any[] = [];

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
            let slices: any[] = [];

            const pause = once(() => {
                scheduler.pause();
                setTimeout(() => scheduler.start(), 10);
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
            let slices: any[] = [];

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
        let recoveryRecords: any[];
        let emitDone: any;
        let exitAfterComplete = false;

        beforeEach(() => {
            emitDone = once(() => {
                scheduler.events.emit('execution:recovery:complete', []);
            });
            // @ts-expect-error
            scheduler.recoverExecution = true;
            scheduler.recovering = true;
            // @ts-expect-error
            scheduler.recover = {
                initialize() {
                    return Promise.resolve();
                },
                shutdown() {
                    return Promise.resolve();
                },
                // @ts-expect-error
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

            return scheduler.initialize(stateStorage, executionStorage);
        });

        it('should handle recovery correctly and exit', async () => {
            recoveryRecords = times(countPerSlicer * slicers, () => ({
                slice_id: uuidv4(),
                slicer_id: 1,
                slicer_order: 0,
                request: {
                    id: `recover-${Math.random()}`
                },
                _created: new Date().toISOString()
            }));

            let slices: any[] = [];

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

            recoveryRecords = times(countPerSlicer, () => ({
                slice_id: uuidv4(),
                slicer_id: 1,
                slicer_order: 0,
                request: {
                    id: `recover-${Math.random()}`
                },
                _created: new Date().toISOString()
            }));

            let slices: any[] = [];

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
