'use strict';

const { debugLogger, chunk } = require('@terascope/utils');
const elasticsearchAPI = require('../index');
const { data } = require('./helpers/data');
const { TEST_INDEX_PREFIX } = require('./helpers/config');
const {
    makeClient, constrictQueue, cleanupIndex,
    waitForData, formatUploadData
} = require('./helpers/elasticsearch');

describe('bulkSend can work with congested queues', () => {
    const logger = debugLogger('congested_test');
    const index = `${TEST_INDEX_PREFIX}_congested_queues_`;
    const THREE_MINUTES = 3 * 60 * 1000;

    let client;
    let api;

    beforeAll(async () => {
        client = await makeClient();
        await cleanupIndex(client, index);
        await constrictQueue(client);
        api = elasticsearchAPI(client, logger);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('can get correct data even with congested queues', async () => {
        const chunkedData = chunk(data, 50);

        for (const cData of chunkedData) {
            const formattedData = formatUploadData(index, cData);
            await api.bulkSend(formattedData);
        }

        await waitForData(client, index, data.length, THREE_MINUTES);
    });
});
