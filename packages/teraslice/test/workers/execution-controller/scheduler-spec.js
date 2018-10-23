'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const TestContext = require('../helpers/test-context');
const Scheduler = require('../../../lib/workers/execution-controller/scheduler');

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
        expectedCount = slicers * countPerSlicer;

        testContext = new TestContext({
            assignment: 'execution_controller',
            slicers,
            newOps: true,
            countPerSlicer
        });

        await testContext.initialize();

        scheduler = new Scheduler(
            testContext.context,
            testContext.executionContext
        );

        scheduler.stateStore = {
            createState: () => Promise.delay()
        };

        testContext.attachCleanup(() => scheduler.shutdown());
    });

    afterEach(() => testContext.cleanup());

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
                slice_id: 1,
            },
            {
                slice_id: 2,
            }
        ]);

        scheduler.enqueueSlice({ slice_id: 1 });

        scheduler.enqueueSlice({
            slice_id: 3
        }, true);

        const slices = scheduler.getSlices(100);
        expect(slices).toEqual([
            {
                slice_id: 3,
            },
            {
                slice_id: 1,
            },
            {
                slice_id: 2,
            }
        ]);
    });

    it(`should be able to schedule ${expectedCount} slices`, async () => {
        let slices = [];

        await Promise.all([
            scheduler.run(),
            getSlices().then((_slices) => { slices = _slices; }),
        ]);

        expect(scheduler.paused).toBeFalse();
        expect(scheduler.slicersDone).toBeTrue();
        expect(scheduler.queueLength).toEqual(0);
        expect(slices).toBeArrayOfSize(expectedCount);
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
            getSlices().then((_slices) => { slices = _slices; }),
        ]);

        expect(slices).toBeArrayOfSize(expectedCount);
        expect(scheduler.isFinished).toBeTrue();
        expect(scheduler.slicersDone).toBeTrue();
    });

    it('should handle stop correctly', async () => {
        let slices = [];

        const stop = _.once(() => scheduler.stop());

        scheduler.events.on('slicer:done', stop);

        await Promise.all([
            scheduler.run(),
            getSlices().then((_slices) => { slices = _slices; }),
        ]);

        const min = expectedCount - slicers;
        const max = expectedCount + slicers;
        expect(slices.length).toBeWithin(min, max);

        expect(scheduler.isFinished).toBeTrue();
        expect(scheduler.stopped).toBeTrue();
        expect(scheduler.slicersDone).toBeFalse();
    });

    it('should handle recovery correctly', async () => {
        const recoveryRecords = _.times(countPerSlicer * slicers, () => ({ id: _.uniqueId('recover-') }));
        let slices = [];

        scheduler.recoverExecution = true;
        scheduler.recovering = true;
        scheduler.recover = {
            initialize() {
                return Promise.resolve();
            },
            shutdown() {
                return Promise.resolve();
            },
            getSlices(max = 1) {
                const result = recoveryRecords.splice(0, max);
                if (!result.length) {
                    this.events.emit('execution:recovery:complete', []);
                }
                return result;
            },
            recoveryComplete() {
                return recoveryRecords.length === 0;
            },
            exitAfterComplete() {
                return false;
            }
        };

        expectedCount += recoveryRecords.length;

        await Promise.all([
            scheduler.run(),
            getSlices().then((_slices) => { slices = _slices; }),
        ]);

        expect(slices).toBeArrayOfSize(expectedCount);
        expect(scheduler.ready).toBeTrue();
        expect(scheduler.isFinished).toBeTrue();
        expect(scheduler.stopped).toBeFalse();
        expect(scheduler.recovering).toBeFalse();
        expect(scheduler.slicersDone).toBeTrue();
    });

    it('should handle recovery with cleanup type correctly', async () => {
        const recoveryRecords = _.times(countPerSlicer, () => ({ id: _.uniqueId('recover-') }));

        let slices = [];

        scheduler.recoverExecution = true;
        scheduler.recovering = true;
        scheduler.recover = {
            initialize() {
                return Promise.resolve();
            },
            shutdown() {
                return Promise.resolve();
            },
            getSlices(max = 1) {
                const result = recoveryRecords.splice(0, max);
                if (!result.length) {
                    this.events.emit('execution:recovery:complete', []);
                }
                return result;
            },
            recoveryComplete() {
                return recoveryRecords.length === 0;
            },
            exitAfterComplete() {
                return true;
            }
        };

        expectedCount = recoveryRecords.length;

        await Promise.all([
            scheduler.run(),
            getSlices().then((_slices) => { slices = _slices; }),
        ]);

        expect(slices).toBeArrayOfSize(expectedCount);
        expect(scheduler.ready).toBeFalse();
        expect(scheduler.isFinished).toBeTrue();
        expect(scheduler.stopped).toBeFalse();
        expect(scheduler.recovering).toBeFalse();
        expect(scheduler.slicersDone).toBeTrue();
    });
});
