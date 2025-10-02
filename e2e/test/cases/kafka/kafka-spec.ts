import { v4 as uuidv4 } from 'uuid';
import { exec } from '@terascope/scripts';
import { TerasliceHarness } from '../../teraslice-harness.js';
import signale from '../../signale.js';
import {
    CERT_PATH, ENCRYPT_KAFKA, ROOT_CERT_PATH,
    TEST_PLATFORM, KAFKA_PORT
} from '../../config.js';

describe('kafka', () => {
    let terasliceHarness: TerasliceHarness;

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
        if (TEST_PLATFORM === 'kubernetesV2') {
            senderSpec.resources_requests_cpu = 0.05;
            senderSpec.cpu_execution_controller = 0.4;
            readerSpec.resources_requests_cpu = 0.05;
            readerSpec.cpu_execution_controller = 0.4;
        }

        if (!senderSpec.operations) {
            senderSpec.operations = [];
        }

        if (!readerSpec.operations) {
            readerSpec.operations = [];
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

        await terasliceHarness.waitForIndexCount(specIndex, total, 45 * 1000);
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

    if (ENCRYPT_KAFKA === 'true') {
        describe('encrypted kafka', () => {
            it('should have an encrypted connection', async () => {
                const result = await exec({
                    cmd: 'sh',
                    args: ['-c', `printf '\\n' | openssl s_client -connect localhost:${KAFKA_PORT} -cert ${CERT_PATH}/kafka-keypair.pem -key ${CERT_PATH}/kafka-keypair.pem -CAfile ${ROOT_CERT_PATH}`]
                });
                // console.log('s_client output: ', result);
                expect(result).toContain('Verification: OK');
            });
        });
    }
});
