/* eslint-disable jest/expect-expect */
import { TerasliceHarness } from '../../teraslice-harness.js';
import { config } from '../../config.js';

const { TEST_PLATFORM } = config;

async function workersTest(
    harness: TerasliceHarness,
    workers: number,
    workersExpected: number,
    records: number
) {
    const jobSpec = harness.newJob('reindex');
    const specIndex = harness.newSpecIndex('worker-allocation');
    // Set resource constraints on workers within CI
    if (TEST_PLATFORM === 'kubernetesV2') {
        jobSpec.resources_requests_cpu = 0.1;
    }
    jobSpec.name = 'worker allocation';

    jobSpec.apis[0].index = harness.getExampleIndex(records);
    jobSpec.apis[0].size = 100;
    jobSpec.apis[1].index = specIndex;
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
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('with 1 worker', () => workersTest(terasliceHarness, 1, 1, 1000));

    it('with 3 workers', () => workersTest(terasliceHarness, 5, 5, 1000));
});
