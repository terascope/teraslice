import 'jest-extended';
import { DataEntity } from '@terascope/entity-utils';
import {
    EachProcessor, newTestExecutionConfig, TestContext,
    Context
} from '../../src/index.js';

describe('EachProcessor', () => {
    let processedCount = 0;
    class ExampleProcessor extends EachProcessor<Record<string, any>> {
        forEach(data: DataEntity): void {
            if (data) {
                processedCount += 1;
            }
        }
    }

    let operation: ExampleProcessor;

    beforeAll(() => {
        const context = new TestContext('teraslice-operations');
        const exConfig = newTestExecutionConfig();
        exConfig.operations.push({
            _op: 'example-op',
        });
        const opConfig = exConfig.operations[0];
        operation = new ExampleProcessor(context as Context, opConfig, exConfig);
    });

    beforeEach(() => {
        processedCount = 0;
    });

    describe('->forEach', () => {
        it('should return nothing', () => {
            const dataEntity = new DataEntity({
                hello: 'there',
            });
            expect(operation.forEach(dataEntity)).toBeNil();
            expect(processedCount).toEqual(1);
        });
    });

    describe('->handle', () => {
        it('should resolve the data entity which are passed in', async () => {
            const input = DataEntity.makeArray([
                {
                    hello: 'there',
                },
                {
                    sup: 'dude',
                },
            ]);

            const output = await operation.handle(input);
            const result = output;

            expect(processedCount).toEqual(2);
            expect(result).toBeArrayOfSize(2);
            expect(result[0]).toHaveProperty('hello', 'there');
            expect(result[1]).toHaveProperty('sup', 'dude');
        });
    });
});
