'use strict';

const misc = require('../../misc');
const { resetState, runEsJob } = require('../../helpers');

describe('elasticsearch bulk', () => {
    beforeAll(() => resetState());

    it('should support multisend', async () => {
        const jobSpec = misc.newJob('multisend');
        jobSpec.name = 'multisend';
        jobSpec.operations[1].index = 'test-multisend-1000';

        const count = await runEsJob(jobSpec, 'test-multisend-1000');
        expect(count).toBe(1000);
    });
});
