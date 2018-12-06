'use strict';

const misc = require('../../misc');
const { waitForJobStatus } = require('../../wait');
const { resetState } = require('../../helpers');

const teraslice = misc.teraslice();

describe('elasticsearch bulk', () => {
    beforeAll(() => resetState());

    it('should support multisend', (done) => {
        const jobSpec = misc.newJob('multisend');
        jobSpec.name = 'multisend';
        jobSpec.operations[1].index = 'test-multisend-1000';

        teraslice.jobs.submit(jobSpec)
            .then((job) => {
                expect(job).toBeDefined();
                expect(job.id()).toBeDefined();
                return waitForJobStatus(job, 'completed');
            })
            .then(() => misc.indexStats('test-multisend-1000')
                .then((stats) => {
                    expect(stats.count).toBe(1000);
                }))
            .catch(fail)
            .finally(() => { done(); });
    });
});
