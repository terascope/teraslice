'use strict';

var generator = require('../../lib/readers/elasticsearch_data_generator');

describe('elasticsearch_data_generator', function() {

    it('has a schema and newProcessor method', function() {

        expect(generator).toBeDefined();
        expect(generator.newReader).toBeDefined();
        expect(generator.newSlicer).toBeDefined();
        expect(generator.schema).toBeDefined();
        expect(typeof generator.newReader).toEqual('function');
        expect(typeof generator.newSlicer).toEqual('function');
        expect(typeof generator.schema).toEqual('function');

    });

    it('newReader returns a function that produces generated data', function() {
        var context = {};
        var opConfig = {};
        var jobConfig = {};

        var getData = generator.newReader(context, opConfig, jobConfig);

        var results1 = getData(1);
        var results2 = getData(20);

        expect(results1.length).toEqual(1);
        expect(results2.length).toEqual(20);
        expect(Object.keys(results1[0]).length).toBeGreaterThan(1);

    });

    it('slicer in "once" mode will return number based off total size ', function() {
        var context = {};
        var opConfig = {size: 13};
        var jobConfig1 = {lifecycle: 'once', operations: [{size: 5}]};
        //if not specified size defaults to 5000
        var jobConfig2 = {lifecycle: 'once', operations: [{someKey: 'someValue'}]};


        var slicer = generator.newSlicer(context, opConfig, jobConfig1);
        var slicer2 = generator.newSlicer(context, opConfig, jobConfig2);

        expect(typeof slicer).toEqual('function');
        expect(slicer()).toEqual(5);
        expect(slicer()).toEqual(5);
        expect(slicer()).toEqual(3);
        expect(slicer()).toEqual(null);

        expect(typeof slicer2).toEqual('function');
        expect(slicer2()).toEqual(13);
        expect(slicer2()).toEqual(null);

    });

    it('slicer in "persistent" mode will continuously produce the same number', function(){

        var context = {};
        var opConfig = {size: 550};
        var jobConfig = {lifecycle: 'persistent', operations: [{size: 5}]};

        var slicer = generator.newSlicer(context, opConfig, jobConfig);

        expect(typeof slicer).toEqual('function');
        expect(slicer()).toEqual(550);
        expect(slicer()).toEqual(550);
        expect(slicer()).toEqual(550);

    });

});
