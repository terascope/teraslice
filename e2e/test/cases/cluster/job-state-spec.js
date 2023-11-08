'use strict';

const TerasliceHarness = require('../../teraslice-harness');
const { TEST_PLATFORM } = require('../../config');

describe('job state', () => {
    let terasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should cycle through after state changes with other jobs running', async () => {
        const jobSpec1 = terasliceHarness.newJob('generator');
        const jobSpec2 = terasliceHarness.newJob('generator');
        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            jobSpec1.resources_requests_cpu = 0.1;
            jobSpec1.resources_limits_cpu = 0.5;
            jobSpec1.cpu_execution_controller = 0.2;
            jobSpec2.resources_requests_cpu = 0.1;
            jobSpec2.resources_limits_cpu = 0.5;
            jobSpec2.cpu_execution_controller = 0.2;
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
    });
});
