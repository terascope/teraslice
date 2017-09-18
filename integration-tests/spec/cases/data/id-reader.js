'use strict';

var misc = require('../../misc')();

module.exports = function() {
    var teraslice = misc.teraslice();

    describe('id reader', function() {
        it('should support reindexing', function(done) {
            var job_spec = misc.newJob('id');
            job_spec.name = 'reindex by id';
            job_spec.operations[1].index = "test-id_reindex-10000";

            teraslice.jobs.submit(job_spec)
                .then(function(job) {
                    expect(job).toBeDefined();
                    expect(job.id()).toBeDefined();
                    return job.waitForStatus('completed')
                })
                .then(function() {
                    return misc.indexStats('test-id_reindex-10000')
                        .then(function(stats) {
                            expect(stats.count).toBe(10000);
                            expect(stats.deleted).toBe(0);
                        })
                })
                .catch(fail)
                .finally(done)
        });

        it('should support reindexing by hex id', function(done) {
            var job_spec = misc.newJob('id');
            job_spec.name = 'reindex by hex id';
            job_spec.operations[0].key_type = 'hexadecimal';
            job_spec.operations[0].index = 'example-logs-10000-hex';
            job_spec.operations[1].index = "test-hexadecimal-logs";

            teraslice.jobs.submit(job_spec)
                .then(function(job) {
                    expect(job).toBeDefined();
                    expect(job.id()).toBeDefined();
                    return job.waitForStatus('completed')
                })
                .then(function() {
                    return misc.indexStats('test-hexadecimal-logs')
                        .then(function(stats) {
                            expect(stats.count).toBe(10000);
                            expect(stats.deleted).toBe(0);
                        })
                })
                .catch(fail)
                .finally(done)
        });

        it('should support reindexing by hex id + key_range', function(done) {
            var job_spec = misc.newJob('id');
            job_spec.name = 'reindex by hex id (range=a..e)';
            job_spec.operations[0].key_type = 'hexadecimal';
            job_spec.operations[0].key_range = ['a', 'b', 'c', 'd', 'e'];

            job_spec.operations[0].index = 'example-logs-10000-hex';
            job_spec.operations[1].index = 'test-keyrange-logs';

            teraslice.jobs.submit(job_spec)
                .then(function(job) {
                    expect(job).toBeDefined();
                    expect(job.id()).toBeDefined();
                    return job.waitForStatus('completed')
                })
                .then(function() {
                    return misc.indexStats('test-keyrange-logs')
                        .then(function(stats) {
                            expect(stats.count).toBe(5000);
                            expect(stats.deleted).toBe(0);
                        })
                })
                .catch(fail)
                .finally(done)
        });

        it('should complete after stopping and restarting', function(done) {
            var job_spec = misc.newJob('id');
            // Job needs to be able to run long enough to cycle
            job_spec.name = 'reindex by id (with restart)';
            job_spec.operations[1].index = "test-id_reindex-lifecycle-10000";

            teraslice.jobs.submit(job_spec)
                .then(function(job) {
                    expect(job.id()).toBeDefined();

                    return job.waitForStatus('running')
                        .then(function() {
                            return job.pause()
                        })
                        .then(function() {
                            return job.waitForStatus('paused')
                        })
                        .then(function() {
                            return job.resume()
                        })
                        .then(function() {
                            return job.waitForStatus('running')
                        })
                        .then(function() {
                            return job.stop()
                        })
                        .then(function() {
                            return job.waitForStatus('stopped')
                        })
                        .then(function() {
                            return job.recover()
                        })
                        .then(function() {
                            return job.waitForStatus('completed')
                        })
                        .then(function() {
                            return misc.indexStats("test-id_reindex-lifecycle-10000")
                                .then(function(stats) {
                                    expect(stats.count).toBe(10000);
                                    expect(stats.deleted).toBe(0);
                                })
                        })
                })
                .catch(fail)
                .finally(done)
        })
    })
};
