import { TestContext, JobConfig } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import * as path from 'path';
import { JobValidator } from '../src';

describe('JobValidator', () => {
    const context = new TestContext('teraslice-operations');
    const terasliceOpPath = path.join(__dirname, '../../teraslice/lib');
    const api = new JobValidator(context, {
        terasliceOpPath,
    });

    it('returns a completed and valid jobConfig', () => {
        const jobSpec: JobConfig = {
            name: 'noop',
            operations: [
                {
                    _op: 'noop',
                },
                {
                    _op: 'noop',
                },
            ],
        };

        const validJob = api.validateConfig(jobSpec);
        expect(validJob.max_retries).toBeDefined();
        expect(validJob.lifecycle).toBeDefined();
        expect(validJob.operations).toBeDefined();
        expect(validJob.assets).toBeDefined();
    });

    it('throws an error with faulty operation configuration', () => {
        const jobSpec: JobConfig = {
            name: 'test',
            operations: [
                {
                    // @ts-ignore
                    something: 'else',
                },
                {
                    _op: 'noop',
                },
            ],
        };

        expect(() => {
            api.validateConfig(jobSpec);
        }).toThrowError();
    });

    it('will properly read an operation', () => {
        const jobSpec: JobConfig = {
            name: 'test',
            operations: [
                {
                    _op: 'elasticsearch_reader',
                    // @ts-ignore
                    date_field_name: 'created',
                    index: 'some_index',
                },
                {
                    _op: 'noop',
                },
            ],
        };

        expect(() => {
            api.validateConfig(jobSpec);
        }).not.toThrowError();
    });

    it('will throw based off opValition errors', () => {
        // if subslice_by_key, then it needs type specified or it will error
        const jobSpec: JobConfig = {
            name: 'test',
            operations: [
                {
                    _op: 'elasticsearch_reader',
                    // @ts-ignore
                    date_field_name: 'created',
                    index: 'some_index',
                    subslice_by_key: true,
                },
                {
                    _op: 'noop',
                },
            ],
        };

        expect(() => {
            api.validateConfig(jobSpec);
        }).toThrowError();
    });

    it('will throw based off crossValidation errors', () => {
        // if persistent, then interval cannot be auto
        const jobSpec = {
            lifecycle: 'persistent',
            operations: [
                {
                    _op: 'elasticsearch_reader',
                    date_field_name: 'created',
                    index: 'some_index',
                    interval: 'auto',
                    subslice_by_key: true,
                },
                {
                    _op: 'noop',
                },
            ],
        };

        expect(() => {
            api.validate(jobSpec);
        }).toThrowError();
    });

    it('checks _ops to make sure they provide a schema, formatted correctly', () => {
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
