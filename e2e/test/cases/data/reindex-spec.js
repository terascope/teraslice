import { get, times } from '@terascope/utils';
import misc from '../../misc';
import { waitForExStatus } from '../../wait';
import { resetState, runEsJob, testJobLifeCycle } from '../../helpers';

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

        const ex = await teraslice.executions.submit(jobSpec);
        await waitForExStatus(ex, 'completed');

        // the job should  be marked as completed but no new index
        // as there are no records
        await misc.indexStats(specIndex).catch((errResponse) => {
            const reason = get(errResponse, 'body.error.reason');
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

    it('should support idempotency', async () => {
        const iterations = 3;

        const jobSpec = misc.newJob('reindex');
        const specIndex = misc.newSpecIndex('reindex');

        jobSpec.name = `reindex ${iterations} times`;
        jobSpec.operations[0].index = misc.getExampleIndex(100);
        jobSpec.operations[0].interval = '1s';
        jobSpec.operations[1].index = specIndex;

        const promises = times(iterations, async () => {
            const ex = await teraslice.executions.submit(jobSpec);
            return waitForExStatus(ex, 'completed');
        });

        await Promise.all(promises);

        const stats = await misc.indexStats(specIndex);

        expect(stats.count).toBe(100);
    });

    it('should be able to recover and continue', async () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.name = 'reindex (with recovery)';

        const index = misc.newSpecIndex('reindex');

        // Job needs to be able to run long enough to cycle
        jobSpec.operations[0].index = misc.getExampleIndex(1000);
        jobSpec.operations[1].index = index;

        await testJobLifeCycle(jobSpec);

        const stats = await misc.indexStats(index);
        expect(stats.count).toBe(1000);
    });
});
