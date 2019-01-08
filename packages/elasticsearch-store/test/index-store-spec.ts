import 'jest-extended';
import es from 'elasticsearch';
import simpleMapping from './fixtures/simple-mapping.json';
import { SimpleRecord } from './helpers/simple-index';
import { ELASTICSEARCH_HOST } from './helpers/config';
import { IndexStore } from '../src';

describe('IndexStore', () => {
    const client = new es.Client({});

    describe('when constructed with nothing', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new IndexStore();
            }).toThrowError('IndexStore requires elasticsearch client');
        });
    });

    describe('when constructed without a config', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new IndexStore(client);
            }).toThrowError('IndexStore requires a valid config');
        });
    });

    describe('when constructed', () => {
        const index = 'test__store-v1-s1';

        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const indexStore = new IndexStore<SimpleRecord>(client, {
            index: 'test__store',
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
            await client.indices.delete({
                index
            }).catch(() => {});

            await indexStore.shutdown();
        });

        it('should create the versioned index', async () => {
            const exists = await client.indices.exists({ index });

            expect(exists).toBeTrue();
        });

        it('should be able to create a record', async () => {
            const id = 'hello-1234';
            const record = {
                test_id: id,
                test_keyword: 'hello',
                test_object: {
                    some_obj: true,
                },
                test_number: 1234,
                test_boolean: false,
            };

            await indexStore.create(record, id);

            await expect(indexStore.count(`test_id: ${id}`)).resolves.toBe(1);

            await expect(indexStore.get(id)).resolves.toEqual(record);
        });
    });
});
