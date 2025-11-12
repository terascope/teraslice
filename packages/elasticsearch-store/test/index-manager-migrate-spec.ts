import 'jest-extended';
import { debugLogger, times } from '@terascope/core-utils';
import { ElasticsearchTestHelpers, type Client } from '@terascope/opensearch-client';
import * as simple from './helpers/simple-index.js';
import { IndexManager, IndexConfig } from '../src/index.js';

const { makeClient, cleanupIndex, sharedEnvSchema } = ElasticsearchTestHelpers;
const { TEST_INDEX_PREFIX } = sharedEnvSchema.parse(process.env);

describe('IndexManager->migrateIndex()', () => {
    const logger = debugLogger('index-manager-migrate');

    describe('using a mapped index', () => {
        const previousConfig: IndexConfig<any> = {
            namespace: TEST_INDEX_PREFIX,
            name: 'migrate',
            data_type: simple.dataType,
            index_schema: {
                version: 1,
                strict: true,
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
            name: 'migrate',
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

            await indexManager.indexSetup(previousConfig);
            const body: any[] = [];
            times(10, (n) => {
                body.push(
                    {
                        index: { _index: previousIndex }
                    },
                    {
                        test_id: `id-${n}`,
                        test_keyword: 'hello',
                        test_object: {
                            example: 'hello',
                        },
                        test_boolean: false,
                        _created: new Date().toISOString(),
                        _updated: new Date().toISOString(),
                    }
                );
            });

            await client.bulk({
                body,
            });
            await client.indices.refresh({ index: previousIndex });
        });

        afterAll(async () => {
            await Promise.all([
                cleanupIndex(client, newIndex),
                cleanupIndex(client, previousIndex)
            ]);
        });

        it('should be able to migrate to the new index', async () => {
            // make sure it doesn't exist first
            await expect(indexManager.exists(newIndex)).resolves.toBeFalse();

            await expect(
                indexManager.migrateIndex({
                    config: newConfig,
                })
            ).resolves.toMatchObject({
                total: 10,
                failures: [],
            });

            await expect(indexManager.exists(newIndex)).resolves.toBeTrue();

            await expect(
                indexManager.migrateIndex({
                    config: newConfig,
                })
            ).resolves.toBeFalse();
        });
    });
});
