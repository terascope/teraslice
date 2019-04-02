'use strict';

const processor = require('../asset/good_processor');
// eslint-disable-next-line
const harness = require('@terascope/teraslice-op-test-harness')(processor);

const opConfig = {
    _op: 'good_processor'
};

describe('good_processor should', () => {
    it('generate an empty result if no input data', async () => {
        const opHarness = await harness.init({ opConfig });
        const results = await opHarness.run([]);
        expect(results.length).toEqual(0);
    });
});
