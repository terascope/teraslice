'use strict';

const { TestContext, newTestExecutionConfig } = require('@terascope/job-components');
const Noop = require('../../lib/processors/noop/processor');
const Schema = require('../../lib/processors/noop/schema');

describe('Noop Processor', () => {
    const context = new TestContext('noop');
    const opConfig = { _op: 'noop' };
    const exConfig = newTestExecutionConfig();

    const noop = new Noop(
        context,
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
        const input = [];
        return expect(noop.onBatch(input)).resolves.toBe(input);
    });

    it('should not mutate the data when given an simple array', () => {
        const input = [
            { a: 1 },
            { a: 2 },
            { a: 3 }
        ];
        return expect(noop.onBatch(input)).resolves.toBe(input);
    });
});

describe('The data remains unchanged when', () => {
});
