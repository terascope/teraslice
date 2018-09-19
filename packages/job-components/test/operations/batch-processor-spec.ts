import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
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
        const jobConfig = newTestJobConfig();
        jobConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = jobConfig.operations[0];
        const logger = context.apis.foundation.makeLogger('job-logger');
        operation = new ExampleBatchProcessor(context, jobConfig, opConfig, logger);
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
