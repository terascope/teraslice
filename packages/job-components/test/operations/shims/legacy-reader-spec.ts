/* eslint-disable max-classes-per-file */

import 'jest-extended'; // require for type definitions
import { jest } from '@jest/globals';
import {
    Fetcher, Slicer, ParallelSlicer,
    ConvictSchema, legacyReaderShim, TestContext,
    newTestExecutionConfig, newTestExecutionContext,
    OpConfig, JobConfig,
} from '../../../src/index.js';

describe('Legacy Reader Shim', () => {
    class ExampleParallelSlicer extends ParallelSlicer<ExampleOpConfig> {
        async newSlicer() {
            return async () => ({
                hello: true
            });
        }
    }

    const slicerShutdown = jest.fn();

    class ExampleSlicer extends Slicer<ExampleOpConfig> {
        async slice() {
            return {
                hello: true
            };
        }

        async shutdown(): Promise<void> {
            slicerShutdown();
        }
    }

    class ExampleFetcher extends Fetcher<ExampleOpConfig> {
        async fetch() {
            return [
                {
                    hello: true
                }
            ];
        }
    }

    interface ExampleOpConfig extends OpConfig {
        example: string;
    }

    class ExampleSchema extends ConvictSchema<ExampleOpConfig> {
        build() {
            return {
                example: {
                    default: 'examples are quick and easy',
                    doc: 'A random example schema property',
                    format: 'String',
                }
            };
        }

        validateJob(job: JobConfig) {
            if (!job.name) {
                throw new Error('Missing job name');
            }
        }
    }

    class InvalidSchema extends ConvictSchema<OpConfig> {
        static type() {
            return 'invalid';
        }

        build() {
            return {};
        }

        validateJob(job: JobConfig) {
            if (!job.name) {
                throw new Error('Missing job name');
            }
        }
    }

    const exConfig = newTestExecutionConfig();
    exConfig.slicers = 3;
    exConfig.operations.push({
        _op: 'example'
    });
    const opConfig = exConfig.operations[0];

    const context = new TestContext('legacy-processor');

    describe('when using a parallel slicer', () => {
        const shim = legacyReaderShim(ExampleParallelSlicer, ExampleFetcher, ExampleSchema);

        it('should handle newReader correctly', async () => {
            expect(shim.newReader).toBeFunction();
            const reader = await shim.newReader(context, opConfig, exConfig);

            const result = await reader({}, context.logger);

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toMatchObject({
                hello: true
            });
        });

        it('should handle newSlicer correctly', async () => {
            expect(shim.newSlicer).toBeFunction();

            const exContext = newTestExecutionContext('execution_controller', exConfig);
            const slicers = await shim.newSlicer(context, exContext, [], context.logger);

            const result = await Promise.all(slicers.map((fn) => fn()));

            expect(result).toBeArrayOfSize(3);
            expect(result[0]).toMatchObject({
                hello: true
            });

            expect(result[1]).toMatchObject({
                hello: true
            });

            expect(result[2]).toMatchObject({
                hello: true
            });
        });

        it('should handle schema correctly', () => {
            expect(shim.schema).toBeFunction();
            const schema = shim.schema(context);
            expect(schema).toEqual({
                example: {
                    default: 'examples are quick and easy',
                    doc: 'A random example schema property',
                    format: 'String',
                }
            });
            expect(shim.crossValidation).toBeFunction();
            expect(() => {
                // @ts-expect-error
                shim.crossValidation(exConfig, context.sysconfig);
            }).not.toThrow();
        });
    });

    describe('when using a single slicer', () => {
        const shim = legacyReaderShim(ExampleSlicer, ExampleFetcher, ExampleSchema);

        it('should handle newReader correctly', async () => {
            expect(shim.newReader).toBeFunction();
            const reader = await shim.newReader(context, opConfig, exConfig);

            const result = await reader({}, context.logger);
            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toMatchObject({
                hello: true
            });
        });

        it('should handle newSlicer correctly', async () => {
            expect(shim.newSlicer).toBeFunction();
            const events = context.apis.foundation.getSystemEvents();

            const exContext = newTestExecutionContext('execution_controller', exConfig);
            const slicers = await shim.newSlicer(context, exContext, [], context.logger);

            events.emit('worker:shutdown');

            const result = await Promise.all(slicers.map((fn) => fn()));

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toMatchObject({
                hello: true
            });

            expect(slicerShutdown).toHaveBeenCalled();
        });

        it('should handle schema correctly', () => {
            expect(shim.schema).toBeFunction();
            const schema = shim.schema(context);
            expect(schema).toEqual({
                example: {
                    default: 'examples are quick and easy',
                    doc: 'A random example schema property',
                    format: 'String',
                }
            });

            expect(() => {
                // @ts-expect-error
                shim.crossValidation(exConfig, context.sysconfig);
            }).not.toThrow();
        });
    });

    describe('when using an unsupport schema type', () => {
        const shim = legacyReaderShim(ExampleSlicer, ExampleFetcher, InvalidSchema);

        it('should throw error if invalid schema type', () => {
            expect(() => {
                shim.schema(context);
            }).toThrowError('Backwards compatibility only works for "convict" schemas');

            expect(() => {
                // @ts-expect-error
                shim.crossValidation(exConfig, context.sysconfig);
            }).toThrowError('Backwards compatibility only works for "convict" schemas');
        });
    });
});
