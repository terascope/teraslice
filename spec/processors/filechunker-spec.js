'use strict';

var chunker = require('../../lib/processors/file_chunker');

describe('file chunker', function(){

    it('has a schema and newProcessor method', function() {
        var processor = chunker;

        expect(processor).toBeDefined();
        expect(processor.newProcessor).toBeDefined();
        expect(processor.schema).toBeDefined();
        expect(typeof processor.newProcessor).toEqual('function');
        expect(typeof processor.schema).toEqual('function');

    });

    it('schema function returns on object, formatted to be used by convict', function() {
        var schema = chunker.schema();
        var type = Object.prototype.toString.call(schema);
        var keys = Object.keys(schema);

        expect(type).toEqual('[object Object]');
        expect(keys.length).toBeGreaterThan(0);
        expect(schema[keys[0]].default).toBeDefined();

    });

    it('schema function has proper defaults', function() {
        var schema = chunker.schema();

        expect(schema.date_field.default).toEqual('date');
        expect(schema.directory.default).toEqual('/');
        expect(schema.chunk_size.default).toEqual(50000);

    });

    it('creates a chunk size set by opConfig', function(){
        var context = {sysconfig:{}};
        var opConfig = {chunk_size: 2};
        var jobConfig = {logger: 'someLogger'};
        var processor = chunker.newProcessor(context, opConfig, jobConfig);

        var data = [{some: 'thing'},{some: 'thing', another: 'thing'}, {third: 'thing'}];

        var results = processor(data);

        expect(results[0].data).toBeDefined();
        expect(results[0].filename).toBeDefined();
        expect(results[0].data).toEqual('{"some":"thing"}\n{"some":"thing","another":"thing"}');

    });

    it('creates a chunk size set by opConfig', function(){
        var context = {sysconfig:{_nodeName: 'someNodeName'}};
        var opConfig = {chunk_size: 2, timeseries: 'daily', directory: 'some/path', date_field: 'date'};
        var jobConfig = {logger: 'someLogger'};
        var processor = chunker.newProcessor(context, opConfig, jobConfig);

        var data = [{date: '2015/08/31', some: 'thing'},{date: '2015/08/31', some: 'thing', another: 'thing'}, {date: '2015/08/31', third: 'thing'}];

        var results = processor(data);

        expect(results.length).toEqual(2);
        expect(results[0]).toEqual({ data: '{"date":"2015/08/31","some":"thing"}\n{"date":"2015/08/31","some":"thing","another":"thing"}',
            filename: 'some/path-2015.08.31/someNodeName' });
        expect(results[1]).toEqual({ data: [ '{"date":"2015/08/31","third":"thing"}' ],
            filename: 'some/path-2015.08.31/someNodeName' }
    );

    });

});