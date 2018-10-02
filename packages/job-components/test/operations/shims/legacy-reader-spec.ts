import 'jest-extended'; // require for type definitions
import { TestContext, newTestExecutionConfig, newTestExecutionContext, Assignment } from '@terascope/teraslice-types';
import { Fetcher, Slicer, ParallelSlicer, ConvictSchema, legacyReaderShim } from '../../../src';

describe('Legacy Reader Shim', () => {
    class ExampleParallelSlicer extends ParallelSlicer {
        async newSlicer() {
            return async () => ({
                hello: true
            });
        }
    }

    const slicerShutdown = jest.fn();

    class ExampleSlicer extends Slicer {
        async slice() {
            return {
                hello: true
            };
        }

        async shutdown() {
            slicerShutdown();
        }
    }

    class ExampleFetcher extends Fetcher {
        async fetch() {
            return [
                {
                    hello: true
                }
            ];
        }
    }

    class ExampleSchema extends ConvictSchema {
        build() {
            return {
                example: {
                    default: 'examples are quick and easy',
                    doc: 'A random example schema property',
                    format: 'String',
                }
            };
        }
    }

    class InvalidSchema extends ConvictSchema {
        static type() {
            return 'invalid';
        }

        build() {
            return {};
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

            const result = await reader({});

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toMatchObject({
                hello: true
            });
        });

        it('should handle newSlicer correctly', async () => {
            expect(shim.newSlicer).toBeFunction();

            const exContext = newTestExecutionContext(Assignment.ExecutionController, exConfig);
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
        });
    });

    describe('when using a single slicer', () => {
        const shim = legacyReaderShim(ExampleSlicer, ExampleFetcher, ExampleSchema);

        it('should handle newReader correctly', async () => {
            expect(shim.newReader).toBeFunction();
            const reader = await shim.newReader(context, opConfig, exConfig);

            const result = await reader({});
            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toMatchObject({
                hello: true
            });
        });

        it('should handle newSlicer correctly', async () => {
            expect(shim.newSlicer).toBeFunction();
            const events = context.apis.foundation.getSystemEvents();

            const exContext = newTestExecutionContext(Assignment.ExecutionController, exConfig);
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
        });
    });

    describe('when using an unsupport schema type', () => {
        const shim = legacyReaderShim(ExampleSlicer, ExampleFetcher, InvalidSchema);

        it('should throw error if invalid schema type', () => {
            expect(() => {
                shim.schema(context);
            }).toThrowError('Backwards compatibility only works for "convict" schemas');
        });
    });
});
