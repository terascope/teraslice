import misc from '../../misc';
import { resetState } from '../../helpers';

describe('job validation', () => {
    beforeAll(() => resetState());

    it('should be rejected with empty index selector index name', () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.operations[1].index = ''; // index selector

        return misc.teraslice()
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when no index is specified.'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with empty reader index name', () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.operations[0].index = ''; // reader

        return misc.teraslice()
            .jobs.submit(jobSpec)
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with slicers = 0', () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.slicers = 0;

        return misc.teraslice()
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when slicers == 0'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with slicers < 0', () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.slicers = -1;

        return misc.teraslice()
            .jobs.submit(jobSpec)
            .then(() => new Promise(new Error('Submission should not succeed when slicers == -1'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with negative workers == 0', () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.workers = 0;

        return misc.teraslice()
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when workers == 0'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected with invalid lifecycle', () => {
        const jobSpec = misc.newJob('reindex');
        jobSpec.lifecycle = 'invalid';

        return misc.teraslice()
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when lifecycle is invalid'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(500);
            });
    });

    it('should be rejected if empty', () => {
        const jobSpec = {};

        return misc.teraslice()
            .jobs.submit(jobSpec)
            .then(() => Promise.reject(new Error('Submission should not succeed when job is empty'))) // This should throw a validation error.
            .catch((err) => {
                expect(err.error).toBe(400);
            });
    });
});
