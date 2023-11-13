'use strict';

const { v4: uuidv4 } = require('uuid');
const TerasliceHarness = require('../../teraslice-harness');
const signale = require('../../signale');
const { TEST_PLATFORM } = require('../../config');

describe('kafka', () => {
    let terasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should be able to read and write from kafka', async () => {
        const topic = uuidv4();
        const groupId = uuidv4();
        const total = 1000;
        const specIndex = terasliceHarness.newSpecIndex('kafka');

        const senderSpec = terasliceHarness.newJob('kafka-sender');
        const readerSpec = terasliceHarness.newJob('kafka-reader');

        // Set resource constraints on workers and ex controllers within CI
        if (TEST_PLATFORM === 'kubernetes') {
            senderSpec.resources_requests_cpu = 0.1;
            senderSpec.cpu_execution_controller = 0.2;
            readerSpec.resources_requests_cpu = 0.1;
            readerSpec.cpu_execution_controller = 0.2;
        }

        senderSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        senderSpec.operations[1].topic = topic;

        readerSpec.operations[0].topic = topic;
        readerSpec.operations[0].group = groupId;
        readerSpec.operations[1].index = specIndex;

        const sender = await terasliceHarness.teraslice.executions.submit(senderSpec);

        const [reader] = await Promise.all([
            terasliceHarness.teraslice.executions.submit(readerSpec),
            terasliceHarness.waitForExStatus(sender, 'completed')
        ]);

        await terasliceHarness.waitForIndexCount(specIndex, total);
        await reader.stop();

        await terasliceHarness.waitForExStatus(reader, 'stopped');

        let count = 0;
        try {
            ({ count } = await terasliceHarness.indexStats(specIndex));
        } catch (err) {
            signale.error(err);
        }

        expect(count).toBe(total);
    });
});
