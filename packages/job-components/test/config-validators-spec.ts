'use strict';

import { TestContext } from '@terascope/teraslice-types';
import { Schema } from 'convict';
import 'jest-extended'; // require for type definitions
import { jobSchema, validateJobConfig, validateOpConfig } from '../src';

describe('When passed a valid jobSchema and jobConfig', () => {
    it('returns a completed and valid jobConfig', () => {
        const context = new TestContext('teraslice-operations');

        const schema = jobSchema(context);
        const job = {
            operations: [
                {
                    _op: 'noop',
                },
                {
                    _op: 'noop',
                },
            ],
        };
        const validJob = {
            analytics: true,
            assets: null,
            lifecycle: 'once',
            max_retries: 3,
            name: 'Custom Job',
            node_labels: null,
            operations: [{ _op: 'noop' }, { _op: 'noop' }],
            probation_window: 300000,
            recycle_worker: null,
            resources: null,
            slicers: 1,
            volumes: null
        };

        const jobConfig = validateJobConfig(schema, job);
        delete jobConfig.workers;
        expect(jobConfig as object).toEqual(validJob);
    });
});

describe('When passed a job without a known connector', () => {
    it('raises an exception', () => {
        const context = new TestContext('teraslice-operations');
        context.sysconfig.terafoundation = {
            connectors: {
                elasticsearch: {
                    t1: {
                        host: ['1.1.1.1:9200'],
                    },
                },
            },
        };

        const schema = jobSchema(context);
        const job = {
            operations: [
                {
                    _op: 'elasticsearch_reader',
                    connection: 'unknown',
                },
                {
                    _op: 'noop',
                },
            ],
        };
        expect(() => {
            validateJobConfig(schema, job);
        }).toThrowError(/undefined connection/);
    });
});

describe('When validating opConfig', () => {
    const schema: Schema<any> = {
        example: {
            default: '',
            doc: 'some example value',
            format: 'required_String',
        },
        formatted_value: {
            default: 'hi',
            doc: 'some formatted value',
            format(val: any) {
                const obj = {
                    hi: 'there',
                };
                if (!obj[val]) {
                    throw new Error('Invalid schema for formatted value');
                } else {
                    return obj[val];
                }
            },
        },
        test: {
            default: true,
            doc: 'some test value',
            format: 'Boolean',
        },
    };

    it('should return a config when given valid input', () => {
        const op = {
            _op: 'some-op',
            example: 'example',
            formatted_value: 'hi',
        };
        const config = validateOpConfig(schema, op);
        expect(config as object).toEqual({
            _op: 'some-op',
            example: 'example',
            formatted_value: 'hi',
            test: true,
        });
    });

    it('should fail when given invalid input', () => {
        const op = {
            _op: 'some-op',
            example: 'example',
            formatted_value: 'hello',
        };

        expect(() => {
            validateOpConfig(schema, op);
        }).toThrowError();
    });
});

describe('When passed a jobConfig with resources', () => {
    it('returns a completed and valid jobConfig', () => {
        const context = new TestContext('teraslice-operations');

        const schema = jobSchema(context);
        const job = {
            resources: {
                minimum: {
                    cpu: 1,
                    memory: 805306368
                },
                limit: {
                    cpu: 2,
                    memory: 4294967296
                }
            },
            operations: [
                {
                    _op: 'noop',
                },
                {
                    _op: 'noop',
                },
            ],
        };
        const validJob = {
            analytics: true,
            assets: null,
            lifecycle: 'once',
            max_retries: 3,
            name: 'Custom Job',
            node_labels: null,
            operations: [{ _op: 'noop' }, { _op: 'noop' }],
            probation_window: 300000,
            recycle_worker: null,
            resources: null,
            slicers: 1,
            volumes: null
        };

        const jobConfig = validateJobConfig(schema, job);
        delete jobConfig.workers;
        expect(jobConfig as object).toEqual(validJob);
    });
});

describe('When passed a jobConfig with node_labels', () => {
    it('returns a completed and valid jobConfig', () => {
        const context = new TestContext('teraslice-operations');

        const schema = jobSchema(context);
        const job = {
            node_labels: [
                {
                    key: 'zone',
                    value: 'west'
                }
            ],
            operations: [
                {
                    _op: 'noop',
                },
                {
                    _op: 'noop',
                },
            ],
        };
        const validJob = {
            analytics: true,
            assets: null,
            lifecycle: 'once',
            max_retries: 3,
            name: 'Custom Job',
            node_labels: [
                { key: 'zone', value: 'west' }
            ],
            operations: [{ _op: 'noop' }, { _op: 'noop' }],
            probation_window: 300000,
            recycle_worker: null,
            resources: null,
            slicers: 1,
            volumes: null
        };

        const jobConfig = validateJobConfig(schema, job);
        delete jobConfig.workers;
        expect(jobConfig as object).toEqual(validJob);
    });
});


describe('When passed a jobConfig with volumes', () => {
    it('returns a completed and valid jobConfig', () => {
        const context = new TestContext('teraslice-operations');

        const schema = jobSchema(context);
        const job = {
            volumes: [
                {
                    name: 'pvc-name',
                    path: '/srv'
                }
            ],
            operations: [
                {
                    _op: 'noop',
                },
                {
                    _op: 'noop',
                },
            ],
        };
        const validJob = {
            analytics: true,
            assets: null,
            lifecycle: 'once',
            max_retries: 3,
            name: 'Custom Job',
            node_labels: null,
            operations: [{ _op: 'noop' }, { _op: 'noop' }],
            probation_window: 300000,
            recycle_worker: null,
            resources: null,
            slicers: 1,
            volumes: [
                { name: 'pvc-name', path: '/srv' }
            ]
        };

        const jobConfig = validateJobConfig(schema, job);
        delete jobConfig.workers;
        expect(jobConfig as object).toEqual(validJob);
    });
});
