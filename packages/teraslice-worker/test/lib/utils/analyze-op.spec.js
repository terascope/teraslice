'use strict';

const times = require('lodash/times');
const map = require('lodash/map');
const mean = require('lodash/mean');
const { analyzeOp, getMemoryUsage } = require('../../../lib/utils/ops');

const GB = 1024 * 1024 * 1024;
const MEM_DIFF = GB;
const TIME_DIFF = 1000;

describe('Operation Analytics', () => {
    it('should throw an error if constructed without a fn', () => {
        expect(() => analyzeOp()).toThrowError('Operation analytics requires a valid op function');
    });

    it('should throw an error if constructed without a fn', () => {
        expect(() => analyzeOp(jest.fn())).toThrowError('Operation analytics requires a valid index');
    });

    it('should return a function', () => {
        const op = jest.fn();
        const analyzedFn = analyzeOp(op, 0);
        expect(analyzedFn).toBeFunction();
        expect(op).not.toHaveBeenCalled();
    });

    describe('when using an array', () => {
        it('should mutate the analytics object being passed', async () => {
            const count = 10;
            const input = times(count);
            const op = (data) => {
                const add = n => Promise.delay(count).then(() => n + 1);
                return Promise.mapSeries(data, add);
            };
            const analyticsData = { time: [], size: [], memory: [] };
            const numberOfOps = 5;
            const expectedMem = getMemoryUsage();

            await Promise.each(times(numberOfOps), async (i) => {
                const analyzedFn = analyzeOp(op, i);

                const result = await analyzedFn(analyticsData, input);

                expect(result).toEqual(map(input, n => n + 1));

                expect(analyticsData).toContainAllKeys(['time', 'size', 'memory']);

                const expectedTime = count * count;
                expect(analyticsData.time[i]).toBeWithin(expectedTime, expectedTime + TIME_DIFF);

                expect(analyticsData.size[i]).toEqual(count);

                const memLower = expectedMem - MEM_DIFF;
                const memUpper = expectedMem + MEM_DIFF;
                expect(analyticsData.memory[i]).toBeWithin(memLower, memUpper);
            });

            expect(analyticsData.time).toBeArrayOfSize(numberOfOps);
            expect(analyticsData.size).toBeArrayOfSize(numberOfOps);
            expect(analyticsData.memory).toBeArrayOfSize(numberOfOps);
        });
    });

    describe('when using hit.hits', () => {
        it('should mutate the analytics object being passed', async () => {
            const count = 10;
            const input = {
                hits: {
                    hits: times(count)
                }
            };
            const op = (data) => {
                const add = n => Promise.delay(count).then(() => n * 2);
                return Promise.mapSeries(data.hits.hits, add)
                    .then(hits => ({ hits: { hits } }));
            };
            const analyticsData = { time: [], size: [], memory: [] };
            const numberOfOps = 5;
            const expectedMem = getMemoryUsage() + MEM_DIFF;

            await Promise.each(times(numberOfOps), async (i) => {
                const analyzedFn = analyzeOp(op, i);

                const result = await analyzedFn(analyticsData, input);
                const expectedResult = {
                    hits: {
                        hits: times(count, n => n * 2)
                    }
                };
                expect(result).toEqual(expectedResult);

                expect(analyticsData).toContainAllKeys(['time', 'size', 'memory']);

                const expectedTime = count * count;
                expect(analyticsData.time[i]).toBeWithin(expectedTime, expectedTime + TIME_DIFF);

                expect(analyticsData.size[i]).toEqual(count);

                expect(analyticsData.memory[i]).toBeWithin(-expectedMem, expectedMem);
            });

            expect(analyticsData.time).toBeArrayOfSize(numberOfOps);
            expect(analyticsData.size).toBeArrayOfSize(numberOfOps);
            expect(analyticsData.memory).toBeArrayOfSize(numberOfOps);
        });
    });

    it('should return size of 0 if returning a non-array as the result', async () => {
        const analyticsData = { time: [], size: [], memory: [] };
        const op = () => 'hello';
        const analyzedFn = analyzeOp(op, 0);
        await analyzedFn(analyticsData, []);
        expect(analyticsData.size).toBeArrayOfSize(1);
        expect(analyticsData.size[0]).toEqual(0);
    });

    xit('should be performant', async () => {
        const runTest = (size) => {
            const analyticsData = { time: [], size: [], memory: [] };
            let str = '';
            return Promise.each(times(100), (index) => {
                const op = () => {
                    str += JSON.stringify(times(size));
                    return Promise.delay(1);
                };
                const analyzedFn = analyzeOp(op, index);
                return analyzedFn(analyticsData, []);
            }).then(() => {
                expect(str.length).toBeGreaterThan(size);
                const meanMem = mean(analyticsData.memory);
                const meanTime = mean(analyticsData.time);
                return { meanTime, meanMem };
            });
        };

        await Promise.delay(1000); // give time to garbage collect

        const smallTest = await runTest(1000);

        await Promise.delay(1000); // give time to garbage collect

        const bigTest = await runTest(100000);
        console.dir({ bigTest, smallTest }); // eslint-disable-line
    });
});
