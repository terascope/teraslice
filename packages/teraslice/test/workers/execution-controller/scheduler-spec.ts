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

        testContext.attachCleanup(() => scheduler.shutdown(Date.now() + 5000));
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

            scheduler.events.once('slicer:done', () => scheduler.stop(Date.now() + 5000));

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

    describe('when stopping', () => {
        beforeEach(() => scheduler.initialize(stateStorage, executionStorage));

        it('should resolve when the pending slices are written before the deadline', async () => {
            const runPromise = scheduler.run();
            await pDelay(50);

            await expect(scheduler.stop(Date.now() + 5000)).resolves.toBeUndefined();
            await runPromise;

            expect(scheduler.stopped).toBeTrue();
        });

        it('should stop waiting and log the unwritten slices when the deadline passes', async () => {
            let releaseWrite = () => {};
            // the write hangs until released
            stateStorage.createSlices = (exId: string, slices: any[]) => new Promise(
                (resolve) => {
                    releaseWrite = () => resolve(slices.length);
                }
            );
            // the slicer has one slice left to drain
            const pendingSlice = {
                slice_id: uuidv4(), slicer_id: 0, slicer_order: 1, request: {}
            };
            let drained = false;
            scheduler.ready = true;
            jest.spyOn(scheduler, '_getPendingSlices').mockImplementation(() => {
                if (drained) return [];
                drained = true;
                return [pendingSlice] as any[];
            });
            const errorSpy = jest.spyOn(scheduler.logger, 'error');

            const start = Date.now();
            await scheduler.stop(Date.now() + 200);

            expect(Date.now() - start).toBeLessThan(1000);
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining('timed out waiting for pending slices to be written')
            );
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining(pendingSlice.slice_id)
            );

            releaseWrite();
        });

        it('should wait for and log the writes already in flight when the deadline passes', async () => {
            const releases: (() => void)[] = [];
            const writtenIds: string[] = [];
            // every write hangs until released
            stateStorage.createSlices = (exId: string, slices: any[]) => {
                writtenIds.push(...slices.map((slice) => slice.slice_id));
                return new Promise((resolve) => {
                    releases.push(() => resolve(slices.length));
                });
            };
            const errorSpy = jest.spyOn(scheduler.logger, 'error');

            const runPromise = scheduler.run();
            // wait for the create interval to start a write
            while (!writtenIds.length) {
                await pDelay(5);
            }

            const start = Date.now();
            await scheduler.stop(Date.now() + 200);
            const elapsed = Date.now() - start;

            // without waiting for the writes in flight, stop() returned at once
            expect(elapsed).toBeGreaterThanOrEqual(150);
            expect(elapsed).toBeLessThan(1000);
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining('timed out waiting for pending slices to be written')
            );
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining(writtenIds[0])
            );

            releases.forEach((release) => release());
            await runPromise;
            expect(scheduler.pendingSlices).toEqual(0);
        });
    });

    describe('when a slice write fails on a persistent job', () => {
        let failWrites: boolean;
        let writes: number;
        let persistentContext: TestContext;
        let persistentScheduler: Scheduler;

        beforeEach(async () => {
            failWrites = true;
            writes = 0;

            persistentContext = new TestContext({
                assignment: 'execution_controller',
                slicers: 1,
                newOps: true,
                countPerSlicer: 1000,
                lifecycle: 'persistent' as any,
            });
            await persistentContext.initialize();

            persistentScheduler = new Scheduler(
                persistentContext.context, persistentContext.executionContext as any
            );
            await persistentScheduler.initialize({
                createSlices: async (_exId: string, slices: any[]) => {
                    writes++;
                    await pDelay(1);
                    if (failWrites) throw new Error('simulated bulk failure');
                    return slices.length;
                },
            } as any, executionStorage);

            // the fixture's slicerQueueLength has no effect with newOps,
            // so match data_generator with 1 worker
            jest.spyOn(persistentScheduler, 'maxQueueLength', 'get').mockReturnValue(3);

            persistentContext.attachCleanup(
                () => persistentScheduler.shutdown(Date.now() + 500)
            );
        });

        afterEach(() => persistentContext.cleanup());

        async function waitFor(condition: () => boolean, timeout = 3000) {
            const giveUpAt = Date.now() + timeout;
            while (!condition()) {
                if (Date.now() > giveUpAt) throw new Error('timed out waiting for condition');
                await pDelay(5);
            }
        }

        it('should release the slots of failed writes and create slices again', async () => {
            const runPromise = persistentScheduler.run();

            // with leaked slots, the 3 slot queue stalls after at most 3 failed slices
            await waitFor(() => writes > 3);

            failWrites = false;
            await waitFor(() => persistentScheduler.queueLength === 3);
            expect(persistentScheduler.pendingSlices).toEqual(3);

            await persistentScheduler.stop(Date.now() + 200);
            await runPromise;
        });

        it('should resolve run() after stop() following failed writes', async () => {
            const runPromise = persistentScheduler.run();
            await waitFor(() => writes > 3);

            await persistentScheduler.stop(Date.now() + 200);

            const resolved = await Promise.race([
                runPromise.then(() => true),
                pDelay(1000).then(() => false),
            ]);
            expect(resolved).toBeTrue();
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
