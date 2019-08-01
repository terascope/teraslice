'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const misc = require('../../misc');
const { waitForJobStatus } = require('../../wait');
const { resetState, testJobLifeCycle, runEsJob } = require('../../helpers');

const teraslice = misc.teraslice();

describe('reindex', () => {
    beforeAll(() => resetState());

    it('should work for simple case', async () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'basic reindex';
        const specIndex = misc.newSpecIndex('reindex');

        jobSpec.operations[0].index = misc.getExampleIndex(100);
        jobSpec.operations[1].index = specIndex;

        const count = await runEsJob(jobSpec, specIndex);
        expect(count).toBe(100);
    });

    it('should work when no data is returned with lucene query', async () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'basic reindex';
        const specIndex = misc.newSpecIndex('reindex');
        jobSpec.operations[0].query = 'bytes:>=99999999';
        jobSpec.operations[0].index = misc.getExampleIndex(100);
        jobSpec.operations[1].index = specIndex;

        const job = await teraslice.jobs.submit(jobSpec);
        expect(job).toBeDefined();
        expect(job.id()).toBeDefined();

        await waitForJobStatus(job, 'completed');

        // the job should  be marked as completed but no new index
        // as there are no records
        await misc.indexStats('test-reindex-bad-query').catch((errResponse) => {
            const reason = _.get(errResponse, 'body.error.reason');
            expect(reason).toEqual('no such index');
        });
    });

    it('should collect cluster level stats', async () => {
        const stats = await teraslice.cluster.stats();

        expect(stats.controllers.processed).toBeGreaterThan(0);
        expect(stats.controllers.failed).toBe(0);
        expect(stats.controllers.queued).toBeNumber();
        expect(stats.controllers.job_duration).toBeGreaterThan(0);
        expect(stats.controllers.workers_joined).toBeGreaterThan(0);
        expect(stats.controllers.workers_disconnected).toBeNumber();
        expect(stats.controllers.workers_reconnected).toBeNumber();
        // executions: total, failed, active?
        // exceptions?
    });

    it('should complete after lifecycle changes', async () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'reindex after lifecycle changes';
        const specIndex = misc.newSpecIndex('reindex');

        // Job needs to be able to run long enough to cycle
        jobSpec.operations[0].index = misc.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        await testJobLifeCycle(jobSpec);

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toBe(1000);
    });

    it('can support different recovery mode cleanup=errors', async () => {
        const errorStates = '/ex/testex-errors/_recover?cleanup=errors';

        const { job_id: jobId } = await teraslice.cluster.post(errorStates);
        const job = teraslice.jobs.wrap(jobId);
        await waitForJobStatus(job, 'completed');
        const stats = await misc.indexStats('test-recovery-100');
        expect(stats.count).toEqual(100);
    });

    it('can support different recovery mode cleanup=all', async () => {
        const allStates = '/ex/testex-all/_recover?cleanup=all';

        const { job_id: jobId } = await teraslice.cluster.post(allStates);
        const job = teraslice.jobs.wrap(jobId);
        await waitForJobStatus(job, 'completed');
        const stats = await misc.indexStats('test-recovery-200');
        expect(stats.count).toEqual(200);
    });

    it('should support idempotency', async () => {
        const iterations = 3;

        const jobSpec = misc.newJob('reindex');
        const specIndex = misc.newSpecIndex('reindex');

        jobSpec.name = `reindex ${iterations} times`;
        jobSpec.operations[0].index = misc.getExampleIndex(100);
        jobSpec.operations[1].index = specIndex;

        const promises = _.times(iterations, async () => {
            const job = await teraslice.jobs.submit(jobSpec);
            expect(job).toBeDefined();
            expect(job.id()).toBeDefined();

            return waitForJobStatus(job, 'completed');
        });

        await Promise.all(promises);

        const stats = await misc.indexStats(specIndex);

        expect(stats.count).toBe(100);
    });
});
