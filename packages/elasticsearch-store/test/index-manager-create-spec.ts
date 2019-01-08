import 'jest-extended';
import es from 'elasticsearch';
import simpleMapping from './fixtures/simple-mapping.json';
import { ELASTICSEARCH_HOST } from './helpers/config';
import { IndexManager } from '../src';

describe('IndexManager->create()', () => {
    describe('using a mapped index', () => {
        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const config = {
            index: 'test__simple',
            indexType: 'events',
            indexSchema: {
                version: 'v1.0.0',
                mapping: simpleMapping,
                strict: true,
            },
            version: 'v1.0.0',
            indexSettings: {
                'index.number_of_shards': 1,
                'index.number_of_replicas': 1
            }
        };

        const index = `${config.index}-v1-s1`;

        const indexManager = new IndexManager(client);
        let result = false;

        beforeAll(async () => {
            await client.indices.delete({ index })
                    .catch(() => {});

            result = await indexManager.create(config);
        });

        afterAll(async () => {
            await client.indices.delete({ index })
                    .catch(() => {});

            client.close();
        });

        it('should create the versioned index', async () => {
            const exists = await client.indices.exists({
                index
            });

            expect(exists).toBeTrue();
            expect(result).toBeTrue();
        });

        it('should be able to call create again', async () => {
            const created = await indexManager.create(config);
            expect(created).toBeFalse();
        });
    });
});
