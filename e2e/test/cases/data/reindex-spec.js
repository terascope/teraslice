'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const misc = require('../../misc');

const teraslice = misc.teraslice();

describe('reindex', () => {
    it('should work for simple case', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'basic reindex';
        jobSpec.operations[1].index = 'test-reindex-10';

        teraslice.jobs.submit(jobSpec)
            .then((job) => {
                expect(job).toBeDefined();
                expect(job.id()).toBeDefined();

                return job.waitForStatus('completed', 100);
            })
            .then(() => misc.indexStats('test-reindex-10')
                .then((stats) => {
                    expect(stats.count).toBe(10);
                    expect(stats.deleted).toBe(0);
                }))
            .catch(fail)
            .finally(done);
    });

    it('should work when no data is returned with lucene query', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'basic reindex';
        jobSpec.operations[1].index = 'test-reindex-bad-query';
        jobSpec.operations[0].query = 'bytes:>=99999999';

        teraslice.jobs.submit(jobSpec)
            .then((job) => {
                expect(job).toBeDefined();
                expect(job.id()).toBeDefined();

                return job.waitForStatus('completed', 100);
            })
            .then((status) => {
                expect(status).toEqual('completed');
                return misc.indexStats('test-reindex-bad-query')
                    .catch((errResponse) => {
                        // the job should  be marked as completed but no new index
                        // as there are no records
                        const reason = _.get(errResponse, 'body.error.reason');
                        expect(reason).toEqual('no such index');
                    });
            })
            .catch(fail)
            .finally(done);
    });

    it('should collect cluster level stats', (done) => {
        teraslice.cluster.stats()
            .then((stats) => {
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
            .catch(fail)
            .finally(done);
    });

    it('should complete after lifecycle changes', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'reindex after lifecycle changes';
        // Job needs to be able to run long enough to cycle
        jobSpec.operations[0].index = 'example-logs-10000';
        jobSpec.operations[1].index = 'test-reindex-lifecycle';

        teraslice.jobs.submit(jobSpec)
            .then((job) => {
                expect(job.id()).toBeDefined();

                return job.waitForStatus('running', 100)
                    .then(() => job.pause())
                    .then(() => job.waitForStatus('paused', 100))
                    .then(() => job.resume())
                    .then(() => job.waitForStatus('running', 100))
                    .then(() => job.stop())
                    .then(() => job.waitForStatus('stopped', 100))
                    .then(() => job.recover())
                    .then(() => job.waitForStatus('completed', 100))
                    .then(() => misc.indexStats('test-reindex-lifecycle')
                        .then((stats) => {
                            expect(stats.count).toBe(10000);
                            expect(stats.deleted).toBe(0);
                        }));
            })
            .catch(fail)
            .finally(done);
    });

    it('can support different recovery scenarios', (done) => {
        const allStates = '/ex/testex/_recover?cleanup=all';
        const errorStates = '/ex/testex/_recover?cleanup=errors';

        Promise.all([teraslice.cluster.post(allStates), teraslice.cluster.post(errorStates)])
            .then(jobs => jobs.map(job => teraslice.jobs.wrap(job.job_id)))
            .then(jobs => Promise.map(jobs, job => job.waitForStatus('completed', 100)))
            .then(() => misc.indexStats('test-recovery-300'))
            .then(stats => expect(stats.count).toEqual(300))
            .catch(fail)
            .finally(done);
    });

    it('should support idempotency', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'reindex 10 times';
        jobSpec.operations[1].index = 'test-reindex-10times';

        const iterations = 10;
        const jobs = [];

        for (let i = 0; i < iterations; i += 1) {
            jobs.push(teraslice.jobs.submit(jobSpec));
        }

        Promise
            .map(jobs, (job) => {
                expect(job).toBeDefined();
                expect(job.id()).toBeDefined();

                return job.waitForStatus('completed', 100);
            })
            .all()
            .then(() => misc.indexStats('test-reindex-10times')
                .then((stats) => {
                    expect(stats.count).toBe(10 * iterations);
                    expect(stats.deleted).toBe(0);
                    done();
                }));
    });
}, 60 * 1000);
