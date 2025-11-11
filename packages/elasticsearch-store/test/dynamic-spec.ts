import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { ElasticsearchTestHelpers, type Client } from '@terascope/opensearch-client';
import * as simple from './helpers/simple-index.js';
import { IndexManager, IndexConfig } from '../src/index.js';

const { makeClient, cleanupIndex, TEST_INDEX_PREFIX } = ElasticsearchTestHelpers;

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('DELETE-ME - just testing dynamic property', () => {
    const logger = debugLogger('index-manager-migrate');

    describe('dynamic property', () => {
        const previousConfig: IndexConfig<any> = {
            namespace: TEST_INDEX_PREFIX,
            name: 'dynamic',
            data_type: simple.dataType,
            index_schema: {
                version: 1,
                strict: true,
                template: true
            },
            version: 1,
            index_settings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 0,
            },
            logger,
        };

        const newConfig: IndexConfig<any> = {
            namespace: TEST_INDEX_PREFIX,
            name: 'dynamic',
            data_type: simple.dataType,
            index_schema: {
                version: 2,
                strict: true,
            },
            version: 1,
            index_settings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 0,
            },
            logger,
        };

        let client: Client;
        let indexManager: IndexManager;
        let newIndex: string;
        let previousIndex: string;

        beforeAll(async () => {
            client = await makeClient();

            indexManager = new IndexManager(client);
            newIndex = indexManager.formatIndexName(newConfig);
            previousIndex = indexManager.formatIndexName(previousConfig);

            await Promise.all([
                cleanupIndex(client, newIndex),
                cleanupIndex(client, previousIndex)
            ]);

            // index setup sets to false
            await indexManager.indexSetup(previousConfig);
            const tName = indexManager.formatTemplateName(previousConfig);

            // is false
            const temp = await indexManager.client.indices.getTemplate({ name: tName });
            console.log('===temp1', temp);

            // MANUALLY SET dynamic:true or nothing - it comes up false again at temp5
            await indexManager.client.indices.putTemplate({
                name: tName,
                body: {
                    settings: {
                        'index.number_of_shards': 1,
                        'index.number_of_replicas': 0
                    },
                    mappings: {
                        dynamic: true,
                        properties: {
                            _created: {
                                type: 'keyword'
                            },
                            _updated: {
                                type: 'keyword'
                            },
                            test_boolean: {
                                type: 'boolean'
                            },
                            test_id: {
                                type: 'keyword'
                            },
                            test_keyword: {
                                type: 'keyword'
                            },
                            test_number: {
                                type: 'integer'
                            },
                            test_object: {
                                type: 'object',
                                properties: {
                                    example: {
                                        type: 'keyword'
                                    }
                                }
                            }
                        }
                    },
                    index_patterns: [
                        'ts_test_-dynamic-v1-s1'
                    ],
                    // @ts-expect-error
                    version: 1
                },
            });

            // is true
            const temp2 = await indexManager.client.indices.getTemplate({ name: tName });
            console.log('===temp2', temp2); // still true

            await indexManager.indexSetup(previousConfig);

            // is true
            const temp3 = await indexManager.client.indices.getTemplate({ name: tName });
            console.log('===temp3', temp3);

            await indexManager.migrateIndex({ config: newConfig });

            // is true
            const temp4 = await indexManager.client.indices.getTemplate({ name: tName });
            console.log('===temp4', temp4);

            await indexManager.indexSetup({
                ...previousConfig,
                data_type: simple.dataTypeV2
            });

            // is false
            const temp5 = await indexManager.client.indices.getTemplate({ name: tName });
            console.log('===temp4', temp5);
        });

        afterAll(async () => {
            await Promise.all([
                cleanupIndex(client, newIndex),
                cleanupIndex(client, previousIndex)
            ]);
        });

        it('FOO', async () => {
            // make sure it doesn't exist first
            expect(true).toBeTrue();
        });
    });
});
