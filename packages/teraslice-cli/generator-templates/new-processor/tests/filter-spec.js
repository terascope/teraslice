'use strict';

const { OpTestHarness } = require('teraslice-test-harness');
const Processor = require('../asset/<%= name %>/processor.js');
const Schema = require('../asset/<%= name %>/schema.js');

const opConfig = {
    _op: '<%= name %>',
    type: 'string'
};

const testData = [
    {
        id: 1
    },
    {
        id: 2,
        type: 'string'
    },
    {
        id: 3,
        type: 'number'
    }
];

describe('<%= name %> should', () => {
    const testHarness = new OpTestHarness({ Processor, Schema });

    beforeAll(async () => {
        await testHarness.initialize({ opConfig });
    });

    it('generate an empty result if no input data', async () => {
        const results = await testHarness.run([]);
        expect(results.length).toBe(0);
    });

    it('only return docs with type string', async () => {
        const results = await testHarness.run(testData);
        expect(results.length).toBe(1);
    });
});
