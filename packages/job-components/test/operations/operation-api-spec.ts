import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { OperationAPI, OpAPIInstance } from '../../src';

describe('OperationAPI', () => {
    interface ExampleAPI extends OpAPIInstance {
        hi(): string;
    }

    class ExampleOperationAPI extends OperationAPI {
        public async createAPI(): Promise<ExampleAPI> {
            return {
                hi: () => 'hello'
            };
        }
    }

    let operation: ExampleOperationAPI;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const jobConfig = newTestJobConfig();
        jobConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = jobConfig.operations[0];
        const logger = context.apis.foundation.makeLogger('job-logger');
        operation = new ExampleOperationAPI(context, jobConfig, opConfig, logger);
    });

    describe('->createAPI', () => {
        it('should resolve the data entity which are passed in', async () => {
            const result = await operation.createAPI();
            expect(result.hi()).toEqual('hello');
        });
    });
});
