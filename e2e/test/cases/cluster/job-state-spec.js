'use strict';

const Promise = require('bluebird');
const { waitForJobStatus } = require('../../wait');
const { resetState } = require('../../helpers');
const misc = require('../../misc');

describe('job state', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    it('should cycle through after state changes with other jobs running', async () => {
        const jobSpec1 = misc.newJob('generator');
        const jobSpec2 = misc.newJob('generator');
        jobSpec2.operations[1].name = 'second_generator';

        const [job1, job2] = await Promise.all([
            teraslice.jobs.submit(jobSpec1),
            teraslice.jobs.submit(jobSpec2)
        ]);

        await waitForJobStatus(job1, 'running');
        await job1.pause();
        await waitForJobStatus(job1, 'paused');
        await job1.resume();
        await waitForJobStatus(job1, 'running');

        await Promise.all([
            job1.stop({ blocking: true }),
            job2.stop({ blocking: true }),
        ]);
    });
});
