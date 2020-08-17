import 'jest-extended';
import {
    TestContext, newTestExecutionConfig, WorkerContext, DataEntity, DataWindow
} from '../../src';
import Noop from '../../src/builtin/noop/processor';
import Schema from '../../src/builtin/noop/schema';

describe('Noop Processor', () => {
    const context = new TestContext('noop');
    const opConfig = { _op: 'noop' };
    const exConfig = newTestExecutionConfig();

    const noop = new Noop(
        context as WorkerContext,
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
        const input = DataWindow.make({ hi: true });
        return expect(noop.onBatch(input)).resolves.toBe(input);
    });

    it('should not mutate the data when given an simple array', () => {
        const input = new DataWindow([
            new DataEntity({ a: 1 }),
            new DataEntity({ a: 2 }),
            new DataEntity({ a: 3 })
        ]);
        return expect(noop.onBatch(input)).resolves.toBe(input);
    });
});
