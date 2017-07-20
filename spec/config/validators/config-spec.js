'use strict';

var configValidator = require('../../../lib/config/validators/config')();

describe('When passed a valid jobSchema and jobConfig', function() {
    it('returns a completed and valid jobConfig', function() {
        var context = {
            sysconfig: {
                teraslice: {
                    ops_directory: ''
                }
            }
        };

        var jobSchema = require('../../../lib/config/schemas/job').jobSchema(context);
        var jobSpec = {
            'operations': [{
                    '_op': 'noop'
                },
                {
                    '_op': 'noop'
                }
            ]
        };
        var validJob = {
            name: 'Custom Job',
            lifecycle: 'once',
            analytics: true,
            max_retries: 3,
            slicers: 1,
            operations: [
                {_op: 'noop'},
                {_op: 'noop'}
            ],
            assets: null,
            moderator: null
        };

        var jobConfig = configValidator.validateConfig(jobSchema, jobSpec);
        delete jobConfig.workers;
        expect(jobConfig).toEqual(validJob);
    });
});

describe('When passed a job without a known connector', function() {
    it('raises an exception', function() {
        var context = {
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
        var jobSchema = require('../../../lib/config/schemas/job').jobSchema(context);
        var jobSpec = {
            'operations': [{
                    '_op': 'elasticsearch_reader',
                    connection: 'unknown'
                },
                {
                    '_op': 'noop'
                }
            ]
        };
        try {
            configValidator.validateConfig(jobSchema, jobSpec)
        }
        catch (err) {
            expect(err).toMatch(/undefined connection/)
        }
    });
});
