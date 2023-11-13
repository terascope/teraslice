'use strict';

const TerasliceHarness = require('../../teraslice-harness');
const { TEST_PLATFORM } = require('../../config');

describe('job validation', () => {
    let terasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should be rejected with empty index selector index name', () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.2;
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
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.2;
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
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.2;
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
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.2;
        }
        jobSpec.slicers = -1;

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .then(() => new Promise(new Error('Submission should not succeed when slicers == -1'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with negative workers == 0', () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.2;
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
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.2;
        }
        jobSpec.lifecycle = 'invalid';

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when lifecycle is invalid'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected if empty', () => {
        const jobSpec = {};

        return terasliceHarness.teraslice
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when job is empty'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(400);
            });
    });
});
