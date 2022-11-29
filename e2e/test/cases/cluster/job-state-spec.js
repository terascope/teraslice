'use strict';

const TerasliceHarness = require('../../teraslice-harness');

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
