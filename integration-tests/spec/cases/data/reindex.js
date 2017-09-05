'use strict';

var Promise = require('bluebird');
var misc = require('../../misc')();

module.exports = function() {
    var teraslice = misc.teraslice();

    describe('reindex', function() {

        it('should work for simple case', function(done) {
            var job_spec = misc.newJob('reindex');
            job_spec.name = 'basic reindex';
            job_spec.operations[1].index = 'test-reindex-10';

            teraslice.jobs.submit(job_spec)
                .then(function(job) {
                    expect(job).toBeDefined();
                    expect(job.id()).toBeDefined();

                    return job.waitForStatus('completed');
                })
                .then(function() {
                    return misc.indexStats('test-reindex-10')
                        .then(function(stats) {
                            expect(stats.count).toBe(10);
                            expect(stats.deleted).toBe(0);
                        });
                })
                .catch(fail)
                .finally(done)
        });

        it('should collect cluster level stats', function(done) {
            teraslice.cluster.stats()
                .then(function(stats) {
                    expect(stats.slicer.processed).toBeGreaterThan(0);
                    expect(stats.slicer.failed).toBe(0);
                    expect(stats.slicer.queued).toBeDefined();
                    expect(stats.slicer.job_duration).toBeGreaterThan(0);
                    expect(stats.slicer.workers_joined).toBeGreaterThan(0);
                    expect(stats.slicer.workers_disconnected).toBeDefined();
                    expect(stats.slicer.workers_reconnected).toBeDefined();
                    // executions: total, failed, active?
                    // exceptions?
                })
                .catch(function(err) {
                    console.log('what error', err);
                    fail()
                })
                .finally(done)
        });

        it('should complete after lifecycle changes', function(done) {
            var job_spec = misc.newJob('reindex');
            job_spec.name = 'reindex after lifecycle changes';
            // Job needs to be able to run long enough to cycle
            job_spec.operations[0].index = 'example-logs-10000';
            job_spec.operations[1].index = 'test-reindex-lifecycle';

            teraslice.jobs.submit(job_spec)
                .then(function(job) {
                    expect(job.id()).toBeDefined();

                    return job.waitForStatus('running')
                        .then(function() {
                            return job.pause();
                        })
                        .then(function() {
                            return job.waitForStatus('paused');
                        })
                        .then(function() {
                            return job.resume();
                        })
                        .then(function() {
                            return job.waitForStatus('running');
                        })
                        .then(function() {
                            return job.stop();
                        })
                        .then(function() {
                            return job.waitForStatus('stopped');
                        })
                        .then(function() {
                            return job.recover();
                        })
                        .then(function() {
                            return job.waitForStatus('completed');
                        })
                        .then(function() {
                            return misc.indexStats('test-reindex-lifecycle')
                                .then(function(stats) {
                                    expect(stats.count).toBe(10000);
                                    expect(stats.deleted).toBe(0);
                                });
                        });
                })
                .catch(fail)
                .finally(done);
        });

        it('should support idempotency', function(done) {
            var job_spec = misc.newJob('reindex');
            job_spec.name = 'reindex 10 times';
            job_spec.operations[1].index = 'test-reindex-10times';

            var iterations = 10;
            var jobs = [];

            for (var i = 0; i < iterations; i++) {
                jobs.push(teraslice.jobs.submit(job_spec));
            }

            Promise
                .map(jobs, function(job) {
                    expect(job).toBeDefined();
                    expect(job.id()).toBeDefined();

                    return job.waitForStatus('completed');
                })
                .all()
                .then(function() {
                    return misc.indexStats('test-reindex-10times')
                        .then(function(stats) {
                            expect(stats.count).toBe(10 * iterations);
                            expect(stats.deleted).toBe(0);
                            done();
                        });
                });
        });

    });
};
