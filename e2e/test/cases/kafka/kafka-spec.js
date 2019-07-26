'use strict';

const Promise = require('bluebird');
const uuidv4 = require('uuid/v4');
const signale = require('signale');
const misc = require('../../misc');
const wait = require('../../wait');
const { resetState } = require('../../helpers');

const { waitForJobStatus, waitForIndexCount } = wait;

describe('kafka', () => {
    beforeAll(async () => {
        await resetState();
        // give kafka time to come up
        await Promise.delay(5000);
    });

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
        senderSpec.operations[0].index = specIndex;

        readerSpec.operations[0].topic = topic;
        readerSpec.operations[0].group = groupId;

        const sender = await teraslice.jobs.submit(senderSpec);

        const [reader] = await Promise.all([
            teraslice.jobs.submit(readerSpec),
            waitForJobStatus(sender, 'completed')
        ]);

        await waitForIndexCount(specIndex, total);
        await reader.stop();

        await waitForJobStatus(reader, 'stopped');

        let count = 0;
        try {
            ({ count } = await misc.indexStats(specIndex));
        } catch (err) {
            signale.error(err);
        }

        expect(count).toBe(total);
    });
});
