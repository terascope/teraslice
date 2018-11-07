'use strict';

const signale = require('signale');
const misc = require('../../misc');
const wait = require('../../wait');
const { resetState } = require('../../helpers');

const { waitForJobStatus, waitForIndexCount } = wait;

describe('Kafka Tests', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    function startJobs(fileNames = []) {
        return Promise.all(fileNames.map(async (fileName) => {
            const jobSpec = misc.newJob(fileName);
            const job = await teraslice.jobs.submit(jobSpec);

            expect(job).toBeDefined();
            expect(job.id()).toBeDefined();

            await waitForJobStatus(job, 'running');
            return job;
        }));
    }

    it('should be able to read and write from kafka', async () => {
        const [sender, reader] = await startJobs(['kafka-sender', 'kafka-reader']);

        await waitForJobStatus(sender, 'completed');

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
