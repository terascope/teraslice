'use strict';

const TerasliceHarness = require('../../teraslice-harness');
const { TEST_PLATFORM } = require('../../config');

describe('elasticsearch bulk', () => {
    let terasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should support multisend', async () => {
        const jobSpec = terasliceHarness.newJob('multisend');
        const specIndex = terasliceHarness.newSpecIndex('elasticsearch-bulk');
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'multisend';
        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        const count = await terasliceHarness.runEsJob(jobSpec, specIndex);
        expect(count).toBe(1000);
    });
});
