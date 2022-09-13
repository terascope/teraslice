'use strict';

const { debugLogger, chunk, pMap } = require('@terascope/utils');
const { ElasticsearchTestHelpers } = require('elasticsearch-store');
const elasticsearchAPI = require('../index');
const { TEST_INDEX_PREFIX } = require('./helpers/config');

const {
    makeClient, cleanupIndex, waitForData,
    formatUploadData, EvenDate
} = ElasticsearchTestHelpers;

const THREE_MINUTES = 3 * 60 * 1000;

jest.setTimeout(THREE_MINUTES + 30000);

describe('bulkSend can work with congested queues', () => {
    const logger = debugLogger('congested_test');
    const index = `${TEST_INDEX_PREFIX}_congested_queues_`;

    let client;
    let api;

    beforeAll(async () => {
        client = await makeClient();
        await cleanupIndex(client, index);
        api = elasticsearchAPI(client, logger);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('can get correct data even with congested queues', async () => {
        const chunkedData = chunk(EvenDate.data, 50);

        await pMap(chunkedData, async (cData) => {
            const formattedData = formatUploadData(index, cData);
            return api.bulkSend(formattedData);
        }, { concurrency: 9 });

        await waitForData(client, index, EvenDate.data.length, logger, THREE_MINUTES);
    });
});
