'use strict';

const uuidv4 = require('uuid/v4');
const signale = require('signale');
const misc = require('../../misc');
const wait = require('../../wait');
const { resetState } = require('../../helpers');

const { waitForJobStatus, waitForIndexCount } = wait;

describe('Kafka Tests', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    it('should be able to read and write from kafka', async () => {
        const topic = uuidv4();
        const groupId = uuidv4();

        const senderSpec = misc.newJob('kafka-sender');
        const readerSpec = misc.newJob('kafka-reader');

        senderSpec.operations[1].topic = topic;

        readerSpec.operations[0].topic = topic;
        readerSpec.operations[0].group = groupId;
        const { index } = readerSpec.operations[1];

        const sender = await teraslice.jobs.submit(senderSpec);

        const [reader] = await Promise.all([
            teraslice.jobs.submit(readerSpec),
            waitForJobStatus(sender, 'completed'),
        ]);

        await waitForIndexCount(index, 10);
        await reader.stop();

        await waitForJobStatus(reader, 'stopped');

        let count = 0;
        try {
            ({ count } = await misc.indexStats(index));
        } catch (err) {
            signale.error(err);
        }

        expect(count).toBe(10);
    });
});
