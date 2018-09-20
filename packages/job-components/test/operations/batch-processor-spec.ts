import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { DataEntity, BatchProcessor } from '../../src';

describe('BatchProcessor', () => {
    class ExampleBatchProcessor extends BatchProcessor {
        public async onBatch(batch: DataEntity[]): Promise<DataEntity[]> {
            batch.push(new DataEntity({
                hi: 'there'
            }));
            return batch;
        }
    }

    let operation: ExampleBatchProcessor;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        exConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = exConfig.operations[0];
        operation = new ExampleBatchProcessor(context, opConfig, exConfig);
    });

    describe('->onBatch', () => {
        it('should resolve the data entities which are passed in', async () => {
            const dataEntities = [
                new DataEntity({
                    hello: 'there',
                }),
            ];
            const results = await operation.handle(dataEntities);
            expect(results).toBeArrayOfSize(2);
        });
    });
});
