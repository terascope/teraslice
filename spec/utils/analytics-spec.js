'use strict';

var Promise = require('bluebird');
var analytics = require('../../lib/utils/analytics');
var _ = require('lodash');

describe('analytics', function() {

    beforeAll(function() {
        jasmine.clock().install();
    });

    afterAll(function() {
        jasmine.clock().uninstall();
    });

    it('analyze returns a function what captures the time it took to complete a step, data in and data out', function(done) {

        var fn = function(data) {
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    resolve(data)
                }, 1000);
            });
        };

        var analyticsObj = {time: [], size: [], memory: []};
        var data = [{some: 'insideData'}];

        var analyze = analytics.analyze(fn);
        var results = analyze(analyticsObj, data);

        jasmine.clock().tick(1001);

        results.then(function(data) {

            expect(Array.isArray(data)).toBe(true);
            expect(data[0].some).toEqual('insideData');
            expect(analyticsObj.time.length).toEqual(1);
            expect(analyticsObj.size.length).toEqual(1);
            expect(analyticsObj.memory.length).toEqual(1);

            expect(analyticsObj.time[0] >= 0).toBe(true);
            expect(analyticsObj.size[0]).toEqual(1);
            expect(analyticsObj.memory[0] >= 0).toBe(true);

            done();
        });
    });

    it('insertAnalyzers takes an array of functions and returns them wrapped with the analyze function', function() {
        var fnArray = [function() {
        }, function() {
        }];
        var results = analytics.insertAnalyzers(fnArray);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toEqual(2);
        expect(typeof results[0]).toEqual('function');
        expect(results[0].toString()).toEqual(analytics.analyze().toString());

    });

    it('statsContainer takes in job.operations and returns an object for the number of ops', function() {
        var ops = [{ops1: 'config1'}, {ops2: 'config2'}, {ops3: 'config3'}];

        var results = analytics.statContainer(ops);

        expect(results).toBeDefined();
        expect(results.time).toBeDefined();
        expect(results.size).toBeDefined();
        expect(Array.isArray(results.time)).toBe(true);
        expect(Array.isArray(results.size)).toBe(true);
        expect(results.time.length).toEqual(3);
        expect(results.size.length).toEqual(3);
        expect(results.memory.length).toEqual(3);
    });

    it('addStats transfers message stats to the statsContainer', function() {
        var ops = [{ops1: 'config1'}, {ops2: 'config2'}, {ops3: 'config3'}];
        var statsObj = analytics.statContainer(ops);
        var data = {time: [234, 125, 1300], size: [2300, 4600], memory: [1234, 4567]};
        var data2 = {time: [346, 325, 1102], size: [1120, 2240], memory: [12345, 56789]};

        expect(statsObj.size[0].length).toEqual(0);
        expect(statsObj.time[0].length).toEqual(0);
        expect(statsObj.memory[0].length).toEqual(0);

        analytics.addStats(statsObj, data);

        expect(statsObj.size[0].length).toEqual(1);
        expect(statsObj.time[0].length).toEqual(1);
        expect(statsObj.memory[0].length).toEqual(1);

        expect(_.flatten(statsObj.size)).toEqual(data.size);
        expect(_.flatten(statsObj.time)).toEqual(data.time);
        expect(_.flatten(statsObj.memory)).toEqual(data.memory);

        analytics.addStats(statsObj, data2);

        expect(statsObj.size[0].length).toEqual(2);
        expect(statsObj.time[0].length).toEqual(2);
        expect(statsObj.memory[0].length).toEqual(2);

        expect(_.flatten(statsObj.size)).toEqual(_.flatten(_.zip(data.size, data2.size)));
        expect(_.flatten(statsObj.time)).toEqual(_.flatten(_.zip(data.time, data2.time)));
        expect(_.flatten(statsObj.memory)).toEqual(_.flatten(_.zip(data.memory, data2.memory)));

    });

    it('calculateStats takes an array of ints and returns an obj that has the  min, max, and total of ints', function() {
        var data = [232, 254, 345, 112, 367, 343, 321, 213, 222, 245];

        var results = analytics.calculateStats(data);

        expect(results).toBeDefined();
        expect(results.max).toEqual(367);
        expect(results.min).toEqual(112);
        //toFixed returns a string
        expect(results.average).toEqual('265.40');

    });

});

