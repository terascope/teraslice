import { TerasliceHarness } from '../../teraslice-harness.js';
import { config } from '../../config.js';

const { TEST_PLATFORM } = config;

describe('job validation', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should be rejected with empty index selector index name', () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[1].index = ''; // index selector

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when no index is specified.'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with empty reader index name', () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].index = ''; // reader

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with slicers = 0', () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.slicers = 0;

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when slicers == 0'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with slicers < 0', () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.slicers = -1;

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .then(() => {
                throw new Error('Submission should not succeed when slicers == -1');
            }) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with negative workers == 0', () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.workers = 0;

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when workers == 0'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with invalid lifecycle', () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        // @ts-expect-error
        jobSpec.lifecycle = 'invalid';

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when lifecycle is invalid'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected if empty', () => {
        const jobSpec = {} as any;

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when job is empty'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(400);
            });
    });
});
