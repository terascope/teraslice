import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { DataEntity, Processor } from '../../src';

describe('Processor Base Class', () => {
    describe('when constructed', () => {
        let operation: Processor;

        beforeAll(() => {
            const context = new TestContext('teraslice-operations');
            const jobConfig = newTestJobConfig();
            jobConfig.operations.push({
                _op: 'example-op',
            });
            const opConfig = jobConfig.operations[0];
            const logger = context.apis.foundation.makeLogger('job-logger');
            operation = new Processor(context, jobConfig, opConfig, logger);
        });

        describe('->onData', () => {
            it('should resolve the data entity which are passed in', () => {
                const dataEntity = new DataEntity({
                    hello: 'there',
                });
                return expect(operation.onData(dataEntity)).resolves.toEqual(dataEntity);
            });
        });

        describe('->onBatch', () => {
            it('should resolve an array of data entities which are passed in', () => {
                const dataEntities: DataEntity[] = [
                    new DataEntity({
                        hello: 'there',
                    }),
                    new DataEntity({
                        hi: 'there',
                    }),
                ];
                return expect(operation.onBatch(dataEntities)).resolves.toEqual(dataEntities);
            });
        });
    });
});
