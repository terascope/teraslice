import 'jest-extended'; // require for type definitions
import { Schema } from 'convict';
import {
    jobSchema,
    validateJobConfig,
    validateOpConfig,
    TestContext,
    K8sJobConfig,
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
                operations: [{ _op: 'noop' }, { _op: 'noop' }],
                probation_window: 300000,
                recycle_worker: null,
                slicers: 1,
            };

            const jobConfig = validateJobConfig(schema, job);
            delete jobConfig.workers;
            expect(jobConfig as object).toEqual(validJob);
        });
    });

    describe('when passed a job without a known connector', () => {
        it('should raises an exception', () => {
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
            expect(config as object).toEqual({
                _op: 'some-op',
                _encoding: 'json',
                _dead_letter_action: 'none',
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
            expect(config as object).toEqual({
                _op: 'some-op',
                _encoding: 'json',
                _dead_letter_action: 'none',
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
            expect(config as object).toEqual({
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
            }).toThrowError();
        });
    });

});

describe('when validating k8s clustering', () => {
    const context = new TestContext('teraslice-operations');
    context.sysconfig.teraslice.cluster_manager_type = 'kubernetes';

    describe('when passed a jobConfig with resources', () => {
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

            const jobConfig = validateJobConfig(schema, job) as K8sJobConfig;
            expect(jobConfig.cpu).toEqual(job.cpu);
            expect(jobConfig.memory).toEqual(job.memory);
        });
    });

    describe('when passed a jobConfig with targets', () => {
        it('should return a completed and valid jobConfig', () => {
            const schema = jobSchema(context);
            const job = {
                targets: [
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
                cpu: -1,
                lifecycle: 'once',
                max_retries: 3,
                memory: -1,
                name: 'Custom Job',
                operations: [{ _op: 'noop' }, { _op: 'noop' }],
                probation_window: 300000,
                recycle_worker: null,
                slicers: 1,
                targets: [
                    {
                        key: 'zone',
                        value: 'west'
                    }
                ],
                volumes: [],
            };

            const jobConfig = validateJobConfig(schema, job);
            delete jobConfig.workers;
            expect(jobConfig as object).toEqual(validJob);
        });
    });

    describe('when passed a jobConfig with volumes', () => {
        it('should return a completed and valid jobConfig', () => {
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
                cpu: -1,
                lifecycle: 'once',
                max_retries: 3,
                memory: -1,
                name: 'Custom Job',
                operations: [{ _op: 'noop' }, { _op: 'noop' }],
                probation_window: 300000,
                recycle_worker: null,
                targets: [],
                volumes: [
                    {
                        name: 'pvc-name',
                        path: '/srv'
                    }
                ],
                slicers: 1,
            };

            const jobConfig = validateJobConfig(schema, job);
            delete jobConfig.workers;
            expect(jobConfig as object).toEqual(validJob);
        });
    });
});
