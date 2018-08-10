'use strict';

const processor = require('../../lib/processors/noop');

describe('noop processor', () => {
    it('has a schema and newProcessor method', () => {
        expect(processor).toBeDefined();
        expect(processor.newProcessor).toBeDefined();
        expect(processor.schema).toBeDefined();
        expect(typeof processor.newProcessor).toEqual('function');
        expect(typeof processor.schema).toEqual('function');
    });
});

describe('The data remains unchanged when', () => {
    const context = {};
    const opConfig = {};
    const jobConfig = { logger: 'im a fake logger' };

    const myProcessor = processor.newProcessor(
        context,
        opConfig,
        jobConfig
    );
    it('using empty data array', () => {
        // zero elements
        expect(myProcessor([])).toEqual([]);
    });
    it('using simple data array', () => {
        // zero elements
        const data = [
            { a: 1 },
            { a: 2 },
            { a: 3 }
        ];
        expect(myProcessor(data)).toEqual(data);
    });
});
