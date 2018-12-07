'use strict';

const misc = require('../../misc');
const { resetState, testJobLifeCycle, runEsJob } = require('../../helpers');

describe('id reader', () => {
    beforeAll(() => resetState());

    it('should support reindexing', async () => {
        const jobSpec = misc.newJob('id');
        jobSpec.name = 'reindex by id';
        jobSpec.operations[1].index = 'test-id_reindex-1000';

        const count = await runEsJob(jobSpec, 'test-id_reindex-1000');
        expect(count).toBe(1000);
    });

    it('should support reindexing by hex id', async () => {
        const jobSpec = misc.newJob('id');
        jobSpec.name = 'reindex by hex id';
        jobSpec.operations[0].key_type = 'hexadecimal';
        jobSpec.operations[0].index = 'example-logs-1000-hex';
        jobSpec.operations[1].index = 'test-hexadecimal-logs';

        const count = await runEsJob(jobSpec, 'test-hexadecimal-logs');
        expect(count).toBe(1000);
    });

    it('should support reindexing by hex id + key_range', async () => {
        const jobSpec = misc.newJob('id');
        jobSpec.name = 'reindex by hex id (range=a..e)';
        jobSpec.operations[0].key_type = 'hexadecimal';
        jobSpec.operations[0].key_range = ['a', 'b', 'c', 'd', 'e'];

        jobSpec.operations[0].index = 'example-logs-1000-hex';
        jobSpec.operations[1].index = 'test-keyrange-logs';

        const count = await runEsJob(jobSpec, 'test-keyrange-logs');
        expect(count).toBe(500);
    });

    it('should complete after lifecycle changes', async () => {
        const jobSpec = misc.newJob('id');
        // Job needs to be able to run long enough to cycle
        jobSpec.name = 'reindex by id (with restart)';
        jobSpec.operations[1].index = 'test-id_reindex-lifecycle-1000';

        await testJobLifeCycle(jobSpec);
        const stats = await misc.indexStats('test-id_reindex-lifecycle-1000');
        expect(stats.count).toBe(1000);
    });
});
