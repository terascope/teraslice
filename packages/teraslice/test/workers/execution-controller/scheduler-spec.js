'use strict';

const times = require('lodash/times');
const uniqueId = require('lodash/uniqueId');
const Promise = require('bluebird');
const TestContext = require('../helpers/test-context');
const Scheduler = require('../../../lib/workers/execution-controller/scheduler');

describe('Scheduler', () => {
    const slicers = 5;
    const countPerSlicer = 200;
    const expectedCount = slicers * countPerSlicer;

    const testContext = new TestContext({
        assignment: 'execution_controller',
        slicers
    });

    let scheduler;

    beforeAll(async () => {
        await testContext.initialize();

        scheduler = new Scheduler(
            testContext.context,
            testContext.executionContext
        );

        const newSlicer = (id) => {
            const records = times(countPerSlicer, () => ({ id: uniqueId(`slicer-${id}-`) }));
            return async () => {
                await Promise.delay(0);
                return records.shift();
            };
        };

        await scheduler.registerSlicers(times(slicers, newSlicer));

        testContext.attachCleanup(() => scheduler.cleanup());
    });

    afterAll(() => testContext.cleanup());

    it('should register the slicers', async () => {
        expect(scheduler.slicers).toBeArrayOfSize(slicers);
        expect(scheduler.slicersDone).toBeFalse();

        expect(scheduler.ready).toBeTrue();
        expect(scheduler.paused).toBeTrue();
        expect(scheduler.queueLength).toEqual(0);
        expect(scheduler.isFinished).toBeFalse();
    });

    it(`should be able to schedule ${expectedCount} slices`, async () => {
        const slices = [];

        const getSlices = () => new Promise((resolve) => {
            const intervalId = setInterval(() => {
                if (scheduler.isFinished) {
                    clearInterval(intervalId);
                    resolve();
                } else {
                    const slice = scheduler.getSlice();
                    if (slice) {
                        slices.push(slice);
                    }
                }
            }, 1);
        });

        await Promise.all([
            scheduler.run(),
            getSlices(),
        ]);

        expect(scheduler.paused).toBeFalse();
        expect(scheduler.slicers).toBeArrayOfSize(slicers);
        expect(scheduler.slicersDone).toBeTrue();
        expect(scheduler.queueLength).toEqual(0);
        expect(slices).toBeArrayOfSize(expectedCount);
        expect(scheduler.isFinished).toBeTrue();
    });
});
