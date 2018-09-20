import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { DataEntity, Processor } from '../../src';

describe('Processor', () => {
    class ExampleProcessor extends Processor {
        public async onData(data: DataEntity): Promise<DataEntity|null> {
            data.howdy = 'there';
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
        it('should resolve the data entity which are passed in', async () => {
            const dataEntity = new DataEntity({
                hello: 'there',
            });
            const result = await operation.onData(dataEntity);
            expect(result).toHaveProperty('hello', 'there');
            expect(result).toHaveProperty('howdy', 'there');
        });
    });
});
