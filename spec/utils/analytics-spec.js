'use strict';

var Promise = require('bluebird');
var analytics = require('../../lib/utils/analytics');

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

        var analyticsObj = {time: [], size: []};
        var data = [{some: 'insideData'}];

        var analyze = analytics.analyze(fn);
        var results = analyze(analyticsObj, data);

        jasmine.clock().tick(1001);

        results.then(function(data) {

            expect(Array.isArray(data)).toBe(true);
            expect(data[0].some).toEqual('insideData');
            expect(analyticsObj.time.length).toEqual(1);
            expect(analyticsObj.size.length).toEqual(1);
            expect(analyticsObj.time[0] >= 0).toBe(true);
            expect(analyticsObj.size[0]).toEqual(1);

            done();
        });
    });

    it('insertAnalyzers takes an array of functions and returns them wrapped with the analyze function', function() {
        var fnArray = [function() {}, function() {}];
        var results = analytics.insertAnalyzers(fnArray);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toEqual(2);
        expect(typeof results[0]).toEqual('function');
        expect(results[0].toString()).toEqual(analytics.analyze().toString());

    });

});

