'use strict';

const {
    debugLogger,
    cloneDeep,
    DataEntity
} = require('@terascope/utils');
const { ElasticsearchTestHelpers } = require('elasticsearch-store');
const elasticsearchAPI = require('../index');

const {
    makeClient, cleanupIndex,
    EvenDateData, TEST_INDEX_PREFIX,
    createMappingFromDatatype
} = ElasticsearchTestHelpers;

jest.setTimeout(10000);

function formatUploadData(
    index, data, isES8ClientTest = false
) {
    const results = [];

    data.forEach((record, i) => {
        const meta = { _index: index, _id: i + 1 };

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

    describe('can return non-retryable records', () => {
        const logger = debugLogger('congested_test');
        const index = `${TEST_INDEX_PREFIX}_non-retryable-records`;

        beforeAll(async () => {
            await cleanupIndex(client, index);
            api = elasticsearchAPI(client, logger, { _dead_letter_action: 'kafka_dead_letter' });
            isElasticsearch8 = api.isElasticsearch8();

            const overrides = {
                settings: {
                    'index.number_of_shards': 1,
                    'index.number_of_replicas': 0,
                },
            };

            const mapping = await createMappingFromDatatype(
                client, EvenDateData.EvenDataType, '_doc', overrides
            );

            mapping.index = index;

            await client.indices.create(mapping);
        });

        afterAll(async () => {
            await cleanupIndex(client, index);
        });

        it('returns records that cannot be tried again if dlq config is set', async () => {
            const docs = cloneDeep(EvenDateData.data.slice(0, 2));

            docs[0].bytes = 'this is a bad value';

            const result = await api.bulkSend(formatUploadData(index, docs, isElasticsearch8));

            expect(result.recordCount).toBe(1);

            expect(result.deadLetter[0].doc).toEqual(DataEntity.make({
                ip: '120.67.248.156',
                userAgent: 'Mozilla/5.0 (Windows; U; Windows NT 6.1) AppleWebKit/533.1.2 (KHTML, like Gecko) Chrome/35.0.894.0 Safari/533.1.2',
                url: 'http://lucious.biz',
                uuid: 'b23a8550-0081-453f-9e80-93a90782a5bd',
                created: '2019-04-26T15:00:23.225+00:00',
                ipv6: '9e79:7798:585a:b847:f1c4:81eb:0c3d:7eb8',
                location: '50.15003, -94.89355',
                bytes: 'this is a bad value'
            }));

            expect(result.deadLetter[0].reason).toBeDefined();
        });

        it('should return a count if not un-retryable records', async () => {
            const docs = cloneDeep(EvenDateData.data.slice(0, 2));

            const result = await api.bulkSend(formatUploadData(index, docs, isElasticsearch8));

            expect(result).toEqual({ recordCount: 2 });
        });
    });
});
