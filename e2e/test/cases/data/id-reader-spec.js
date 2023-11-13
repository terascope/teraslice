'use strict';

const TerasliceHarness = require('../../teraslice-harness');
const { TEST_PLATFORM } = require('../../config');

/**
 * The id reader don't work in 6.x and greater
 *
 * See:
 *  - https://github.com/terascope/teraslice/issues/68
 *  - https://github.com/terascope/elasticsearch-assets/issues/12
 */
// eslint-disable-next-line jest/no-disabled-tests
xdescribe('id reader', () => {
    let terasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should support reindexing', async () => {
        const jobSpec = terasliceHarness.newJob('id');
        const specIndex = terasliceHarness.newSpecIndex('id-reader');
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
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
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'reindex by hex id';
        jobSpec.operations[0].key_type = 'hexadecimal';
        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000); // add hex
        jobSpec.operations[1].index = specIndex;

        const count = await terasliceHarness.runEsJob(jobSpec, specIndex);
        expect(count).toBe(1000);
    });

    it('should support reindexing by hex id + key_range', async () => {
        const jobSpec = terasliceHarness.newJob('id');
        const specIndex = terasliceHarness.newSpecIndex('id-reader');
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'reindex by hex id (range=a..e)';
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
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        // Job needs to be able to run long enough to cycle
        jobSpec.name = 'id-reader (with recovery)';
        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        await terasliceHarness.testJobLifeCycle(jobSpec);

        const stats = await terasliceHarness.indexStats(specIndex);
        expect(stats.count).toBe(1000);
    });
});
