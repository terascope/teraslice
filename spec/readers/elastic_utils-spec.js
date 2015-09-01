'use strict';

var utils = require('../../lib/readers/elastic_utils');

describe('elastic_utils', function(){

    it('has methods dateOptions and processInterval', function(){
        var dateOptions = utils.dateOptions;
        var processInterval = utils.processInterval;

        expect(dateOptions).toBeDefined();
        expect(processInterval).toBeDefined();
        expect(typeof dateOptions).toEqual('function');
        expect(typeof processInterval).toEqual('function');

    });

    it('dateOptions returns a string used for the moment library', function(){
        var dateOptions = utils.dateOptions;

        var results1 = dateOptions('Day');
        var results2 = dateOptions('day');

        expect(results1).toEqual('d');
        expect(results2).toEqual('d');

    });

    it('dateOptions will throw a new error if not given correct values', function(){
        var dateOptions = utils.dateOptions;

        expect(function(){dateOptions('hourz')}).toThrowError();
        expect(function(){dateOptions(3)}).toThrowError();
        expect(function(){dateOptions({some: 'obj'})}).toThrowError();
        expect(function(){dateOptions(['hour'])}).toThrowError();

    });

    it('processInterval takes a string and returns an array', function(){
        var processInterval = utils.processInterval;

        var results = processInterval('5_min');

        expect(Array.isArray(results)).toBe(true);

    });

    it('processInterval requires input to be a specific format', function(){
        var processInterval = utils.processInterval;
        var results1 = processInterval('5_min');

        expect(results1[0]).toEqual('5');
        expect(results1[1]).toEqual('m');
        expect(function(){processInterval({some: 'obj'})}).toThrowError();
        expect(function(){processInterval('5-min')}).toThrowError();
        expect(function(){processInterval('5_minz')}).toThrowError();

    });

});