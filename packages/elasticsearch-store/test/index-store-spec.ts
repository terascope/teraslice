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

        describe('when dealing with a record', () => {
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

            it('should be able to create a record', () => {
                return indexStore.create(record, id);
            });

            it('should be able to get the count', () => {
                return expect(indexStore.count(`test_id: ${id}`))
                    .resolves.toBe(1);
            });

            it('should get zero when the using the wrong id', () => {
                return expect(indexStore.count('test_id: wrong-id'))
                    .resolves.toBe(0);
            });

            it('should be able to update the record', async () => {
                await indexStore.update({
                    test_number: 4231
                }, id);

                const updated = await indexStore.get(id);
                expect(updated).toHaveProperty('test_number', 4231);

                await indexStore.update(record, id);
            });

            it('should throw when updating a record that does not exist', () => {
                return expect(indexStore.update({
                    test_number: 1,
                }, 'wrong-id')).rejects.toThrowError('Not Found');
            });

            it('should be able to get the record by id', () => {
                return expect(indexStore.get(id))
                    .resolves.toEqual(record);
            });

            it('should throw when getting a record that does not exist', () => {
                return expect(indexStore.get('wrong-id'))
                    .rejects.toThrowError('Not Found');
            });

            it('should be able to remove the record', () => {
                return indexStore.remove(id);
            });

            it('should throw when trying to remove a record that does not exist', () => {
                return expect(indexStore.remove('wrong-id'))
                    .rejects.toThrowError('Not Found');
            });
        });
    });
});
