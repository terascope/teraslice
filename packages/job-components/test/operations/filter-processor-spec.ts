import 'jest-extended';
import { DataEntity } from '@terascope/core-utils';
import {
    FilterProcessor, newTestExecutionConfig, TestContext,
    Context
} from '../../src/index.js';

describe('FilterProcessor', () => {
    class ExampleProcessor extends FilterProcessor<Record<string, any>> {
        filter(data: DataEntity): boolean {
            return data.keep;
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

    describe('->filter', () => {
        it('should return the modified data entities which are passed in', () => {
            const dataEntity = new DataEntity({
                hello: 'there',
            });
            expect(operation.filter(dataEntity)).toBeFalsy();
        });
    });

    describe('->handle', () => {
        it('should resolve the modified data entities which are passed in', async () => {
            const input = DataEntity.makeArray([
                {
                    hello: 'there',
                    keep: true,
                },
                {
                    sup: 'dude',
                    keep: false,
                },
            ]);

            const output = await operation.handle(input);
            const result = output;

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toHaveProperty('hello', 'there');
        });
    });
});
