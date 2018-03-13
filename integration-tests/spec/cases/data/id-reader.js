'use strict';

const misc = require('../../misc')();

module.exports = function () {
    const teraslice = misc.teraslice();

    describe('id reader', () => {
        it('should support reindexing', (done) => {
            const jobSpec = misc.newJob('id');
            jobSpec.name = 'reindex by id';
            jobSpec.operations[1].index = 'test-id_reindex-10000';

            teraslice.jobs.submit(jobSpec)
                .then((job) => {
                    expect(job).toBeDefined();
                    expect(job.id()).toBeDefined();
                    return job.waitForStatus('completed');
                })
                .then(() => misc.indexStats('test-id_reindex-10000')
                    .then((stats) => {
                        expect(stats.count).toBe(10000);
                        expect(stats.deleted).toBe(0);
                    }))
                .catch(fail)
                .finally(done);
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
                    return job.waitForStatus('completed');
                })
                .then(() => misc.indexStats('test-hexadecimal-logs')
                    .then((stats) => {
                        expect(stats.count).toBe(10000);
                        expect(stats.deleted).toBe(0);
                    }))
                .catch(fail)
                .finally(done);
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
                    return job.waitForStatus('completed');
                })
                .then(() => misc.indexStats('test-keyrange-logs')
                    .then((stats) => {
                        expect(stats.count).toBe(5000);
                        expect(stats.deleted).toBe(0);
                    }))
                .catch(fail)
                .finally(done);
        });

        it('should complete after stopping and restarting', (done) => {
            const jobSpec = misc.newJob('id');
            // Job needs to be able to run long enough to cycle
            jobSpec.name = 'reindex by id (with restart)';
            jobSpec.operations[1].index = 'test-id_reindex-lifecycle-10000';

            teraslice.jobs.submit(jobSpec)
                .then((job) => {
                    expect(job.id()).toBeDefined();

                    return job.waitForStatus('running')
                        .then(() => job.pause())
                        .then(() => job.waitForStatus('paused'))
                        .then(() => job.resume())
                        .then(() => job.waitForStatus('running'))
                        .then(() => job.stop())
                        .then(() => job.waitForStatus('stopped'))
                        .then(() => job.recover())
                        .then(() => job.waitForStatus('completed'))
                        .then(() => misc.indexStats('test-id_reindex-lifecycle-10000')
                            .then((stats) => {
                                expect(stats.count).toBe(10000);
                                expect(stats.deleted).toBe(0);
                            }));
                })
                .catch(fail)
                .finally(done);
        });
    });
};
