import 'jest-extended'; // require for type definitions
import { Fetcher, DataEntity, newTestExecutionConfig, TestContext, WorkerContext } from '../../src';

describe('Fetcher', () => {
    class ExampleFetcher extends Fetcher {
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
        operation = new ExampleFetcher(context as WorkerContext, opConfig, exConfig);
    });

    describe('->fetch', () => {
        it('should resolve with data entries', async () => {
            const output = await operation.handle();
            expect(output.toArray()).toBeArrayOfSize(1);
        });
    });
});
