import 'jest-extended'; // require for type definitions
import { Schema } from 'convict';
import {
    jobSchema,
    validateJobConfig,
    validateOpConfig,
    TestContext,
    validateAPIConfig,
    logLevels
} from '../src';

describe('when using native clustering', () => {
    describe('when passed a valid jobSchema and jobConfig', () => {
        it('should return a completed and valid jobConfig', () => {
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
                apis: [],
                operations: [{ _op: 'noop' }, { _op: 'noop' }],
                probation_window: 300000,
                performance_metrics: false,
                slicers: 1,
            };

            const jobConfig = validateJobConfig(schema, job);
            delete (jobConfig as any).workers;
            expect(jobConfig).toMatchObject(validJob);
        });
    });

    describe('when passed a job with an invalid op', () => {
        it('should raise an exception', () => {
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
                        _op: 'test-reader',
                    },
                    123,
                ],
            };

            expect(() => {
                validateJobConfig(schema, job);
            }).toThrowError(/Invalid Operation config in operations, got Number/);
        });
    });

    describe('when passed a job with an invalid operations', () => {
        it('should raise an exception', () => {
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
                operations: [{ _op: 'noop' }],
            };

            expect(() => {
                validateJobConfig(schema, job);
            }).toThrowError(/Operations need to be of type array with at least two operations in it/);
        });
    });

    describe('when passed a job without a known operation connector', () => {
        it('should raise an exception', () => {
            const context = new TestContext('teraslice-operations');
            context.sysconfig.teraslice.assets_directory = [__dirname];
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
                assets: ['fixtures'],
                operations: [
                    {
                        _op: 'example-reader',
                        connection: 'unknown',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };

            expect(() => {
                validateJobConfig(schema, job);
            }).toThrowError(/Operation example-reader refers to connection "unknown" which is unavailable/);
        });
    });

    describe('when passed a job with an invalid api', () => {
        it('should raise an exception', () => {
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
                apis: [123],
                operations: [
                    {
                        _op: 'test-reader',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };

            expect(() => {
                validateJobConfig(schema, job);
            }).toThrowError(/Invalid API config in apis, got Number/);
        });
    });

    describe('when passed a job without api _name', () => {
        it('should raise an exception', () => {
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
                apis: [{}],
                operations: [
                    {
                        _op: 'test-reader',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };
            expect(() => {
                validateJobConfig(schema, job);
            }).toThrowError(/API requires an _name/);
        });
    });

    describe('when passed a job with duplicate api names', () => {
        it('should raise an exception', () => {
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
                apis: [
                    {
                        _name: 'hello',
                    },
                    {
                        _name: 'hello',
                    },
                ],
                operations: [
                    {
                        _op: 'test-reader',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };
            expect(() => {
                validateJobConfig(schema, job);
            }).toThrowError(/Duplicate API configurations for/);
        });
    });

    describe('when passed a job without a known api connector', () => {
        it('should raise an exception', () => {
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
                apis: [
                    {
                        _name: 'test-api',
                        connection: 'unknown',
                    },
                ],
                operations: [
                    {
                        _op: 'test-reader',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };
            expect(() => {
                validateJobConfig(schema, job);
            }).toThrowError(/API test-api refers to connection "unknown" which is unavailable/);
        });
    });

    describe('when validating opConfig', () => {
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
            expect(config).toEqual({
                _op: 'some-op',
                _encoding: 'json',
                _dead_letter_action: 'throw',
                example: 'example',
                formatted_value: 'hi',
                test: true,
            });
        });

        it('should handle a custom encoding', () => {
            const op = {
                _op: 'some-op',
                _encoding: 'json',
                example: 'example',
                formatted_value: 'hi',
            };

            const config = validateOpConfig(schema, op);
            expect(config).toEqual({
                _op: 'some-op',
                _encoding: 'json',
                _dead_letter_action: 'throw',
                example: 'example',
                formatted_value: 'hi',
                test: true,
            });
        });

        it('should handle an invalid encoding', () => {
            const op = {
                _op: 'some-op',
                _encoding: 'uh-oh',
                example: 'example',
                formatted_value: 'hi',
            };

            expect(() => {
                validateOpConfig(schema, op);
            }).toThrow();
        });

        it('should handle a non-string encoding', () => {
            const op = {
                _op: 'some-op',
                _encoding: 123,
                example: 'example',
                formatted_value: 'hi',
            };

            expect(() => {
                validateOpConfig(schema, op);
            }).toThrow();
        });

        it('should handle a custom dead letter action', () => {
            const op = {
                _op: 'some-op',
                _encoding: 'json',
                _dead_letter_action: 'log',
                example: 'example',
                formatted_value: 'hi',
            };

            const config = validateOpConfig(schema, op);
            expect(config).toEqual({
                _op: 'some-op',
                _encoding: 'json',
                _dead_letter_action: 'log',
                example: 'example',
                formatted_value: 'hi',
                test: true,
            });
        });

        it('should handle a non-string dead letter action', () => {
            const op = {
                _op: 'some-op',
                _dead_letter_action: 123,
                example: 'example',
                formatted_value: 'hi',
            };

            expect(() => {
                validateOpConfig(schema, op);
            }).toThrow();
        });

        it('should fail when given invalid input', () => {
            const op = {
                _op: 'some-op',
                example: 'example',
                formatted_value: 'hello',
            };

            expect(() => {
                validateOpConfig(schema, op);
            }).toThrowError(/Invalid schema for formatted value/);
        });
    });

    describe('when validating apiConfig', () => {
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
            const api = {
                _name: 'some-api',
                example: 'example',
                formatted_value: 'hi'
            };

            const config = validateAPIConfig(schema, api);
            expect(config).toEqual({
                _name: 'some-api',
                example: 'example',
                formatted_value: 'hi',
                test: true,
                _dead_letter_action: 'throw',
                _encoding: undefined,
            });
        });

        it('should fail when given invalid input', () => {
            const api = {
                _name: 'some-op',
                example: 'example',
                formatted_value: 'hello',
            };

            expect(() => {
                validateAPIConfig(schema, api);
            }).toThrowError(/Invalid schema for formatted value/);
        });
    });

    describe('when passed a jobConfig', () => {
        const context = new TestContext('teraslice-operations');

        describe('when testing env_vars with a valid config', () => {
            it('should return a completed and valid jobConfig', () => {
                const schema = jobSchema(context);
                const job = {
                    env_vars: {
                        FOO: 'bar'
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
                    lifecycle: 'once',
                    max_retries: 3,
                    name: 'Custom Job',
                    apis: [],
                    env_vars: {
                        FOO: 'bar',
                    },
                    operations: [{ _op: 'noop' }, { _op: 'noop' }],
                    slicers: 1,
                };

                const jobConfig = validateJobConfig(schema, job);
                delete (jobConfig as any).workers;
                expect(jobConfig).toMatchObject(validJob);
            });
        });

        describe('when testing env_vars with an invalid config', () => {
            it('should throw an error when given an non-object', () => {
                const schema = jobSchema(context);
                const job = {
                    env_vars: [],
                    operations: [
                        {
                            _op: 'test-reader',
                        },
                        {
                            _op: 'noop',
                        },
                    ],
                };
                expect(() => validateJobConfig(schema, job)).toThrowError('must be object');
            });

            it('should throw an error when given an empty key', () => {
                const schema = jobSchema(context);
                const job = {
                    env_vars: {
                        '': 'bar'
                    },
                    operations: [
                        {
                            _op: 'test-reader',
                        },
                        {
                            _op: 'noop',
                        },
                    ],
                };
                expect(() => validateJobConfig(schema, job)).toThrowError('key must be not empty');
            });

            it('should throw an error when given an empty value', () => {
                const schema = jobSchema(context);
                const job = {
                    env_vars: {
                        foo: ''
                    },
                    operations: [
                        {
                            _op: 'test-reader',
                        },
                        {
                            _op: 'noop',
                        },
                    ],
                };
                expect(() => validateJobConfig(schema, job)).toThrowError(
                    'value for key "foo" must be not empty'
                );
            });
        });

        describe('when testing log_level with a valid config', () => {
            it('should return a completed and valid jobConfig', () => {
                const schema = jobSchema(context);
                const job = {
                    log_level: 'trace',
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
                    lifecycle: 'once',
                    max_retries: 3,
                    name: 'Custom Job',
                    apis: [],
                    log_level: 'trace',
                    operations: [{ _op: 'noop' }, { _op: 'noop' }],
                    slicers: 1,
                };

                const jobConfig = validateJobConfig(schema, job);
                delete (jobConfig as any).workers;
                expect(jobConfig).toMatchObject(validJob);
            });
        });

        describe('when testing log_level with an invalid config', () => {
            const logLevelStrings = Object.keys(logLevels);

            it('should throw an error when given non-string', () => {
                const schema = jobSchema(context);
                const job = {
                    log_level: 10,
                    operations: [
                        {
                            _op: 'test-reader',
                        },
                        {
                            _op: 'noop',
                        },
                    ],
                };
                expect(() => validateJobConfig(schema, job)).toThrow(`must be one of the following: ${logLevelStrings}`);
            });

            it('should throw an error when given a string that isn\'t a log level', () => {
                const schema = jobSchema(context);
                const job = {
                    log_level: 'errror',
                    operations: [
                        {
                            _op: 'test-reader',
                        },
                        {
                            _op: 'noop',
                        },
                    ],
                };
                expect(() => validateJobConfig(schema, job)).toThrow(`must be one of the following: ${logLevelStrings}`);
            });
        });

        describe('when testing slicers with a invalid config', () => {
            it('should throw an error', () => {
                const schema = jobSchema(context);
                const job = {
                    slicers: 0,
                    operations: [
                        {
                            _op: 'test-reader',
                        },
                        {
                            _op: 'noop',
                        },
                    ],
                };
                expect(() => validateJobConfig(schema, job)).toThrowError('must be valid integer greater than zero');
            });
        });

        describe('when testing workers with a invalid config', () => {
            it('should throw an error', () => {
                const schema = jobSchema(context);
                const job = {
                    workers: 0,
                    operations: [
                        {
                            _op: 'test-reader',
                        },
                        {
                            _op: 'noop',
                        },
                    ],
                };
                expect(() => validateJobConfig(schema, job)).toThrowError('must be valid integer greater than zero');
            });
        });
    });
});

