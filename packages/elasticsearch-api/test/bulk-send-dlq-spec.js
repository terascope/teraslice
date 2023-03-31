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

const THREE_MINUTES = 3 * 60 * 1000;

jest.setTimeout(THREE_MINUTES + 60000);

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

        it('should send records if no issues and dlq not set', async () => {
            const diffApi = elasticsearchAPI(client, logger);

            const docs = cloneDeep(EvenDateData.data.slice(0, 2));

            const result = await diffApi.bulkSend(formatUploadData(index, docs, isElasticsearch8));

            expect(result).toBe(2);
        });

        it('should throw an error if dlq is not set', async () => {
            const diffApi = elasticsearchAPI(client, logger);

            const docs = cloneDeep(EvenDateData.data.slice(0, 2));

            docs[0].bytes = 'this is a bad value';

            await expect(diffApi.bulkSend(formatUploadData(index, docs, isElasticsearch8)))
                .rejects.toThrow();
        });

        it('should update metadata for records that are not retryable and return results for successful updates if dlq is set', async () => {
            const docs = cloneDeep(EvenDateData.data.slice(0, 2))
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            docs[0].bytes = 'this is a bad value';

            const result = await api.bulkSend(formatUploadData(index, docs, isElasticsearch8));

            // 1 good doc  - so only 1 row affected
            expect(result).toBe(1);

            expect(docs[0].getMetadata('_bulk_sender_rejection')).toInclude('mapper_parsing_exception--failed to parse field [bytes]');
            expect(docs[1].getMetadata('_bulk_sender_rejection')).toBeUndefined();
        });

        it('should return a count if not un-retryable records if dlq is set', async () => {
            const docs = cloneDeep(EvenDateData.data.slice(0, 2));

            const result = await api.bulkSend(formatUploadData(index, docs, isElasticsearch8));

            expect(result).toBe(2);
        });
    });
});
