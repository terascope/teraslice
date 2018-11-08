'use strict';

const signale = require('signale');
const misc = require('../../misc');
const wait = require('../../wait');
const { resetState } = require('../../helpers');

const { waitForJobStatus, waitForIndexCount } = wait;

describe('Kafka Tests', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    it('should be able to read and write from kafka', async () => {
        const sender = await teraslice.jobs.submit(misc.newJob('kafka-sender'));
        const reader = await teraslice.jobs.submit(misc.newJob('kafka-reader', true));

        await waitForJobStatus(sender, 'completed');

        await reader.start();
        await waitForIndexCount('kafka-logs-10', 10);
        await reader.stop();

        await waitForJobStatus(reader, 'stopped');

        let count = 0;
        try {
            ({ count } = await misc.indexStats('kafka-logs-10'));
        } catch (err) {
            signale.error(err);
        }

        expect(count).toBe(10);
    });
});
