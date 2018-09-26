import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { OperationAPI, OpAPIInstance, ExecutionContextAPI } from '../../src';

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

    const context = new TestContext('teraslice-operations');
    const exConfig = newTestExecutionConfig();

    exConfig.operations.push({
        _op: 'example-op',
    });

    beforeAll(() => {

        const exContextApi = new ExecutionContextAPI(context, exConfig);
        exContextApi.addToRegistry('example/api', ExampleOperationAPI);
        context.apis.registerAPI('executionContext', exContextApi);
    });

    it('should be able to be created', async () => {
        const api:ExampleAPI = await context.apis.executionContext.initAPI('example/api');
        expect(api.hi()).toEqual('hello');
    });

    it('should throw an error if created again', async () => {
        return expect(context.apis.executionContext.initAPI('example/api')).rejects.toThrow();
    });

    it('should be able to be fetched', async () => {
        const api:ExampleAPI = await context.apis.executionContext.getAPI('example/api');
        expect(api.hi()).toEqual('hello');
    });
});
