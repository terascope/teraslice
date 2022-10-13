import misc from '../../misc';
import { resetState, runEsJob } from '../../helpers';

describe('elasticsearch bulk', () => {
    beforeAll(() => resetState());

    it('should support multisend', async () => {
        const jobSpec = misc.newJob('multisend');
        const specIndex = misc.newSpecIndex('elasticsearch-bulk');
        jobSpec.name = 'multisend';
        jobSpec.operations[0].index = misc.getExampleIndex(1000);
        jobSpec.operations[1].index = specIndex;

        const count = await runEsJob(jobSpec, specIndex);
        expect(count).toBe(1000);
    });
});
