import { get, times } from '@terascope/core-utils';
import { TerasliceHarness } from '../../teraslice-harness.js';
import { config } from '../../config.js';

const { TEST_PLATFORM } = config;

describe('reindex', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should work for simple case', async () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.4;
        }
        jobSpec.name = 'basic reindex';
        const specIndex = terasliceHarness.newSpecIndex('reindex');

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(100);
        jobSpec.operations[1].index = specIndex;

        const count = await terasliceHarness.runEsJob(jobSpec, specIndex);
        expect(count).toBe(100);
    });

    it('should work when no data is returned with lucene query', async () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        jobSpec.name = 'basic reindex';
        const specIndex = terasliceHarness.newSpecIndex('reindex');
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.4;
        }

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].query = 'bytes:>=99999999';
        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(100);
        jobSpec.operations[1].index = specIndex;

        const ex = await terasliceHarness.teraslice.executions.submit(jobSpec);
        await terasliceHarness.waitForExStatus(ex, 'completed');

        // the job should  be marked as completed but no new index
        // as there are no records
        await terasliceHarness.indexStats(specIndex).catch((errResponse) => {
            const reason = get(errResponse, 'body.error.reason');
            expect(reason).toContain('no such index');
        });
    });

    it('should collect cluster level stats', async () => {
        const stats = await terasliceHarness.teraslice.cluster.stats();

        expect(stats.controllers.processed).toBeGreaterThan(0);
        expect(stats.controllers.failed).toBe(0);
        expect(stats.controllers.queued).toBeNumber();
        expect(stats.controllers.job_duration).toBeGreaterThan(0);
        expect(stats.controllers.workers_joined).toBeGreaterThan(0);
        expect(stats.controllers.workers_disconnected).toBeNumber();
        expect(stats.controllers.workers_reconnected).toBeNumber();
        // executions: total, failed, active?
        // exceptions?
    });

    it('should support idempotency', async () => {
        const iterations = 3;

        const jobSpec = terasliceHarness.newJob('reindex');
        const specIndex = terasliceHarness.newSpecIndex('reindex');
        jobSpec.name = `reindex ${iterations} times`;
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.4;
        }

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(100);
        jobSpec.operations[0].interval = '1s';
        jobSpec.operations[1].index = specIndex;

        const promises = times(iterations, async () => {
            const ex = await terasliceHarness.teraslice.executions.submit(jobSpec);
            return terasliceHarness.waitForExStatus(ex, 'completed');
        });

        await Promise.all(promises);

        const stats = await terasliceHarness.indexStats(specIndex);

        expect(stats.count).toBe(100);
    });

    it('should be able to recover and continue', async () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        const index = terasliceHarness.newSpecIndex('reindex');
        jobSpec.name = 'reindex (with recovery)';
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
            jobSpec.cpu_execution_controller = 0.4;
        }

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        // Job needs to be able to run long enough to cycle
        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        jobSpec.operations[1].index = index;

        await terasliceHarness.testJobLifeCycle(jobSpec);

        const stats = await terasliceHarness.indexStats(index);
        expect(stats.count).toBe(1000);
    });
});
