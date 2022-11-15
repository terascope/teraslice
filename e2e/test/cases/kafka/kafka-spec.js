import { v4 as uuidv4 } from 'uuid';
import misc from '../../misc.js';
import wait from '../../wait.js';
import signale from '../../signale.js';
import { resetState } from '../../helpers.js';

const { waitForExStatus, waitForIndexCount } = wait;

describe('kafka', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    it('should be able to read and write from kafka', async () => {
        const topic = uuidv4();
        const groupId = uuidv4();
        const total = 1000;
        const specIndex = misc.newSpecIndex('kafka');

        const senderSpec = misc.newJob('kafka-sender');
        const readerSpec = misc.newJob('kafka-reader');

        senderSpec.operations[0].index = misc.getExampleIndex(1000);
        senderSpec.operations[1].topic = topic;

        readerSpec.operations[0].topic = topic;
        readerSpec.operations[0].group = groupId;
        readerSpec.operations[1].index = specIndex;

        const sender = await teraslice.executions.submit(senderSpec);

        const [reader] = await Promise.all([
            teraslice.executions.submit(readerSpec),
            waitForExStatus(sender, 'completed')
        ]);

        await waitForIndexCount(specIndex, total);
        await reader.stop();

        await waitForExStatus(reader, 'stopped');

        let count = 0;
        try {
            ({ count } = await misc.indexStats(specIndex));
        } catch (err) {
            signale.error(err);
        }

        expect(count).toBe(total);
    });
});
