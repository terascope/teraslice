'use strict';

const {
    debugLogger,
    chunk,
    pMap
} = require('@terascope/utils');
const { ElasticsearchTestHelpers } = require('elasticsearch-store');
const elasticsearchAPI = require('../index');

const {
    makeClient, cleanupIndex, waitForData,
    EvenDateData, TEST_INDEX_PREFIX
} = ElasticsearchTestHelpers;

const THREE_MINUTES = 3 * 60 * 1000;

jest.setTimeout(THREE_MINUTES + 60000);

function formatUploadData(
    index, data, isES8ClientTest = false
) {
    const results = [];

    data.forEach((record) => {
        const meta = { _index: index };

        if (!isES8ClientTest) {
            meta._type = '_doc';
        }

        results.push({ action: { index: meta }, data: record });
    });

    return results;
}

describe('bulkSend', () => {
    let client;
    let api;
    let isElasticsearch8 = false;

    beforeAll(async () => {
        client = await makeClient();
    });

    describe('can work with congested queues', () => {
        const logger = debugLogger('congested_test');
        const index = `${TEST_INDEX_PREFIX}_congested_queues_`;

        beforeAll(async () => {
            await cleanupIndex(client, index);
            api = elasticsearchAPI(client, logger);
            isElasticsearch8 = api.isElasticsearch8();
        });

        afterAll(async () => {
            await cleanupIndex(client, index);
        });

        it('can get correct data even with congested queues', async () => {
            const chunkedData = chunk(EvenDateData.data, 50);

            await pMap(chunkedData, async (cData) => {
                const formattedData = formatUploadData(index, cData, isElasticsearch8);
                return api.bulkSend(formattedData);
            }, { concurrency: 9 });

            await waitForData(client, index, EvenDateData.data.length, logger, THREE_MINUTES);
        });
    });
});
