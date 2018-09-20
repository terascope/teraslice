import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
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
        const exConfig = newTestExecutionConfig();
        exConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = exConfig.operations[0];
        operation = new ExampleOperationAPI(context, opConfig, exConfig);
    });

    describe('->createAPI', () => {
        it('should resolve the data entity which are passed in', async () => {
            const result = await operation.createAPI();
            expect(result.hi()).toEqual('hello');
        });
    });
});
