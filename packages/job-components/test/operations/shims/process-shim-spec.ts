import 'jest-extended'; // require for type definitions
import { TestContext, newTestExecutionConfig } from '@terascope/teraslice-types';
import { processorShim, DataEntity } from '../../../src';

describe('Processor Shim', () => {
    const context = new TestContext('teraslice-operations');
    const exConfig = newTestExecutionConfig();

    const opConfig = {
        _op: 'hello'
    };
    exConfig.operations.push(opConfig);

    const mod = processorShim({
        async newProcessor(context, opConfig, executionConfig) {
            context.logger.debug(opConfig, executionConfig);
            return async (input) => {
                return input.map((d: DataEntity) => {
                    d.say = 'hello';
                    return d;
                });
            };
        },
        schema() {
            return {
                example: {
                    default: 'examples are quick and easy',
                    doc: 'A random example schema property',
                    format: 'String',
                }
            };
        }
    });

    it('should have the required constructors', async () => {
        expect(mod.Processor).not.toBeNil();
        expect(mod.Schema).not.toBeNil();
    });

    it('should have a functioning Schema', () => {
        expect(mod.Schema.type()).toEqual('convict');
        const schema = new mod.Schema();
        expect(schema.build()).toEqual({
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            }
        });
    });

    it('should have a functioning Processor', async () => {
        const processor = new mod.Processor(context, opConfig, exConfig);
        await processor.initialize();

        const input = DataEntity.makeList([{ say: 'hi' }]);

        const result = await processor.handle(input);

        expect(result.toArray()[0].toJSON()).toEqual({
            say: 'hello'
        });
    });
});
