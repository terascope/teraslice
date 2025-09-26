import { TerasliceHarness } from '../../teraslice-harness.js';
import { TEST_PLATFORM } from '../../config.js';

describe('job state', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should cycle through after state changes with other jobs running', async () => {
        const jobSpec1 = terasliceHarness.newJob('generator');
        const jobSpec2 = terasliceHarness.newJob('generator');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec1.resources_requests_cpu = 0.05;
            jobSpec1.cpu_execution_controller = 0.4;
            jobSpec2.resources_requests_cpu = 0.05;
            jobSpec2.cpu_execution_controller = 0.4;
        }

        if (!jobSpec2.operations) {
            jobSpec2.operations = [];
        }

        jobSpec2.operations[1].name = 'second_generator';

        const [ex1, ex2] = await Promise.all([
            terasliceHarness.teraslice.executions.submit(jobSpec1),
            terasliceHarness.teraslice.executions.submit(jobSpec2)
        ]);

        await terasliceHarness.waitForExStatus(ex1, 'running');
        await ex1.pause();
        await terasliceHarness.waitForExStatus(ex1, 'paused');
        await ex1.resume();
        await terasliceHarness.waitForExStatus(ex1, 'running');

        await Promise.all([
            ex1.stop({ blocking: true }),
            ex2.stop({ blocking: true }),
        ]);

        // we are testing to see if errors come from transitions, not any end results
        expect(true).toBe(true);
    });
});
