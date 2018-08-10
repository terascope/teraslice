'use strict';

const configValidator = require('../../../lib/config/validators/config')();

describe('When passed a valid jobSchema and jobConfig', () => {
    it('returns a completed and valid jobConfig', () => {
        const context = {
            sysconfig: {
                teraslice: {
                    ops_directory: ''
                }
            }
        };

        const jobSchema = require('../../../lib/config/schemas/job').jobSchema(context);
        const jobSpec = {
            operations: [{
                _op: 'noop'
            },
            {
                _op: 'noop'
            }
            ]
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
                { _op: 'noop' }
            ],
            assets: null,
            probation_window: 300000
        };

        const jobConfig = configValidator.validateConfig(jobSchema, jobSpec);
        delete jobConfig.workers;
        expect(jobConfig).toEqual(validJob);
    });
});

describe('When passed a job without a known connector', () => {
    it('raises an exception', () => {
        const context = {
            sysconfig: {
                teraslice: {
                    ops_directory: ''
                },
                terafoundation: {
                    connectors: {
                        elasticsearch: {
                            t1: {
                                host: ['1.1.1.1:9200']
                            }
                        }
                    }
                }
            }
        };
        const jobSchema = require('../../../lib/config/schemas/job').jobSchema(context);
        const jobSpec = {
            operations: [{
                _op: 'elasticsearch_reader',
                connection: 'unknown'
            },
            {
                _op: 'noop'
            }
            ]
        };
        expect(() => {
            configValidator.validateConfig(jobSchema, jobSpec);
        }).toThrowError(/undefined connection/);
    });
});
