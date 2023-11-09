'use strict';

const TerasliceHarness = require('../../teraslice-harness');
const { TEST_PLATFORM } = require('../../config');

async function workersTest(harness, workers, workersExpected, records) {
    const jobSpec = harness.newJob('reindex');
    const specIndex = harness.newSpecIndex('worker-allocation');
    // Set resource constraints on workers and ex controllers within CI
    if (TEST_PLATFORM === 'kubernetes') {
        jobSpec.resources_requests_cpu = 0.1;
        jobSpec.resources_limits_cpu = 0.5;
        jobSpec.cpu_execution_controller = 0.2;
    }
    jobSpec.name = 'worker allocation';
    jobSpec.operations[0].index = harness.getExampleIndex(records);
    jobSpec.operations[0].size = 100;
    jobSpec.operations[1].index = specIndex;
    jobSpec.workers = workers;

    harness.injectDelay(jobSpec);

    const job = await harness.submitAndStart(jobSpec);
    const runningWorkers = await job.workers();
    expect(runningWorkers).toBeArrayOfSize(workersExpected);

    await harness.waitForExStatus(job, 'completed');

    const workerCount = await harness.forLength(job.workers, 0);
    expect(workerCount).toBe(0);

    const { count } = await harness.indexStats(specIndex);
    expect(count).toBe(records);
}

describe('worker allocation', () => {
    let terasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('with 1 worker', () => workersTest(terasliceHarness, 1, 1, 1000));

    it('with 3 workers', () => workersTest(terasliceHarness, 5, 5, 1000));
});
