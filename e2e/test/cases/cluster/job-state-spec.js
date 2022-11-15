import { waitForExStatus } from '../../wait.js';
import { resetState } from '../../helpers.js';
import misc from '../../misc.js';

describe('job state', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    it('should cycle through after state changes with other jobs running', async () => {
        const jobSpec1 = misc.newJob('generator');
        const jobSpec2 = misc.newJob('generator');
        jobSpec2.operations[1].name = 'second_generator';

        const [ex1, ex2] = await Promise.all([
            teraslice.executions.submit(jobSpec1),
            teraslice.executions.submit(jobSpec2)
        ]);

        await waitForExStatus(ex1, 'running');
        await ex1.pause();
        await waitForExStatus(ex1, 'paused');
        await ex1.resume();
        await waitForExStatus(ex1, 'running');

        await Promise.all([
            ex1.stop({ blocking: true }),
            ex2.stop({ blocking: true }),
        ]);
    });
});
