import 'jest-extended'; // require for type definitions
import { readerShim, TestContext, newTestExecutionConfig, SlicerContext, WorkerContext, ValidatedJobConfig } from '../../../src';

describe('Reader Shim', () => {
    const context = new TestContext('teraslice-operations');
    const exConfig = newTestExecutionConfig();

    const opConfig = {
        _op: 'hello'
    };
    exConfig.slicers = 2;
    exConfig.operations.push(opConfig);

    interface ExampleOpConfig {
        example: string;
    }

    const mod = readerShim<ExampleOpConfig>({
        slicerQueueLength() {
            return 'QUEUE_MINIMUM_SIZE';
        },
        async newSlicer(context, executionContext, recoveryData, logger) {
            logger.debug(opConfig, executionContext, recoveryData, context.sysconfig.teraslice.assets_directory);
            const results = [{ say: 'hi' }, { say: 'hello' }];
            return [
                async () => results.shift() || null,
                async () => results.shift() || null,
            ];
        },
        async newReader(context, opConfig, executionConfig) {
            context.logger.debug(opConfig, executionConfig);
            return async () => {
                return [{ say: 'howdy' }];
            };
        },
        crossValidation(job, sysconfig) {
            if (job.slicers !== exConfig.slicers) {
                throw new Error('Incorrect slicers');
            }

            if (!sysconfig.teraslice.name) {
                throw new Error('No teraslice name');
            }
        },
        selfValidation() {

        },
        schema() {
            return {
                example: {
                    default: 'examples are quick and easy',
                    doc: 'A random example schema property',
                    format: 'String',
                }
            };
        },
    });

    it('should have the required constructors', async () => {
        expect(mod.Slicer).not.toBeNil();
        expect(mod.Fetcher).not.toBeNil();
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
            }
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

    it('should have a functioning Slicer', async () => {
        const slicer = new mod.Slicer(context as SlicerContext, opConfig, exConfig);
        await slicer.initialize([]);

        expect(await slicer.handle()).toBeFalse();

        expect(await slicer.handle()).toBeTrue();

        expect(slicer.getSlice()).toMatchObject({
            request: {
                say: 'hi'
            }
        });

        expect(slicer.getSlice()).toMatchObject({
            request: {
                say: 'hello'
            }
        });

        expect(slicer.getSlice()).toBeNull();

        expect(slicer.isRecoverable()).toBeTrue();
        expect(slicer.maxQueueLength()).toEqual(0);
    });

    it('should have a functioning Fetcher', async () => {
        const fetcher = new mod.Fetcher(context as WorkerContext, opConfig, exConfig);
        await fetcher.initialize();

        const result = await fetcher.handle();

        expect(result.toArray()[0].toJSON()).toEqual({
            say: 'howdy'
        });
    });
});
