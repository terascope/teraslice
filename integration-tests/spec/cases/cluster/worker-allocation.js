'use strict'

var misc = require('../../misc')
var wait = require('../../wait')

module.exports = function() {
    var teraslice = misc.teraslice()

    function workersTest(workers, workers_expected, records, done) {
        var job_spec = misc.newJob('reindex')
        job_spec.name = 'worker allocation'
        job_spec.operations[0].index = 'example-logs-' + records
        job_spec.operations[0].size = Math.round(records / workers)
        job_spec.operations[1].index = 'test-allocation-' + workers + '-worker'
        job_spec.workers = workers
        teraslice.jobs.submit(job_spec)
            .then(function(job) {
                return job.waitForStatus('running')
                    .then(function() {
                        return job.workers()
                    })
                    .then(function(running_workers) {
                        expect(running_workers.length).toBe(workers_expected)
                    })
                    .then(function() {
                        return job.waitForStatus('completed')
                    })
                    .then(function() {
                        return wait.forLength(job.workers, 0)
                    })
                    .then(function(worker_count) {
                        expect(worker_count).toBe(0)
                    })
                    .then(function() {
                        return misc.indexStats('test-allocation-' + workers + '-worker')
                            .then(function(stats) {
                                expect(stats.count).toBe(records)
                                expect(stats.deleted).toBe(0)
                            })
                    })
            })
            .catch(fail)
            .finally(function() {
                done()
            })
    }

    describe('worker allocation', function() {

        it('with 1 worker', function(done) {
            workersTest(1, 1, 1000, done)
        })

        it('with 5 workers', function(done) {
            workersTest(5, 5, 10000, done)
        })

        it('with 13 out of requested 20 workers', function(done) {
            workersTest(20, 13, 10000, done)
        })

        // TODO: Debug this test
        xit('should scale from 13 to 20 workers', function(done) {
            // Test cluster has 16 workers total.
            // 1 is consumed by the cluster_master. 1 by the slicer.
            // So the job should consume 13 to start.
            // the when we add another worker. 8 more should become available.
            // And all 20 should schedule.
            var workers = 20
            var records = 10000

            var job_spec = misc.newJob('reindex')
            job_spec.name = 'scale 13 to 20 workers'
            job_spec.operations[0].index = 'example-logs-' + records
            job_spec.operations[0].size = Math.round(records / workers)
            job_spec.operations[1].index = 'test-allocation-worker-scale-13-20'
            job_spec.workers = workers

            teraslice.jobs.submit(job_spec)
                .then(function(job) {
                    return job.waitForStatus('running')
                        .then(function() {
                            return job.workers()
                        })
                        .then(function(running_workers) {
                            // The job should only get 13 workers to start.
                            expect(running_workers.length).toBe(13)

                            // We want 2 workers in the environment
                            return misc.scale(2)
                        })
                        .then(function() {
                            return wait.forLength(job.workers, 20, 100)
                        })
                        .then(function(worker_count) {
                            expect(worker_count).toBe(20)

                            return job.waitForStatus('completed')
                        })
                        .then(function() {
                            return wait.forLength(job.workers, 0, 100)
                        })
                        .then(function(worker_count) {
                            expect(worker_count).toBe(0)
                        })
                        .then(function() {
                            return misc.indexStats(job_spec.operations[1].index)
                                .then(function(stats) {
                                    expect(stats.count).toBe(records)
                                    expect(stats.deleted).toBe(0)
                                })
                        })
                })
                .catch(fail)
                .finally(function() {
                    // Drop back down to a single worker node
                    misc.scale(1)
                        .finally(done)
                })
        })

    })
}
