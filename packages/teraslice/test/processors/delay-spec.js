'use strict';

const { TestContext, newTestExecutionConfig } = require('@terascope/job-components');
const Delay = require('../../lib/processors/delay/processor');
const Schema = require('../../lib/processors/delay/schema');

describe('Delay Processor', () => {
    const context = new TestContext('delay');
    const opConfig = { _op: 'delay', ms: 100 };
    const exConfig = newTestExecutionConfig();

    const delay = new Delay(
        context,
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
        await delay.handle([]);
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should be use a custom delay', async () => {
        delay.opConfig.ms = 150;

        const startTime = Date.now();

        await delay.handle([]);

        // this is 148 because bluebird.delay isn't as predicatable
        expect(Date.now() - startTime).toBeGreaterThanOrEqual(148);
    });
});
