'use strict';

var indexer = require('../../lib/processors/elasticsearch_index_selector');

describe('elasticsearch index selector', function() {

    it('has a schema and newProcessor method', function() {
        var processor = indexer;

        expect(processor).toBeDefined();
        expect(processor.newProcessor).toBeDefined();
        expect(processor.schema).toBeDefined();
        expect(typeof processor.newProcessor).toEqual('function');
        expect(typeof processor.schema).toEqual('function');

    });

    it('schema function returns on object, formatted to be used by convict', function() {
        var schema = indexer.schema();
        var type = Object.prototype.toString.call(schema);
        var keys = Object.keys(schema);

        expect(type).toEqual('[object Object]');
        expect(keys.length).toBeGreaterThan(0);
        expect(schema[keys[0]].default).toBeDefined();

    });

    it('indexName will create a timeseries if specified in opConfig', function() {
        var record = {'@timestamp': new Date('2016/08/28')};
        var opConfig = {index: 'events-2016.08.28'};
        var opConfigDaily = {indexPrefix: 'events-', date_field: '@timestamp', timeseries: 'daily'};
        var opConfigMonthly = {indexPrefix: 'events-', date_field: '@timestamp', timeseries: 'monthly'};
        var opConfigYearly = {indexPrefix: 'events-', date_field: '@timestamp', timeseries: 'yearly'};


        var indexName = indexer.indexName(record, opConfig);
        var Daily = indexer.indexName(record, opConfigDaily);
        var Monthly = indexer.indexName(record, opConfigMonthly);
        var Yearly = indexer.indexName(record, opConfigYearly);


        expect(typeof indexer.indexName).toEqual('function');
        expect(indexName).toEqual('events-2016.08.28');
        expect(Daily).toEqual('events-2016.08.28');
        expect(Monthly).toEqual('events-2016.08');
        expect(Yearly).toEqual('events-2016');

    });

    it('new processor will throw if other config options are not present with timeseries', function(){

        var jobConfig = {logger:'im a fake logger'};
        var op1 = {timeseries: 'hourly'};
        var op2 = {timeseries: 'daily'};

        expect(function(){indexer.newProcessor({}, op1, jobConfig)}).toThrow("timeseries must be one of 'daily', 'monthly', 'yearly'");
        expect(function(){indexer.newProcessor({}, op2, jobConfig)}).toThrow("timeseries requires an indexPrefix");

    });

    it('new processor will throw if type is not specified when data is did not come from elasticsearch', function(){

        var context = {};
        var opConfig = {index: 'someIndex'};
        var jobConfig = {logger:'im a fake logger'};
        var data = [{someData:'some random data'}];

        var fn = indexer.newProcessor(context, opConfig, jobConfig);

        expect(function(){fn(data)}).toThrow('type must be specified in elasticsearch index selector config if data' +
            ' is not from elasticsearch');

    });

    it('newProcessor takes either an array or elasticsearch formatted data and returns an array', function(){
        var jobConfig = {logger:'im a fake logger'};
        var fn = indexer.newProcessor({}, {type: 'someType'}, jobConfig);
        var fromElastic = {hits:{hits:[{type: 'someType'}]}};

        var final = fn([]);
        var finalElastic = fn(fromElastic);

        expect(Array.isArray(final)).toBe(true);
        expect(Array.isArray(finalElastic)).toBe(true);

    });

    it('it returns properly formated data for bulk requests', function(){
        var context = {};
        var opConfig = {index: 'someIndex', type: 'events'};
        var jobConfig = {logger:'im a fake logger'};
        var data = [{someData:'some random data'}];

        var fn = indexer.newProcessor(context, opConfig, jobConfig);
        var results = fn(data);

        expect(results[0]).toEqual({ index: { _index: 'someIndex', _type: 'events'}});
        expect(results[1]).toEqual({someData:'some random data'});

    });

    it('preserve_id will keep the previuos id from elasticsearch data', function(){
        var context = {};
        var opConfig = {index: 'someIndex',type: 'events', preserve_id: true};
        var jobConfig = {logger:'im a fake logger'};
        var data = {hits:{hits:[{type: 'someType', _id: 'specialID'}]}};

        var fn = indexer.newProcessor(context, opConfig, jobConfig);
        var results = fn(data);

        expect(results[0]).toEqual({ index: { _index: 'someIndex', _type: 'events', _id: 'specialID' } })

    });

    it('can set id to any field in data', function(){
        var context = {};
        var opConfig = {index: 'someIndex', type: 'events', id_field: 'name'};
        var jobConfig = {logger:'im a fake logger'};
        var data = [{some: 'data', name: 'someName'}];

        var fn = indexer.newProcessor(context, opConfig, jobConfig);
        var results = fn(data);

        expect(results[0]).toEqual({ index: { _index: 'someIndex', _type: 'events', _id: 'someName' } })

    });

    it('can send an update request instead of index', function(){
        var context = {};
        var opConfig = {index: 'someIndex', type: 'events', id_field: 'name', update: true};
        var jobConfig = {logger:'im a fake logger'};
        var data = [{some: 'data', name: 'someName'}];

        var fn = indexer.newProcessor(context, opConfig, jobConfig);
        var results = fn(data);

        expect(results[0]).toEqual({ update: { _index: 'someIndex', _type: 'events', _id: 'someName' } });
        expect(results[1]).toEqual({ doc: { some: 'data', name: 'someName' } });

    });

    it('can upsert specified fields by passing in an array of keys matching the document', function(){
        var context = {};
        var opConfig = {index: 'someIndex', type: 'events', id_field: 'name', update: true, upsert_fields: ['name', 'job']};
        var jobConfig = {logger:'im a fake logger'};
        var data = [{some: 'data', name: 'someName', job: 'to be awesome!'}];

        var fn = indexer.newProcessor(context, opConfig, jobConfig);
        var results = fn(data);

        expect(results[0]).toEqual({ update: { _index: 'someIndex', _type: 'events', _id: 'someName' } });
        expect(results[1]).toEqual({ doc: { some: 'data', name: 'someName', job: 'to be awesome!' },
            upsert: { name: 'someName', job: 'to be awesome!' } });

    });

});

