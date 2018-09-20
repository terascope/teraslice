import { newTestExecutionConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { Fetcher, DataEntity } from '../../src';

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
        operation = new ExampleFetcher(context, opConfig, exConfig);
    });

    describe('->fetch', () => {
        it('should resolve with data entries', () => {
            return expect(operation.handle()).resolves.toBeArrayOfSize(1);
        });
    });
});
