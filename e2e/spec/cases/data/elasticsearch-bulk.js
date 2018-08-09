'use strict';

const misc = require('../../misc');

const teraslice = misc.teraslice();

describe('elasticsearch bulk', () => {
    it('should support multisend', (done) => {
        const jobSpec = misc.newJob('multisend');
        jobSpec.name = 'multisend';
        jobSpec.operations[1].index = 'test-multisend-10000';

        teraslice.jobs.submit(jobSpec)
            .then((job) => {
                expect(job).toBeDefined();
                expect(job.id()).toBeDefined();
                return job.waitForStatus('completed', 100);
            })
            .then(() => misc.indexStats('test-multisend-10000')
                .then((stats) => {
                    expect(stats.count).toBe(10000);
                }))
            .catch(fail)
            .finally(done);
    });
});
