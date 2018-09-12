'use strict';

require('../helpers/set-global-job-env');

const indexer = require('../../lib/processors/elasticsearch_index_selector');

describe('elasticsearch index selector', () => {
    it('has a schema and newProcessor method', () => {
        const processor = indexer;

        expect(processor).toBeDefined();
        expect(processor.newProcessor).toBeDefined();
        expect(processor.schema).toBeDefined();
        expect(typeof processor.newProcessor).toEqual('function');
        expect(typeof processor.schema).toEqual('function');
    });

    it('schema function returns on object, formatted to be used by convict', () => {
        const schema = indexer.schema();
        const type = Object.prototype.toString.call(schema);
        const keys = Object.keys(schema);

        expect(type).toEqual('[object Object]');
        expect(keys.length).toBeGreaterThan(0);
        expect(schema[keys[0]].default).toBeDefined();
    });

    it('new processor will throw if other config options are not present with timeseries', () => {
        const jobConfig = { logger: 'im a fake logger' };
        const op1 = { timeseries: 'hourly' };
        const op2 = { timeseries: 'daily' };

        expect(() => {
            indexer.newProcessor({}, op1, jobConfig);
        }).toThrowError('timeseries requires an index_prefix');
        expect(() => {
            indexer.newProcessor({}, op2, jobConfig);
        }).toThrowError('timeseries requires an index_prefix');
    });

    it('new processor will throw if type is not specified when data is did not come from elasticsearch', () => {
        const context = {};
        const opConfig = { index: 'someIndex' };
        const jobConfig = { logger: 'im a fake logger' };
        const data = [{ someData: 'some random data' }];

        const fn = indexer.newProcessor(context, opConfig, jobConfig);

        expect(() => {
            fn(data);
        }).toThrow(new Error('type must be specified in elasticsearch index selector config if data is not a full response from elasticsearch'));
    });

    it('newProcessor takes either an array or elasticsearch formatted data and returns an array', () => {
        const jobConfig = { logger: 'im a fake logger' };
        const fn = indexer.newProcessor({}, { type: 'someType' }, jobConfig);
        const fromElastic = { hits: { hits: [{ type: 'someType' }] } };

        const final = fn([]);
        const finalElastic = fn(fromElastic);

        expect(Array.isArray(final)).toBe(true);
        expect(Array.isArray(finalElastic)).toBe(true);
    });

    it('it returns properly formatted data for bulk requests', () => {
        const context = {};
        const opConfig = { index: 'someIndex', type: 'events', delete: false };
        const jobConfig = { logger: 'im a fake logger' };
        const data = [{ someData: 'some random data' }];

        const fn = indexer.newProcessor(context, opConfig, jobConfig);
        const results = fn(data);

        expect(results[0]).toEqual({ index: { _index: 'someIndex', _type: 'events' } });
        expect(results[1]).toEqual({ someData: 'some random data' });
    });

    it('preserve_id will keep the previous id from elasticsearch data', () => {
        const context = {};
        const opConfig = {
            index: 'someIndex', type: 'events', preserve_id: true, delete: false
        };
        const jobConfig = { logger: 'im a fake logger' };
        const data = {
            hits: {
                hits: [{
                    type: 'someType', _index: 'some_index', _id: 'specialID', _source: { some: 'data' }
                }]
            }
        };

        const fn = indexer.newProcessor(context, opConfig, jobConfig);
        const results = fn(data);

        expect(results[0]).toEqual({ index: { _index: 'someIndex', _type: 'events', _id: 'specialID' } });
    });

    it('can set id to any field in data', () => {
        const context = {};
        const opConfig = { index: 'someIndex', type: 'events', id_field: 'name' };
        const jobConfig = { logger: 'im a fake logger' };
        const data = [{ some: 'data', name: 'someName' }];

        const fn = indexer.newProcessor(context, opConfig, jobConfig);
        const results = fn(data);

        expect(results[0]).toEqual({ index: { _index: 'someIndex', _type: 'events', _id: 'someName' } });
    });

    it('can send an update request instead of index', () => {
        const context = {};
        const opConfig = {
            index: 'someIndex',
            type: 'events',
            id_field: 'name',
            update_fields: ['name'],
            delete: false,
            update: true
        };
        const jobConfig = { logger: 'im a fake logger' };
        const data = [{ some: 'data', name: 'someName' }];

        const fn = indexer.newProcessor(context, opConfig, jobConfig);
        const results = fn(data);

        expect(results[0]).toEqual({ update: { _index: 'someIndex', _type: 'events', _id: 'someName' } });
        expect(results[1]).toEqual({ doc: { name: 'someName' } });
    });

    it('can send a delete request instead of index', () => {
        const context = {};
        const opConfig = {
            index: 'someIndex', type: 'events', id_field: 'name', delete: true
        };
        const jobConfig = { logger: 'im a fake logger' };
        const data = [{ some: 'data', name: 'someName' }];

        const fn = indexer.newProcessor(context, opConfig, jobConfig);
        const results = fn(data);

        expect(results[0]).toEqual({ delete: { _index: 'someIndex', _type: 'events', _id: 'someName' } });
    });

    it('can upsert specified fields by passing in an array of keys matching the document', () => {
        const context = {};
        const opConfig = {
            index: 'someIndex', type: 'events', upsert: true, update_fields: ['name', 'job']
        };
        const jobConfig = { logger: 'im a fake logger' };
        const data = [{ some: 'data', name: 'someName', job: 'to be awesome!' }];

        const fn = indexer.newProcessor(context, opConfig, jobConfig);
        const results = fn(data);

        expect(results[0]).toEqual({ update: { _index: 'someIndex', _type: 'events' } });
        expect(results[1]).toEqual({
            upsert: { some: 'data', name: 'someName', job: 'to be awesome!' },
            doc: { name: 'someName', job: 'to be awesome!' }
        });
    });

    it('script file to run as part of an update request', () => {
        const context = {};
        const opConfig = {
            index: 'someIndex',
            type: 'events',
            upsert: true,
            update_fields: [],
            script_file: 'someFile',
            script_params: { aKey: 'job' }
        };
        const jobConfig = { logger: 'im a fake logger' };
        const data = [{ some: 'data', name: 'someName', job: 'to be awesome!' }];

        const fn = indexer.newProcessor(context, opConfig, jobConfig);
        const results = fn(data);

        expect(results[0]).toEqual({ update: { _index: 'someIndex', _type: 'events' } });
        expect(results[1]).toEqual({
            upsert: { some: 'data', name: 'someName', job: 'to be awesome!' },
            script: { file: 'someFile', params: { aKey: 'to be awesome!' } }
        });
    });

    it('selfValidation makes sure that the opConfig is configured correctly', () => {
        const errorString = 'elasticsearch_index_selector is mis-configured, if any of the following configurations are set: timeseries, index_prefix or date_field, they must all be used together, please set the missing parameters';
        const baseOP = {
            index: 'someIndex',
            type: 'events'
        };

        const op1 = Object.assign({}, baseOP, { timeseries: 'daily' });
        const op2 = Object.assign({}, baseOP, { timeseries: 'daily', index_prefix: 'events-' });
        const op3 = Object.assign({}, baseOP, { timeseries: 'daily', date_field: 'dateField' });
        const op4 = Object.assign({}, baseOP, { timeseries: 'daily', index_prefix: 'events-', date_field: 'dateField' });


        expect(() => {
            indexer.selfValidation(op1);
        }).toThrowError(errorString);
        expect(() => {
            indexer.selfValidation(op2);
        }).toThrowError(errorString);
        expect(() => {
            indexer.selfValidation(op3);
        }).toThrowError(errorString);

        expect(() => {
            indexer.selfValidation(op4);
        }).not.toThrow();
    });
});
