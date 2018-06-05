'use strict';

const misc = require('../../misc')();
const wait = require('../../wait')();

module.exports = function workerAllocationTest() {
    const teraslice = misc.teraslice();

    function workersTest(workers, workersExpected, records, done) {
        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'worker allocation';
        jobSpec.operations[0].index = `example-logs-${records}`;
        jobSpec.operations[0].size = Math.round(records / workers);
        jobSpec.operations[1].index = `test-allocation-${workers}-worker`;
        jobSpec.workers = workers;
        teraslice.jobs.submit(jobSpec)
            .then(job => job.waitForStatus('running')
                .then(() => job.workers())
                .then((runningWorkers) => {
                    expect(runningWorkers.length).toBe(workersExpected);
                })
                .then(() => job.waitForStatus('completed'))
                .then(() => wait.forLength(job.workers, 0))
                .then((workerCount) => {
                    expect(workerCount).toBe(0);
                })
                .then(() => misc.indexStats(`test-allocation-${workers}-worker`)
                    .then((stats) => {
                        expect(stats.count).toBe(records);
                        expect(stats.deleted).toBe(0);
                    })))
            .catch(done.fail)
            .finally(() => {
                done();
            });
    }

    describe('worker allocation', () => {
        it('with 1 worker', (done) => {
            workersTest(1, 1, 1000, done);
        });

        it('with 5 workers', (done) => {
            workersTest(5, 5, 10000, done);
        });

        it('with 17 out of requested 20 workers', (done) => {
            workersTest(20, 17, 10000, done);
        });

        // TODO: Debug this test
        xit('should scale from 13 to 20 workers', (done) => {
            // Test cluster has 20 workers total.
            // 1 is consumed by the cluster_master. 1 by the slicer.
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
                .then(job => job.waitForStatus('running')
                    .then(() => job.workers())
                    .then((runningWorkers) => {
                        // The job should only get 13 workers to start.
                        expect(runningWorkers.length).toBe(13);

                        // We want 2 workers in the environment
                        return misc.scale(2);
                    })
                    .then(() => wait.forLength(job.workers, 20, 100))
                    .then((workerCount) => {
                        expect(workerCount).toBe(20);

                        return job.waitForStatus('completed');
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
                .catch(done.fail)
                .finally(() => {
                    // Drop back down to a single worker node
                    misc.scale(1)
                        .finally(done);
                });
        });
    });
};
