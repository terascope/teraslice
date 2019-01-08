import 'jest-extended';
import es from 'elasticsearch';
import simpleMapping from '../fixtures/simple-mapping.json';
import { ELASTICSEARCH_HOST } from '../helpers/config';
import { IndexStore } from '../../src';

describe('IndexStore (Simple Mapping)', () => {
    const index = 'test__simple-v1-s1';

    const client = new es.Client({
        host: ELASTICSEARCH_HOST,
        log: 'error'
    });

    const indexStore = new IndexStore(client, {
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
    });

    beforeAll(async () => {
        await client.indices.delete({
            index
        }).catch(() => {});

        await indexStore.initialize();
    });

    afterAll(async () => {
        await indexStore.shutdown();

        await client.indices.delete({
            index
        }).catch(() => {});
    });

    it('should create the versioned index', async () => {
        const exists = await client.indices.exists({
            index
        });

        expect(exists).toBeTrue();
    });
});
