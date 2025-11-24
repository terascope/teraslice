import 'jest-extended';
import { DataEntity } from '@terascope/core-utils';
import {
    TestContext, newTestExecutionConfig, Context
} from '../../src/index.js';
import Noop from '../../src/builtin/noop/processor.js';
import Schema from '../../src/builtin/noop/schema.js';

describe('Noop Processor', () => {
    const context = new TestContext('noop');
    const opConfig = { _op: 'noop' };
    const exConfig = newTestExecutionConfig();

    const noop = new Noop(
        context as Context,
        opConfig,
        exConfig
    );

    const schema = new Schema(context);

    it('should have a Schema and Processor class', () => {
        expect(Noop).not.toBeNil();
        expect(Schema).not.toBeNil();
    });

    it('should be able to pass validation', () => {
        const result = schema.validate({ _op: 'delay' });
        expect(result).toMatchObject({ _op: 'delay' });
    });

    it('should not mutate the data when given an empty array', () => {
        const input = [
            new DataEntity({ hi: true }),
        ];
        return expect(noop.onBatch(input)).resolves.toBe(input);
    });

    it('should not mutate the data when given an simple array', () => {
        const input = [
            new DataEntity({ a: 1 }),
            new DataEntity({ a: 2 }),
            new DataEntity({ a: 3 })
        ];
        return expect(noop.onBatch(input)).resolves.toBe(input);
    });
});
