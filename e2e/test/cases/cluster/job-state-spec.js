'use strict';

const Promise = require('bluebird');
const misc = require('../../misc');
const { waitForJobStatus } = require('../../wait');
const { resetState } = require('../../helpers');

describe('worker allocation', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    it('should cycle through after state changes with other jobs running', (done) => {
        const jobSpec1 = misc.newJob('generator');
        const jobSpec2 = misc.newJob('generator');
        let job1Id;
        let job2Id;
        jobSpec2.operations[1].name = 'second_generator';

        Promise.all([teraslice.jobs.submit(jobSpec1), teraslice.jobs.submit(jobSpec2)])
            .spread((job1, job2) => {
                job1Id = job1.id();
                job2Id = job2.id();
                expect(job1Id).toBeDefined();
                expect(job2Id).toBeDefined();

                return waitForJobStatus(job1, 'running')
                    .then(() => job1.pause())
                    .then(() => waitForJobStatus(job1, 'paused'))
                    .then(() => job1.resume())
                    .then(() => waitForJobStatus(job1, 'running'))
                    .then(() => job1.stop())
                    .then(() => waitForJobStatus(job1, 'stopped'))
                    .then(() => job2.stop())
                    .then(() => waitForJobStatus(job2, 'stopped'));
            })
            .catch(fail)
            .finally(() => { done(); });
    });
});
