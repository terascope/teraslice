import 'jest-extended';
import {
    TestContext, newTestExecutionConfig, WorkerContext, DataEntity
} from '../../src';
import Delay from '../../src/builtin/delay/processor';
import Schema from '../../src/builtin/delay/schema';

describe('Delay Processor', () => {
    const context = new TestContext('delay');
    const opConfig = { _op: 'delay', ms: 100 };
    const exConfig = newTestExecutionConfig();

    const delay = new Delay(
        context as WorkerContext,
        opConfig,
        exConfig
    );

    const schema = new Schema(context);

    it('should have a Schema and Processor class', () => {
        expect(Delay).not.toBeNil();
        expect(Schema).not.toBeNil();
    });

    it('should be able to pass validation', () => {
        const result = schema.validate({ _op: 'delay' });
        expect(result).toHaveProperty('ms', 100);
    });

    it('should delay at least 100ms', async () => {
        const startTime = Date.now();
        await delay.handle([new DataEntity({ hi: true })]);
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(98);
    });

    it('should be use a custom delay', async () => {
        // @ts-ignore
        delay.opConfig.ms = 150;

        const startTime = Date.now();

        await delay.handle([]);

        // this is 148 because bluebird.delay isn't as predicatable
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(148);
    });
});
