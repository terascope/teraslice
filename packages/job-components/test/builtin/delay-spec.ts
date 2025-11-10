import 'jest-extended';
import { DataEntity } from '@terascope/core-utils';
import {
    TestContext, newTestExecutionConfig, Context
} from '../../src/index.js';
import Delay from '../../src/builtin/delay/processor.js';
import Schema from '../../src/builtin/delay/schema.js';

describe('Delay Processor', () => {
    const context = new TestContext('delay');
    const opConfig = { _op: 'delay', ms: 100 };
    const exConfig = newTestExecutionConfig();

    const delay = new Delay(
        context as Context,
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
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should use a custom delay', async () => {
        // @ts-expect-error
        delay.opConfig.ms = 150;

        const startTime = Date.now();

        await delay.handle([]);

        expect(Date.now() - startTime).toBeGreaterThanOrEqual(150);
    });
});
