'use strict';

import { Context, TestContext } from '@terascope/teraslice-types';
import { jobSchema, validateJobConfig } from '../src';

describe('When passed a valid jobSchema and jobConfig', () => {
    it('returns a completed and valid jobConfig', () => {
        const context = new TestContext('teraslice-validators');

        const schema = jobSchema(context);
        const job = {
            operations: [{
                _op: 'noop',
            },
                {
                    _op: 'noop',
                },
            ],
        };
        const validJob = {
            name: 'Custom Job',
            lifecycle: 'once',
            analytics: true,
            max_retries: 3,
            slicers: 1,
            recycle_worker: null,
            operations: [
                { _op: 'noop' },
                { _op: 'noop' },
            ],
            assets: null,
            probation_window: 300000,
        };

        const jobConfig = validateJobConfig(schema, job);
        delete jobConfig.workers;
        expect(jobConfig as object).toEqual(validJob);
    });
});

describe('When passed a job without a known connector', () => {
    it('raises an exception', () => {
        const context = new TestContext('teraslice-validators');
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
            operations: [{
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
