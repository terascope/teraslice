'use strict';

const misc = require('../../misc');
const wait = require('../../wait');
const { resetState } = require('../../helpers');

const { waitForJobStatus } = wait;

const teraslice = misc.teraslice();

function workersTest(workers, workersExpected, records, done) {
    const jobSpec = misc.newJob('reindex');
    jobSpec.name = 'worker allocation';
    jobSpec.operations[0].index = `example-logs-${records}`;
    jobSpec.operations[0].size = Math.round(records / workers);
    jobSpec.operations[1].index = `test-allocation-${workers}-worker`;
    jobSpec.workers = workers;
    teraslice.jobs.submit(jobSpec)
        .then(job => waitForJobStatus(job, 'running')
            .then(() => job.workers())
            .then((runningWorkers) => {
                expect(runningWorkers.length).toBe(workersExpected);
            })
            .then(() => waitForJobStatus(job, 'completed'))
            .then(() => wait.forLength(job.workers, 0))
            .then((workerCount) => {
                expect(workerCount).toBe(0);
            })
            .then(() => misc.indexStats(`test-allocation-${workers}-worker`)
                .then((stats) => {
                    expect(stats.count).toBe(records);
                    expect(stats.deleted).toBe(0);
                })))
        .catch(fail)
        .finally(() => {
            done();
        });
}

describe('worker allocation', () => {
    beforeEach(() => resetState());

    it('with 1 worker', (done) => {
        workersTest(1, 1, 1000, done);
    });

    it('with 5 workers', (done) => {
        workersTest(5, 5, 10000, done);
    });

    it('with more workers than available', (done) => {
        const total = misc.WORKERS_PER_NODE * misc.DEFAULT_NODES;
        workersTest(total + 2, total - 3, 10000, done);
    });

    // TODO: Debug this test
    xit('should scale from 13 to 20 workers', (done) => {
        // Test cluster has 20 workers total.
        // 1 is consumed by the cluster_master. 1 by the execution controller.
        // So the job should consume 13 to start.
        // the when we add another worker. 4 more should become available.
        // And all 20 should schedule.
        const workers = 20;
        const records = 10000;

        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'scale 13 to 20 workers';
        jobSpec.operations[0].index = `example-logs-${records}`;
        jobSpec.operations[0].size = Math.round(records / workers);
        jobSpec.operations[1].index = 'test-allocation-worker-scale-13-20';
        jobSpec.workers = workers;

        teraslice.jobs.submit(jobSpec)
            .then(job => waitForJobStatus(job, 'running')
                .then(() => job.workers())
                .then((runningWorkers) => {
                    // The job should only get 13 workers to start.
                    expect(runningWorkers.length).toBe(13);

                    // We want 2 workers in the environment
                    return misc.scaleWorkers(2);
                })
                .then(() => wait.forLength(job.workers, 20, 100))
                .then((workerCount) => {
                    expect(workerCount).toBe(20);

                    return waitForJobStatus(job, 'completed');
                })
                .then(() => wait.forLength(job.workers, 0, 100))
                .then((workerCount) => {
                    expect(workerCount).toBe(0);
                })
                .then(() => misc.indexStats(jobSpec.operations[1].index)
                    .then((stats) => {
                        expect(stats.count).toBe(records);
                        expect(stats.deleted).toBe(0);
                    })))
            .catch(fail)
            .finally(() => {
                // Scale back to a default worker count.
                misc.scaleWorkers(3)
                    .finally(() => { done(); });
            });
    });
});
