import { TerasliceHarness } from '../../teraslice-harness.js';
import { TEST_PLATFORM } from '../../config.js';

/**
 * The id reader don't work in 6.x and greater
 *
 * See:
 *  - https://github.com/terascope/teraslice/issues/68
 *  - https://github.com/terascope/elasticsearch-assets/issues/12
 */
// eslint-disable-next-line jest/no-disabled-tests
describe.skip('id reader', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should support reindexing', async () => {
        const jobSpec = terasliceHarness.newJob('id');
        const specIndex = terasliceHarness.newSpecIndex('id-reader');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.name = 'reindex by id';
        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        const count = await terasliceHarness.runEsJob(jobSpec, specIndex);
        expect(count).toBe(1000);
    });

    it('should support reindexing by hex id', async () => {
        const jobSpec = terasliceHarness.newJob('id');
        const specIndex = terasliceHarness.newSpecIndex('id-reader');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'reindex by hex id';

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].key_type = 'hexadecimal';
        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000); // add hex
        jobSpec.operations[1].index = specIndex;

        const count = await terasliceHarness.runEsJob(jobSpec, specIndex);
        expect(count).toBe(1000);
    });

    it('should support reindexing by hex id + key_range', async () => {
        const jobSpec = terasliceHarness.newJob('id');
        const specIndex = terasliceHarness.newSpecIndex('id-reader');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'reindex by hex id (range=a..e)';

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].key_type = 'hexadecimal';
        jobSpec.operations[0].key_range = ['a', 'b', 'c', 'd', 'e'];
        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000); // add hex

        jobSpec.operations[1].index = specIndex;

        const count = await terasliceHarness.runEsJob(jobSpec, specIndex);
        expect(count).toBe(500);
    });

    it('should be able to recover and continue while using the id_reader', async () => {
        const jobSpec = terasliceHarness.newJob('id');
        const specIndex = terasliceHarness.newSpecIndex('id-reader');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        // Job needs to be able to run long enough to cycle
        jobSpec.name = 'id-reader (with recovery)';

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        await terasliceHarness.testJobLifeCycle(jobSpec);

        const stats = await terasliceHarness.indexStats(specIndex);
        expect(stats.count).toBe(1000);
    });
});
