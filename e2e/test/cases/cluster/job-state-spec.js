'use strict';

const Promise = require('bluebird');
const misc = require('../../misc');


describe('worker allocation', () => {
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

                return job1.waitForStatus('running')
                    .then(() => job1.pause())
                    .then(() => job1.waitForStatus('paused'))
                    .then(() => job1.resume())
                    .then(() => job1.waitForStatus('running'))
                    .then(() => job1.stop())
                    .then(() => job1.waitForStatus('stopped'))
                    .then(() => job2.stop())
                    .then(() => job2.waitForStatus('stopped'));
            })
            .catch(fail)
            .finally(() => { done(); });
    });
});
