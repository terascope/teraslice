import { Ex } from 'teraslice-client-js';
import { WorkerNode } from '@terascope/types/dist/src/teraslice.js';
import { pDelay } from '@terascope/core-utils';
import { TerasliceHarness } from '../../teraslice-harness.js';
import { config } from '../../config.js';

const { DEFAULT_WORKERS, TEST_PLATFORM } = config;

describe('scale execution', () => {
    let terasliceHarness: TerasliceHarness;
    let job: Ex;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();

        const jobSpec = terasliceHarness.newJob('generator');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'scale execution';

        jobSpec.workers = DEFAULT_WORKERS;

        job = await terasliceHarness.submitAndStart(jobSpec);
    });

    afterAll(async () => {
        await job.stop();
    });

    it(`should start with ${DEFAULT_WORKERS} workers`, async () => {
        let runningWorkers: WorkerNode[] = [];
        while (runningWorkers.length === 0) {
            await pDelay(100);
            runningWorkers = await job.workers();
        }
        expect(runningWorkers).toBeArrayOfSize(DEFAULT_WORKERS);
    });

    it('should add 1 worker', async () => {
        const runningWorkers = await terasliceHarness.addWorkers(job.id(), 1);
        expect(runningWorkers).toBe(DEFAULT_WORKERS + 1);
    });

    it('should remove 2 workers', async () => {
        const runningWorkers = await terasliceHarness.removeWorkers(job.id(), 2);
        expect(runningWorkers).toBe(DEFAULT_WORKERS - 1);
    });

    it('should set workers to 2', async () => {
        const runningWorkers = await terasliceHarness.setWorkers(job.id(), 2);
        expect(runningWorkers).toBe(2);
    });
});
