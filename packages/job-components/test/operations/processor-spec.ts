import { newTestJobConfig, TestContext } from '@terascope/teraslice-types';
import 'jest-extended'; // require for type definitions
import { DataEntity, Processor } from '../../src';

describe('Processor', () => {
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
            it('should reject with an implementation warning', () => {
                const dataEntity = new DataEntity({
                    hello: 'there',
                });
                return expect(operation.onData(dataEntity)).rejects.toThrowError('Processor must implement a "onData" method');
            });
        });
    });

    describe('when extending the base class', () => {
        class ExampleProcessor extends Processor {
            public async onData(data: DataEntity): Promise<DataEntity|null> {
                data.howdy = 'there';
                return data;
            }
        }

        let operation: ExampleProcessor;

        beforeAll(() => {
            const context = new TestContext('teraslice-operations');
            const jobConfig = newTestJobConfig();
            jobConfig.operations.push({
                _op: 'example-op',
            });
            const opConfig = jobConfig.operations[0];
            const logger = context.apis.foundation.makeLogger('job-logger');
            operation = new ExampleProcessor(context, jobConfig, opConfig, logger);
        });

        describe('->onData', () => {
            it('should resolve the data entity which are passed in', async () => {
                const dataEntity = new DataEntity({
                    hello: 'there',
                });
                const result = await operation.onData(dataEntity);
                expect(result).toHaveProperty('hello', 'there');
                expect(result).toHaveProperty('howdy', 'there');
            });
        });
    });
});
