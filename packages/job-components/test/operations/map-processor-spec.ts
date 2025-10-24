import 'jest-extended';
import { DataEntity } from '@terascope/entity-utils';
import {
    MapProcessor, newTestExecutionConfig, TestContext,
    Context
} from '../../src/index.js';

describe('MapProcessor', () => {
    class ExampleProcessor extends MapProcessor<Record<string, any>> {
        map(data: DataEntity): DataEntity {
            data.howdy = 'there';
            return data;
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

    describe('->map', () => {
        it('should return the modified data entities which are passed in', () => {
            const dataEntity = new DataEntity({
                hello: 'there',
            });
            const result = operation.map(dataEntity);
            expect(result).toHaveProperty('hello', 'there');
            expect(result).toHaveProperty('howdy', 'there');
        });
    });

    describe('->handle', () => {
        it('should resolve the modified data entities which are passed in', async () => {
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

            expect(result).toBeArrayOfSize(2);
            expect(result[0]).toHaveProperty('hello', 'there');
            expect(result[0]).toHaveProperty('howdy', 'there');
            expect(result[1]).toHaveProperty('sup', 'dude');
            expect(result[1]).toHaveProperty('howdy', 'there');
        });
    });
});
