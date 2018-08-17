'use strict';

const misc = require('../../misc');

describe('job validation', () => {
    it('should be rejected with empty index selector index name', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.operations[1].index = ''; // index selector

        misc.teraslice().jobs.submit(jobSpec)
            .then(() => {
                fail('Submission should not succeed when no index is specified.');
            }) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            })
            .finally(() => { done(); });
    });

    it('should be rejected with empty reader index name', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.operations[0].index = ''; // reader

        misc.teraslice().jobs.submit(jobSpec)
            .catch((err) => {
                expect(err.error).toBe(500);
            })
            .finally(() => { done(); });
    });

    it('should be rejected with slicers = 0', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.slicers = 0;

        misc.teraslice().jobs.submit(jobSpec)
            .then(() => {
                fail('Submission should not succeed when slicers == 0');
            }) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            })
            .finally(() => { done(); });
    });

    it('should be rejected with slicers < 0', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.slicers = -1;

        misc.teraslice().jobs.submit(jobSpec)
            .then(() => {
                fail('Submission should not succeed when slicers == -1');
            }) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            })
            .finally(() => { done(); });
    });

    it('should be rejected with negative workers == 0', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.workers = 0;

        misc.teraslice().jobs.submit(jobSpec)
            .then(() => {
                fail('Submission should not succeed when workers == 0');
            }) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            })
            .finally(() => { done(); });
    });

    it('should be rejected with invalid lifecycle', (done) => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.lifecycle = 'invalid';

        misc.teraslice().jobs.submit(jobSpec)
            .then(() => {
                fail('Submission should not succeed when lifecycle is invalid');
            }) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            })
            .finally(() => { done(); });
    });

    it('should be rejected if empty', (done) => {
        const jobSpec = {};

        misc.teraslice().jobs.submit(jobSpec)
            .then(() => {
                fail('Submission should not succeed when job is empty');
            }) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(400);
            })
            .finally(() => { done(); });
    });
});
