'use strict';

const misc = require('../../misc');
const { resetState, testJobLifeCycle, runEsJob } = require('../../helpers');

/**
 * The id reader don't work in 6.x and greater
 *
 * See:
 *  - https://github.com/terascope/teraslice/issues/68
 *  - https://github.com/terascope/elasticsearch-assets/issues/12
 */
xdescribe('id reader', () => {
    beforeAll(() => resetState());

    it('should support reindexing', async () => {
        const jobSpec = misc.newJob('id');
        const specIndex = misc.newSpecIndex('id-reader');

        jobSpec.name = 'reindex by id';
        jobSpec.operations[0].index = misc.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        const count = await runEsJob(jobSpec, specIndex);
        expect(count).toBe(1000);
    });

    it('should support reindexing by hex id', async () => {
        const jobSpec = misc.newJob('id');
        const specIndex = misc.newSpecIndex('id-reader');
        jobSpec.name = 'reindex by hex id';
        jobSpec.operations[0].key_type = 'hexadecimal';
        jobSpec.operations[0].index = misc.getExampleIndex(1000); // add hex
        jobSpec.operations[1].index = specIndex;

        const count = await runEsJob(jobSpec, specIndex);
        expect(count).toBe(1000);
    });

    it('should support reindexing by hex id + key_range', async () => {
        const jobSpec = misc.newJob('id');
        const specIndex = misc.newSpecIndex('id-reader');

        jobSpec.name = 'reindex by hex id (range=a..e)';
        jobSpec.operations[0].key_type = 'hexadecimal';
        jobSpec.operations[0].key_range = ['a', 'b', 'c', 'd', 'e'];
        jobSpec.operations[0].index = misc.getExampleIndex(1000); // add hex

        jobSpec.operations[1].index = specIndex;

        const count = await runEsJob(jobSpec, specIndex);
        expect(count).toBe(500);
    });

    it('should complete after lifecycle changes', async () => {
        const jobSpec = misc.newJob('id');
        const specIndex = misc.newSpecIndex('id_reader');
        // Job needs to be able to run long enough to cycle
        jobSpec.name = 'reindex by id (with restart)';
        jobSpec.operations[0].index = misc.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        await testJobLifeCycle(jobSpec);

        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toBe(1000);
    });
});
