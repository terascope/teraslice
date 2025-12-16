import { TerasliceHarness } from '../../teraslice-harness.js';
import { config } from '../../config.js';

const { TEST_PLATFORM } = config;

describe('elasticsearch bulk', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should support multisend', async () => {
        const jobSpec = terasliceHarness.newJob('multisend');
        const specIndex = terasliceHarness.newSpecIndex('elasticsearch-bulk');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'multisend';

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        const count = await terasliceHarness.runEsJob(jobSpec, specIndex);
        expect(count).toBe(1000);
    });
});
