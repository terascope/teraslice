import events from 'events';
import analyticsCode from '../../../lib/workers/execution-controller/slice-analytics';

const eventEmitter = new events.EventEmitter();

describe('slice_analytics', () => {
    const logMessages = [];
    const logger = {
        error() {},
        info(msg) { logMessages.push(msg); },
        warn() {},
        trace() {},
        debug() {}
    };

    const context = {
        apis: {
            foundation: {
                makeLogger: () => logger,
                getSystemEvents: () => eventEmitter
            }
        }
    };
    const executionContext = {
        config: {
            slicers: 2,
            operations: [{ _op: 'config1' }, { _op: 'config2' }, { _op: 'config3' }]
        },
        ex_id: '1234',
        job_id: '5678'
    };

    const analytics = analyticsCode(context, executionContext);

    it('addStats transfers message stats to the statsContainer', () => {
        const statsObj = analytics.getStats();
        const data = { time: [234, 125, 1300], size: [2300, 4600], memory: [1234, 4567] };
        const data2 = { time: [346, 325, 1102], size: [1120, 2240], memory: [12345, 56789] };

        expect(statsObj.size[0]).toMatchObject({
            min: 0,
            max: 0,
            sum: 0,
            total: 0,
            average: 0,
        });
        expect(statsObj.time[0]).toMatchObject({
            min: 0,
            max: 0,
            sum: 0,
            total: 0,
            average: 0,
        });
        expect(statsObj.memory[0]).toMatchObject({
            min: 0,
            max: 0,
            sum: 0,
            total: 0,
            average: 0,
        });

        analytics.addStats(data);

        expect(statsObj.size[0]).toMatchObject({
            min: 2300,
            max: 2300,
            sum: 2300,
            total: 1,
            average: 2300,
        });
        expect(statsObj.time[0]).toMatchObject({
            min: 234,
            max: 234,
            sum: 234,
            total: 1,
            average: 234,
        });
        expect(statsObj.memory[0]).toMatchObject({
            min: 1234,
            max: 1234,
            sum: 1234,
            total: 1,
            average: 1234,
        });

        analytics.addStats(data2);

        expect(statsObj.size[0]).toMatchObject({
            min: 1120,
            max: 2300,
            sum: 3420,
            total: 2,
            average: 1710,
        });
        expect(statsObj.time[0]).toMatchObject({
            min: 234,
            max: 346,
            sum: 580,
            total: 2,
            average: 290,
        });
        expect(statsObj.memory[0]).toMatchObject({
            min: 1234,
            max: 12345,
            sum: 13579,
            total: 2,
            average: 6789.5,
        });
    });

    it('statsContainer takes in job.operations and returns an object for the number of ops', () => {
        const results = analytics.getStats();

        expect(results).toBeDefined();
        expect(results.time).toBeDefined();
        expect(results.size).toBeDefined();
        expect(Array.isArray(results.time)).toBe(true);
        expect(Array.isArray(results.size)).toBe(true);
        expect(results.time.length).toEqual(3);
        expect(results.size.length).toEqual(3);
        expect(results.memory.length).toEqual(3);
    });

    it('analyzeStats will log results', () => {
        analytics.analyzeStats();
        expect(logMessages.shift()).toEqual('calculating statistics');
        expect(logMessages.shift()).toContain('operation config1');
        expect(logMessages.shift()).toContain('operation config2');
        expect(logMessages.shift()).toContain('operation config3');
    });
});
