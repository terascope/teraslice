import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { OperationAPI, OpAPIInstance, ExecutionContextAPI } from '../../src';

describe('OperationAPI', () => {
    interface ExampleAPI extends OpAPIInstance {
        hi(): string;
    }

    class ExampleOperationAPI extends OperationAPI {
        name() {
            return 'ExampleAPI';
        }

        public async handle(): Promise<ExampleAPI> {
            return {
                hi: () => 'hello'
            };
        }
    }

    let operation: ExampleOperationAPI;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        context.apis.registerAPI('executionContext', new ExecutionContextAPI());

        const exConfig = newTestExecutionConfig();

        exConfig.operations.push({
            _op: 'example-op',
        });

        const opConfig = exConfig.operations[0];
        operation = new ExampleOperationAPI(context, opConfig, exConfig);
        operation.register();
    });

    describe('->handle', () => {
        it('should resolve the data entity which are passed in', async () => {
            const result = await operation.handle();
            expect(result.hi()).toEqual('hello');
        });
    });

    describe('->createAPI', () => {
        it('should resolve the data entity which are passed in', async () => {
            const result = await operation.createAPI('ExampleAPI') as ExampleAPI;
            expect(result.hi()).toEqual('hello');
        });
    });
});
