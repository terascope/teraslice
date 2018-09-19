import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
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
        const jobConfig = newTestJobConfig();
        jobConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = jobConfig.operations[0];
        const logger = context.apis.foundation.makeLogger('job-logger');
        operation = new ExampleProcessor(context, jobConfig, opConfig, logger);
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
