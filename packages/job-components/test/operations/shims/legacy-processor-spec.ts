import 'jest-extended'; // require for type definitions
import {
    BatchProcessor,
    MapProcessor,
    ConvictSchema,
    legacyProcessorShim,
    DataEntity,
    TestContext,
    newTestExecutionConfig,
    OpConfig,
} from '../../../src';

describe('Legacy Processor Shim', () => {
    class ExampleProcessor<T = object> extends MapProcessor<T> {
        map(data: DataEntity) {
            data.name = 'hello';
            return data;
        }
    }

    class ExampleBatchProcessor<T = object> extends BatchProcessor<T> {
        async onBatch(data: DataEntity[]) {
            return data.map((d) => {
                d.name = 'hello';
                return d;
            });
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
    }

    class InvalidSchema extends ConvictSchema<OpConfig> {
        static type() {
            return 'invalid';
        }

        build() {
            return {};
        }
    }

    const exConfig = newTestExecutionConfig();

    const opConfig = {
        _op: 'example'
    };

    const context = new TestContext('legacy-processor');

    describe('when using data processor', () => {
        const shim = legacyProcessorShim(ExampleProcessor, ExampleSchema);

        it('should handle newProcessor correctly', async () => {
            expect(shim.newProcessor).toBeFunction();
            const processor = await shim.newProcessor(context, opConfig, exConfig);
            const input = DataEntity.makeArray([
                { id: 1 },
                { id: 2 },
            ]);

            const result = await processor(input, context.logger, {});

            expect(result).toBeArrayOfSize(2);
            expect(result[0]).toMatchObject({
                id: 1,
                name: 'hello'
            });

            expect(result[1]).toMatchObject({
                id: 2,
                name: 'hello'
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

    describe('when using batch processor', () => {
        const shim = legacyProcessorShim(ExampleBatchProcessor, ExampleSchema);

        it('should handle newProcessor correctly', async () => {
            expect(shim.newProcessor).toBeFunction();
            const processor = await shim.newProcessor(context, opConfig, exConfig);
            const input = DataEntity.makeArray([
                { id: 1 },
                { id: 2 },
                { id: 3 },
            ]);

            const result = await processor(input, context.logger, {});

            expect(result).toBeArrayOfSize(3);
            expect(result[0]).toMatchObject({
                id: 1,
                name: 'hello'
            });

            expect(result[1]).toMatchObject({
                id: 2,
                name: 'hello'
            });

            expect(result[2]).toMatchObject({
                id: 3,
                name: 'hello'
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

    describe('when using an unsupport schema type', () => {
        const shim = legacyProcessorShim(ExampleProcessor, InvalidSchema);

        it('should throw error if invalid schema type', () => {
            expect(() => {
                shim.schema(context);
            }).toThrowError('Backwards compatibility only works for "convict" schemas');
        });
    });

});
