'use strict';

const misc = require('../../misc');
const { waitForJobStatus } = require('../../wait');
const { resetState } = require('../../helpers');

const teraslice = misc.teraslice();

describe('recovery', () => {
    beforeAll(() => resetState());

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
});
