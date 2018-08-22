import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { Fetcher, DataEntity } from '../../src';

describe('Fetch Operation Base Class', () => {
    describe('when constructed', () => {
        let operation: Fetcher;

        beforeAll(() => {
            const context = new TestContext('teraslice-operations');
            const jobConfig = newTestJobConfig();
            jobConfig.operations.push({
                _op: 'example-op',
            });
            const opConfig = jobConfig.operations[0];
            const logger = context.apis.foundation.makeLogger('job-logger');
            operation = new Fetcher(context, jobConfig, opConfig, logger);
        });

        describe('->fetch', () => {
            it('should reject with an implementation warning', () => {
                return expect(operation.fetch()).rejects.toThrowError('Fetcher must implement a "fetch" method');
            });
        });
    });

    describe('when extending the base class', () => {
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
            const jobConfig = newTestJobConfig();
            jobConfig.operations.push({
                _op: 'example-op',
            });
            const opConfig = jobConfig.operations[0];
            const logger = context.apis.foundation.makeLogger('job-logger');
            operation = new ExampleFetcher(context, jobConfig, opConfig, logger);
        });

        describe('->fetch', () => {
            it('should resolve with data entries', () => {
                return expect(operation.fetch()).resolves.toBeArrayOfSize(1);
            });
        });
    });
});
