import 'jest-extended'; // require for type definitions
import {
    processorShim,
    DataEntity,
    TestContext,
    newTestExecutionConfig,
    WorkerContext,
    ValidatedJobConfig
} from '../../../src/index.js';

describe('Processor Shim', () => {
    const context = new TestContext('teraslice-operations');
    const exConfig = newTestExecutionConfig();

    const opConfig = {
        _op: 'hello',
    };
    exConfig.operations.push(opConfig);

    interface ExampleOpConfig {
        example: string;
    }

    const mod = processorShim<ExampleOpConfig>({
        async newProcessor(_context, _opConfig, executionConfig) {
            _context.logger.debug(_opConfig, executionConfig);
            return async (input) => input.map((d: DataEntity) => {
                d.say = 'hello';
                return d;
            });
        },
        crossValidation(job, sysconfig) {
            if (job.slicers !== exConfig.slicers) {
                throw new Error('Incorrect slicers');
            }

            if (!sysconfig.teraslice.name) {
                throw new Error('No teraslice name');
            }
        },
        selfValidation() {},
        schema() {
            return {
                example: {
                    default: 'examples are quick and easy',
                    doc: 'A random example schema property',
                    format: 'String',
                },
            };
        },
    });

    it('should have the required constructors', async () => {
        expect(mod.Processor).not.toBeNil();
        expect(mod.Schema).not.toBeNil();
    });

    it('should have a functioning Schema', () => {
        expect(mod.Schema.type()).toEqual('convict');
        const schema = new mod.Schema(context);
        expect(schema.build()).toEqual({
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            },
        });

        const result = schema.validate({ _op: 'hi', example: 'hello' });
        expect(result.example).toEqual('hello');

        if (schema.validateJob) {
            expect(schema.validateJob(exConfig as ValidatedJobConfig)).toBeNil();
        }

        expect(() => {
            if (!schema.validateJob) return;
            const testConfig = { slicers: 1000 };
            schema.validateJob(testConfig as ValidatedJobConfig);
        }).toThrow();
    });

    it('should have a functioning Processor', async () => {
        const processor = new mod.Processor(context as WorkerContext, opConfig, exConfig);
        await processor.initialize();

        const input = DataEntity.makeArray([{ say: 'hi' }]);

        const result = await processor.handle(input);

        expect(result[0]).toEqual({
            say: 'hello',
        });
    });
});
