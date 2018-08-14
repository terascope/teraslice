'use strict';

import { Context } from '@terascope/teraslice-types';
import { validateJobConfig } from '../src/config-validators';
import { jobSchema } from '../src/job-schemas';

describe('When passed a valid jobSchema and jobConfig', () => {
    it('returns a completed and valid jobConfig', () => {
        const context: Context = {
            sysconfig: {
                teraslice: {
                    ops_directory: '',
                },
            },
        } as Context;

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
        const context = {
            sysconfig: {
                teraslice: {
                    ops_directory: '',
                },
                terafoundation: {
                    connectors: {
                        elasticsearch: {
                            t1: {
                                host: ['1.1.1.1:9200'],
                            },
                        },
                    },
                },
            },
        } as Context;
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
