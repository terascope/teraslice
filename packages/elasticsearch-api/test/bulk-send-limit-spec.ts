import { jest } from '@jest/globals';
import { debugLogger, chunk, pMap } from '@terascope/core-utils';
import { ElasticsearchTestHelpers, Client } from '@terascope/opensearch-client';
import elasticsearchAPI, { Client as APIClient } from '../src/index.js';

const {
    makeClient, cleanupIndex, waitForData,
    EvenDateData, opensearchEnvSchema, formatUploadData
} = ElasticsearchTestHelpers;
const { TEST_INDEX_PREFIX } = opensearchEnvSchema.parse(process.env);

const THREE_MINUTES = 3 * 60 * 1000;

jest.setTimeout(THREE_MINUTES + 60000);

describe('bulkSend', () => {
    let client: Client;
    let api: APIClient;

    beforeAll(async () => {
        client = await makeClient();
    });

    describe('can work with congested queues', () => {
        const logger = debugLogger('congested_test');
        const index = `${TEST_INDEX_PREFIX}_congested_queues_`;

        beforeAll(async () => {
            await cleanupIndex(client, index);
            api = elasticsearchAPI(client, logger);
        });

        afterAll(async () => {
            await cleanupIndex(client, index);
        });

        it('can get correct data even with congested queues', async () => {
            const chunkedData = chunk(EvenDateData.data, 50);

            await pMap(chunkedData, async (cData) => {
                const formattedData = formatUploadData(index, cData, true) as any;
                return api.bulkSend(formattedData);
            }, { concurrency: 9 });

            await expect(
                waitForData(client, index, EvenDateData.data.length, THREE_MINUTES)
            ).resolves.not.toThrow();
        });
    });
});
