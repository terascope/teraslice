import 'jest-extended';
import { debugLogger, times } from '@terascope/utils';
import * as simple from './helpers/simple-index';
import { IndexManager, IndexConfig, isElasticsearch6 } from '../src';
import { makeClient, cleanupIndex } from './helpers/elasticsearch';
import { TEST_INDEX_PREFIX } from './helpers/config';

describe('IndexManager->migrateIndex()', () => {
    const logger = debugLogger('index-manager-migrate');

    describe('using a mapped index', () => {
        const client = makeClient();

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

        const indexManager = new IndexManager(client);
        const newIndex = indexManager.formatIndexName(newConfig);
        const previousIndex = indexManager.formatIndexName(previousConfig);

        beforeAll(async () => {
            await Promise.all([
                cleanupIndex(client, newIndex),
                cleanupIndex(client, previousIndex)
            ]);

            await indexManager.indexSetup(previousConfig);
            const body: any[] = [];
            times(10, (n) => {
                body.push(
                    {
                        index: !isElasticsearch6(client) ? {
                            _index: previousIndex,
                        } : {
                            _index: previousIndex,
                            _type: previousConfig.name,
                        },
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
            client.close();
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
