'use strict';

const events = require('events');
const jobValidator = require('../../../lib/config/validators/job')();

const eventEmitter = new events.EventEmitter();

describe('can validate a job', () => {
    const testContext = {
        apis: { registerAPI() {} },
        foundation: {
            getEventEmitter() {
                return eventEmitter;
            }
        },
        sysconfig: {
            teraslice: {
                ops_directory: ''
            }
        },
        logger: {
            error() {},
            info() {},
            warn() {},
            debug() {}
        }
    };


    it('returns a completed and valid jobConfig', () => {
        const api = jobValidator.__test_context(testContext);
        const jobSpec = {
            operations: [
                {
                    _op: 'noop'
                },
                {
                    _op: 'noop'
                }
            ]
        };
        const validJob = api.validate(jobSpec);
        expect(validJob.max_retries).toBeDefined();
        expect(validJob.lifecycle).toBeDefined();
        expect(validJob.operations).toBeDefined();
        expect(validJob.assets).toBeDefined();
    });

    it('throws an error with faulty operation configuration', () => {
        const api = jobValidator.__test_context(testContext);
        const jobSpec = {
            operations: [
                {
                    something: 'else'
                },
                {
                    _op: 'noop'
                }
            ]
        };

        expect(() => {
            api.validate(jobSpec);
        }).toThrowError();
    });

    it('will properly read an operation', () => {
        const api = jobValidator.__test_context(testContext);
        const jobSpec = {
            operations: [
                {
                    _op: 'elasticsearch_reader',
                    index: 'some_index',
                    date_field_name: 'created'
                },
                {
                    _op: 'noop'
                }
            ]
        };

        expect(() => {
            api.validate(jobSpec);
        }).not.toThrowError();
    });

    it('will throw based off opValition errors', () => {
        const api = jobValidator.__test_context(testContext);
        // if subslice_by_key, then it needs type specified or it will error
        const jobSpec = {
            operations: [
                {
                    _op: 'elasticsearch_reader',
                    index: 'some_index',
                    date_field_name: 'created',
                    subslice_by_key: true
                },
                {
                    _op: 'noop'
                }
            ]
        };

        expect(() => {
            api.validate(jobSpec);
        }).toThrowError();
    });

    it('will throw based off crossValidation errors', () => {
        const api = jobValidator.__test_context(testContext);
        // if persistent, then interval cannot be auto
        const jobSpec = {
            lifecycle: 'persistent',
            operations: [
                {
                    _op: 'elasticsearch_reader',
                    index: 'some_index',
                    date_field_name: 'created',
                    subslice_by_key: true,
                    interval: 'auto'
                },
                {
                    _op: 'noop'
                }
            ]
        };

        expect(() => {
            api.validate(jobSpec);
        }).toThrowError();
    });

    it('checks _ops to make sure they provide a schema, formatted correctly', () => {
        const api = jobValidator.__test_context(testContext);
        const opCode = { newProcessor: () => null, schema: () => ({}) };
        const badCode1 = { newProcessor: () => null, schema: () => 'retuning a string' };
        const badCode2 = { newProcessor: () => null, schema: 3 };
        const badCode3 = { newProcessor: () => null };

        expect(() => {
            api.hasSchema(opCode, 'test');
        }).not.toThrowError();
        expect(() => {
            api.hasSchema(badCode1, 'test');
        }).toThrowError('test schema needs to return an object');
        expect(() => {
            api.hasSchema(badCode2, 'test');
        }).toThrowError('test needs to have a method named "schema"');
        expect(() => {
            api.hasSchema(badCode3, 'test');
        }).toThrowError('test needs to have a method named "schema"');
    });
});
