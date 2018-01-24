'use strict';

const analyticsCode = require('../../lib/cluster/execution_controller/slice_analytics');
const _ = require('lodash');
const events = require('events');

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
            foundation: { makeLogger: () => logger,
                getSystemEvents: () => eventEmitter
            }
        }
    };
    const executionContext = {
        config: {
            slicers: 2,
            operations: [{ _op: 'config1' }, { _op: 'config2' }, { _op: 'config3' }]
        }
    };

    const testConfig = { ex_id: '1234', job_id: '5678' };
    const analytics = analyticsCode(context, executionContext);
    const statContainer = analytics.__test_context(testConfig).sliceAnalytics;

    it('addStats transfers message stats to the statsContainer', () => {
        const statsObj = statContainer;
        const data = { time: [234, 125, 1300], size: [2300, 4600], memory: [1234, 4567] };
        const data2 = { time: [346, 325, 1102], size: [1120, 2240], memory: [12345, 56789] };

        expect(statsObj.size[0].length).toEqual(0);
        expect(statsObj.time[0].length).toEqual(0);
        expect(statsObj.memory[0].length).toEqual(0);

        analytics.addStats(data);

        expect(statsObj.size[0].length).toEqual(1);
        expect(statsObj.time[0].length).toEqual(1);
        expect(statsObj.memory[0].length).toEqual(1);

        expect(_.flatten(statsObj.size)).toEqual(data.size);
        expect(_.flatten(statsObj.time)).toEqual(data.time);
        expect(_.flatten(statsObj.memory)).toEqual(data.memory);

        analytics.addStats(data2);

        expect(statsObj.size[0].length).toEqual(2);
        expect(statsObj.time[0].length).toEqual(2);
        expect(statsObj.memory[0].length).toEqual(2);

        expect(_.flatten(statsObj.size)).toEqual(_.flatten(_.zip(data.size, data2.size)));
        expect(_.flatten(statsObj.time)).toEqual(_.flatten(_.zip(data.time, data2.time)));
        expect(_.flatten(statsObj.memory)).toEqual(_.flatten(_.zip(data.memory, data2.memory)));
    });

    it('calculateStats takes an array of ints and returns an obj that has the  min, max, and total of ints', () => {
        const data = [232, 254, 345, 112, 367, 343, 321, 213, 222, 245];
        const results = analytics.__test_context({})._calculateStats(data);

        expect(results).toBeDefined();
        expect(results.max).toEqual(367);
        expect(results.min).toEqual(112);
        // toFixed returns a string
        expect(results.average).toEqual('265.40');
    });

    it('statsContainer takes in job.operations and returns an object for the number of ops', () => {
        const results = statContainer;

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
        expect(logMessages.shift().includes('operation config1')).toEqual(true);
        expect(logMessages.shift().includes('operation config2')).toEqual(true);
        expect(logMessages.shift().includes('operation config3')).toEqual(true);
    });
});
