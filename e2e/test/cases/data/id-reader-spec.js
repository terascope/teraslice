'use strict';

const misc = require('../../misc');
const { waitForJobStatus } = require('../../wait');
const { resetState } = require('../../helpers');

const teraslice = misc.teraslice();

describe('id reader', () => {
    beforeAll(() => resetState());

    it('should support reindexing', (done) => {
        const jobSpec = misc.newJob('id');
        jobSpec.name = 'reindex by id';
        jobSpec.operations[1].index = 'test-id_reindex-10000';

        teraslice.jobs.submit(jobSpec)
            .then((job) => {
                expect(job).toBeDefined();
                expect(job.id()).toBeDefined();
                return waitForJobStatus(job, 'completed');
            })
            .then(() => misc.indexStats('test-id_reindex-10000')
                .then((stats) => {
                    expect(stats.count).toBe(10000);
                }))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('should support reindexing by hex id', (done) => {
        const jobSpec = misc.newJob('id');
        jobSpec.name = 'reindex by hex id';
        jobSpec.operations[0].key_type = 'hexadecimal';
        jobSpec.operations[0].index = 'example-logs-10000-hex';
        jobSpec.operations[1].index = 'test-hexadecimal-logs';

        teraslice.jobs.submit(jobSpec)
            .then((job) => {
                expect(job).toBeDefined();
                expect(job.id()).toBeDefined();
                return waitForJobStatus(job, 'completed');
            })
            .then(() => misc.indexStats('test-hexadecimal-logs')
                .then((stats) => {
                    expect(stats.count).toBe(10000);
                }))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('should support reindexing by hex id + key_range', (done) => {
        const jobSpec = misc.newJob('id');
        jobSpec.name = 'reindex by hex id (range=a..e)';
        jobSpec.operations[0].key_type = 'hexadecimal';
        jobSpec.operations[0].key_range = ['a', 'b', 'c', 'd', 'e'];

        jobSpec.operations[0].index = 'example-logs-10000-hex';
        jobSpec.operations[1].index = 'test-keyrange-logs';

        teraslice.jobs.submit(jobSpec)
            .then((job) => {
                expect(job).toBeDefined();
                expect(job.id()).toBeDefined();
                return waitForJobStatus(job, 'completed');
            })
            .then(() => misc.indexStats('test-keyrange-logs')
                .then((stats) => {
                    expect(stats.count).toBe(5000);
                    expect(stats.deleted).toBe(0);
                }))
            .catch(fail)
            .finally(() => { done(); });
    });

    it('should complete after stopping and restarting', (done) => {
        const jobSpec = misc.newJob('id');
        // Job needs to be able to run long enough to cycle
        jobSpec.name = 'reindex by id (with restart)';
        jobSpec.operations[1].index = 'test-id_reindex-lifecycle-10000';

        teraslice.jobs.submit(jobSpec)
            .then((job) => {
                expect(job.id()).toBeDefined();

                return waitForJobStatus(job, 'running')
                    .then(() => job.pause())
                    .then(() => waitForJobStatus(job, 'paused'))
                    .then(() => job.resume())
                    .then(() => waitForJobStatus(job, 'running'))
                    .then(() => job.stop())
                    .then(() => waitForJobStatus(job, 'stopped'))
                    .then(() => job.recover())
                    .then(() => waitForJobStatus(job, 'completed'))
                    .then(() => misc.indexStats('test-id_reindex-lifecycle-10000')
                        .then((stats) => {
                            expect(stats.count).toBe(10000);
                        }));
            })
            .catch(fail)
            .finally(() => { done(); });
    });
});