describe('when validating k8s clustering', () => {
    const context = new TestContext('teraslice-operations');
    context.sysconfig.teraslice.cluster_manager_type = 'kubernetes';

    describe('when passed a jobConfig with cpu and memory', () => {
        it('should return a completed and valid jobConfig', () => {
            const schema = jobSchema(context);
            const job = {
                cpu: 1,
                memory: 805306368,
                operations: [
                    {
                        _op: 'noop',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };

            const jobConfig = validateJobConfig(schema, job);
            expect(jobConfig.cpu).toEqual(job.cpu);
            expect(jobConfig.memory).toEqual(job.memory);
        });
    });

    describe('when passed a jobConfig with cpu and memory resources', () => {
        it('should return a completed and valid jobConfig', () => {
            const schema = jobSchema(context);
            const job = {
                resources_requests_cpu: 1,
                resources_requests_memory: 805306368,
                resources_limits_cpu: 1.5,
                resources_limits_memory: 905306368,
                operations: [
                    {
                        _op: 'noop',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };

            const jobConfig = validateJobConfig(schema, job);
            expect(jobConfig.resources_requests_cpu).toEqual(job.resources_requests_cpu);
            expect(jobConfig.resources_requests_memory).toEqual(job.resources_requests_memory);
            expect(jobConfig.resources_limits_cpu).toEqual(job.resources_limits_cpu);
            expect(jobConfig.resources_limits_memory).toEqual(job.resources_limits_memory);
        });
    });

    describe('when passed a jobConfig with old and new cpu and memory resources', () => {
        it('should throw an exception', () => {
            const schema = jobSchema(context);
            const job = {
                cpu: 1,
                memory: 805306368,
                resources_requests_cpu: 1,
                resources_limits_cpu: 1.5,
                resources_requests_memory: 805306368,
                resources_limits_memory: 905306368,
                operations: [
                    {
                        _op: 'noop',
                    },
                    {
                        _op: 'noop',
                    },
                ],
            };

            expect(() => {
                validateJobConfig(schema, job);
            }).toThrowError('Validation failed for job config: undefined - cpu/memory can\'t be mixed with resource settings of the same type.');
        });
    });

    describe('when passed a jobConfig with targets', () => {
        it('should return a completed and valid jobConfig', () => {
            const schema = jobSchema(context);
            const job = {
                targets: [
                    {
                        key: 'zone',
                        value: 'west',
                    },
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
                apis: [],
                operations: [{ _op: 'noop' }, { _op: 'noop' }],
                probation_window: 300000,
                performance_metrics: false,
                slicers: 1,
                targets: [
                    {
                        key: 'zone',
                        value: 'west',
                    },
                ],
                volumes: [],
            };

            const jobConfig = validateJobConfig(schema, job);
            delete (jobConfig as any).workers;
            expect(jobConfig).toMatchObject(validJob);
        });
    });

    describe('when passed a jobConfig with volumes', () => {
        it('should return a completed and valid jobConfig', () => {
            const schema = jobSchema(context);
            const job = {
                volumes: [
                    {
                        name: 'pvc-name',
                        path: '/srv',
                    },
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
                apis: [],
                env_vars: {},
                operations: [{ _op: 'noop' }, { _op: 'noop' }],
                probation_window: 300000,
                performance_metrics: false,
                targets: [],
                volumes: [
                    {
                        name: 'pvc-name',
                        path: '/srv',
                    },
                ],
                slicers: 1,
            };

            const jobConfig = validateJobConfig(schema, job);
            delete (jobConfig as any).workers;
            expect(jobConfig).toMatchObject(validJob);
        });
    });
});
