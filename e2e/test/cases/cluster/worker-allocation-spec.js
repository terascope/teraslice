'use strict';

const misc = require('../../misc');
const wait = require('../../wait');
const { resetState } = require('../../helpers');

const { waitForJobStatus } = wait;

const teraslice = misc.teraslice();

async function workersTest(workers, workersExpected, records) {
    const jobSpec = misc.newJob('reindex');
    const specIndex = misc.newSpecIndex('worker-allocation');
    jobSpec.name = 'worker allocation';
    jobSpec.operations[0].index = misc.getExampleIndex(records);
    jobSpec.operations[0].size = 100;
    jobSpec.operations[1].index = specIndex;
    jobSpec.workers = workers;

    misc.injectDelay(jobSpec);

    const job = await teraslice.jobs.submit(jobSpec);
    waitForJobStatus(job, 'running');
    const runningWorkers = await job.workers();
    expect(runningWorkers).toBeArrayOfSize(workersExpected);

    await waitForJobStatus(job, 'completed');

    const workerCount = await wait.forLength(job.workers, 0);
    expect(workerCount).toBe(0);

    const { count } = await misc.indexStats(specIndex);
    expect(count).toBe(records);
}

describe('worker allocation', () => {
    beforeEach(() => resetState());

    it('with 1 worker', () => workersTest(1, 1, 1000));

    it('with 3 workers', () => workersTest(5, 5, 1000));
});
