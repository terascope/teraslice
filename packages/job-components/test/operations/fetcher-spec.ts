import 'jest-extended';
import { DataEntity } from '@terascope/core-utils';
import {
    Fetcher, newTestExecutionConfig, TestContext,
    Context
} from '../../src/index.js';

describe('Fetcher', () => {
    class ExampleFetcher extends Fetcher<Record<string, any>> {
        public async fetch(): Promise<DataEntity[]> {
            return [
                new DataEntity({ hi: true })
            ];
        }
    }

    let operation: ExampleFetcher;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        exConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = exConfig.operations[0];
        operation = new ExampleFetcher(context as Context, opConfig, exConfig);
    });

    describe('->fetch', () => {
        it('should resolve with data entries', async () => {
            const output = await operation.handle();
            expect(output).toBeArrayOfSize(1);
        });
    });
});
