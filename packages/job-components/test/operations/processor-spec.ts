import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { DataEntity, Processor, toDataEntityList } from '../../src';

describe('Processor', () => {
    describe('when mapping', () => {
        class ExampleProcessor extends Processor {
            public onData(data: DataEntity): DataEntity|null|undefined|false {
                data.howdy = 'there';
                if (data.returnThis !== undefined) {
                    return data.returnThis;
                }
                return data;
            }
        }

        let operation: ExampleProcessor;

        beforeAll(() => {
            const context = new TestContext('teraslice-operations');
            const exConfig = newTestExecutionConfig();
            exConfig.operations.push({
                _op: 'example-op',
            });
            const opConfig = exConfig.operations[0];
            operation = new ExampleProcessor(context, opConfig, exConfig);
        });

        describe('->onData', () => {
            it('should resolve the data entity which are passed in', () => {
                const dataEntity = new DataEntity({
                    hello: 'there',
                });
                const result = operation.onData(dataEntity);
                expect(result).toHaveProperty('hello', 'there');
                expect(result).toHaveProperty('howdy', 'there');
            });
        });

        describe('->handle', () => {
            it('should resolve the data entity which are passed in', async () => {
                const input = toDataEntityList([
                    {
                        hello: 'there',
                    },
                    {
                        idk: 'this-will-be-skipped',
                        returnThis: null,
                    },
                    {
                        sup: 'dude',
                    },
                    {
                        idk: 'this-will-return-false',
                        returnThis: false,
                    },
                    {
                        idk: 'this-wont-happen'
                    },
                ]);

                const output = await operation.handle(input);
                const result = output.toArray();

                expect(result).toBeArrayOfSize(2);
                expect(result[0]).toHaveProperty('hello', 'there');
                expect(result[0]).toHaveProperty('howdy', 'there');
                expect(result[1]).toHaveProperty('sup', 'dude');
                expect(result[1]).toHaveProperty('howdy', 'there');
            });
        });
    });
});
