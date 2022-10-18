/* eslint-disable max-classes-per-file */

import 'jest-extended'; // require for type definitions
import {
    OperationAPI,
    operationAPIShim,
    ExecutionContextAPI,
    TestContext,
    newTestExecutionConfig
} from '../../../src/index.js';

describe('Operation APIs Shim', () => {
    class HelloAPI extends OperationAPI {
        async createAPI() {
            return () => 'hello';
        }
    }

    class HiAPI extends OperationAPI {
        async createAPI() {
            return () => 'hi';
        }
    }

    const context = new TestContext('teraslice-operations');
    const exConfig = newTestExecutionConfig();

    const exContextApi = new ExecutionContextAPI(context, exConfig);
    context.apis.registerAPI('executionContext', exContextApi);

    it('should add both apis', async () => {
        expect(() => {
            operationAPIShim(context, {
                hello: HelloAPI,
                hi: HiAPI,
            });
        }).not.toThrowError();

        await context.apis.executionContext.initAPI('hello');
        await context.apis.executionContext.initAPI('hi');

        const hello = await context.apis.executionContext.getAPI('hello');
        const hi = await context.apis.executionContext.getAPI('hi');

        expect(hello()).toEqual('hello');
        expect(hi()).toEqual('hi');
    });
});
