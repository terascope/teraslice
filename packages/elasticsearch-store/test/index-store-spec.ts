import 'jest-extended';
import es from 'elasticsearch';
import { times, pDelay, DataEntity, Omit } from '@terascope/utils';
import {
    SimpleRecord,
    SimpleRecordInput,
    simpleMapping,
    simpleRecordSchema
} from './helpers/simple-index';
import { ELASTICSEARCH_HOST } from './helpers/config';
import { IndexStore, IndexConfig } from '../src';

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

    const index = 'test__store-v1-s1';
    const config: IndexConfig = {
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
        },
        bulkMaxSize: 4,
        bulkMaxWait: 300
    };

    describe('when constructed without a data schema', () => {
        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const indexStore = new IndexStore<SimpleRecord, SimpleRecordInput>(client, config);

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
            const record: SimpleRecordInput = {
                test_id: 'hello-1234',
                test_keyword: 'hello',
                test_object: {
                    some_obj: true,
                },
                test_number: 1234,
                test_boolean: false,
                _created: new Date().toISOString(),
                _updated: new Date().toISOString(),
            };

            beforeAll(() => {
                return indexStore.create(record, record.test_id);
            });

            it('should not be able to create a record again', () => {
                return expect(indexStore.create(record, record.test_id))
                    .rejects.toThrowError('Document Already Exists');
            });

            it('should be able to index the same record', () => {
                return indexStore.indexWithId(record, record.test_id);
            });

            it('should be able to index the record without an id', async () => {
                const lonelyRecord: SimpleRecordInput = {
                    test_id: 'lonely-1234',
                    test_keyword: 'other',
                    test_object: {},
                    test_number: 1234,
                    test_boolean: false,
                };

                await indexStore.index(lonelyRecord);

                const count = await indexStore.count(`test_id: ${lonelyRecord.test_id}`);
                expect(count).toBe(1);
            });

            it('should be able to index a different record with id', async () => {
                const otherRecord: SimpleRecordInput = {
                    test_id: 'other-1234',
                    test_keyword: 'other',
                    test_object: {},
                    test_number: 1234,
                    test_boolean: false,
                };

                await indexStore.indexWithId(otherRecord, otherRecord.test_id);

                const count = await indexStore.count(`test_id: ${otherRecord.test_id}`);
                expect(count).toBe(1);
            });

            it('should be able to get the count', () => {
                return expect(indexStore.count(`test_id: ${record.test_id}`))
                    .resolves.toBe(1);
            });

            it('should get zero when the using the wrong id', () => {
                return expect(indexStore.count('test_id: wrong-id'))
                    .resolves.toBe(0);
            });

            it('should be able to update the record', async () => {
                await indexStore.update({
                    test_number: 4231
                }, record.test_id);

                const updated = await indexStore.get(record.test_id);
                expect(updated).toHaveProperty('test_number', 4231);

                await indexStore.update(record, record.test_id);
            });

            it('should throw when updating a record that does not exist', () => {
                return expect(indexStore.update({
                    test_number: 1,
                }, 'wrong-id')).rejects.toThrowError('Not Found');
            });

            it('should be able to get the record by id', async () => {
                const r = await indexStore.get(record.test_id);

                expect(DataEntity.isDataEntity(r)).toBeTrue();
                expect(r).toEqual(record);
                expect(r.getMetadata()).toMatchObject({
                    _index: index,
                    _id: record.test_id,
                    _type: 'test__store'
                });
            });

            it('should throw when getting a record that does not exist', () => {
                return expect(indexStore.get('wrong-id'))
                    .rejects.toThrowError('Not Found');
            });

            it('should be able to remove the record', () => {
                return indexStore.remove(record.test_id);
            });

            it('should throw when trying to remove a record that does not exist', () => {
                return expect(indexStore.remove('wrong-id'))
                    .rejects.toThrowError('Not Found');
            });
        });

        describe('when dealing with multiple a records', () => {
            const keyword = 'example-record';
            const records: SimpleRecordInput[] = [
                {
                    test_id: 'example-1',
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    test_number: 5555,
                    test_boolean: true,
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                },
                {
                    test_id: 'example-2',
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    test_number: 3333,
                    test_boolean: true,
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                },
                {
                    test_id: 'example-3',
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    test_number: 999,
                    test_boolean: true,
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                }
            ];

            beforeAll(async () => {
                await Promise.all(records.map((record) => {
                    return indexStore.create(record, record.test_id, {
                        refresh: false
                    });
                }));

                await indexStore.refresh();
            });

            it('should be able to mget all of the records', async () => {
                const docs = records.map((r) => ({
                    _id: r.test_id
                }));

                const result = await indexStore.mget({ docs });

                expect(DataEntity.isDataEntityArray(result)).toBeTrue();
                expect(result).toEqual(records);
            });

            it('should be able to search the records', async () => {
                const result = await indexStore.search({
                    q: `test_keyword: ${keyword}`,
                    sort: 'test_id'
                });

                expect(DataEntity.isDataEntityArray(result)).toBeTrue();
                expect(result).toEqual(records);
            });
        });

        describe('when bulk sending records', () => {
            const keyword = 'bulk-record';
            const records: SimpleRecordInput[] = times(9, (n) => ({
                test_id: `bulk-${n + 1}`,
                test_keyword: keyword,
                test_object: { bulk: true },
                test_number: (n + 10) * 2,
                test_boolean: true,
                _updated: new Date().toISOString(),
            }));

            beforeAll(async () => {
                for (const record of records) {
                    await indexStore.bulk(record);
                }

                await pDelay(500);
                await indexStore.refresh();
            });

            it('should be able to search the records', async () => {
                const result = await indexStore.search({
                    q: `test_keyword: ${keyword}`,
                    sort: 'test_id'
                });

                expect(DataEntity.isDataEntityArray(result)).toBeTrue();
                expect(result).toBeArrayOfSize(records.length);
            });
        });
    });

    describe('when constructed with data schema', () => {
        const client = new es.Client({
            host: ELASTICSEARCH_HOST,
            log: 'error'
        });

        const configWithDataSchema = Object.assign(config, {
            dataSchema: {
                version: 'v1.0.0',
                schema: simpleRecordSchema,
                allFormatters: true,
            }
        });

        const indexStore = new IndexStore<SimpleRecord, SimpleRecordInput>(client, configWithDataSchema);

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

        type InputType = 'input'|'output';
        const cases: [InputType][] = [
            ['input'],
            ['output'],
        ];

        describe.each(cases)('when relying on data schema to transform the %s', (inputType) => {
            const keyword = `data-schema-${inputType}-record`;
            const input: SimpleRecordInput[] = [
                {
                    test_id: `data-schema-${inputType}-1`,
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    _created: new Date().toISOString()
                },
                {
                    test_id: `data-schema-${inputType}-2`,
                    test_keyword: keyword,
                    test_object: {},
                    test_number: 3333,
                    _updated: new Date().toISOString()
                },
                {
                    test_id: `data-schema-${inputType}-3`,
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    test_boolean: false,
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString()
                }
            ];

            type ExpectedRecord = Omit<SimpleRecord, '_created'|'_updated'>;
            const expected: ExpectedRecord[] = input.map((record) => {
                return Object.assign({
                    test_boolean: true,
                    test_number: 676767,
                }, record);
            });

            beforeAll(async () => {
                await Promise.all(input.map((record, i) => {
                    if (inputType === 'input') {
                        if (i === 0) {
                            return indexStore.create(record, record.test_id);
                        }
                        return indexStore.indexWithId(record, record.test_id, {
                            refresh: false
                        });
                    }
                    if (inputType === 'output') {
                        return client.index({
                            index,
                            type: 'test__store',
                            id: record.test_id,
                            body: record,
                            refresh: false,
                        });
                    }
                    throw new Error('Invalid Input Type');
                }));

                await indexStore.refresh();
            });

            it('should have created all of the records', async () => {
                const result = await indexStore.search({
                    q: `test_keyword: ${keyword}`,
                    sort: 'test_id'
                });

                expect(DataEntity.isDataEntityArray(result)).toBeTrue();
                expect(result).toEqual(expected);

                const record = await indexStore.get(expected[0].test_id);

                expect(DataEntity.isDataEntity(record)).toBeTrue();
                expect(record).toEqual(expected[0]);

                const records = await indexStore.mget({
                    docs: expected.map((r) => ({
                        _id: r.test_id
                    }))
                });

                expect(DataEntity.isDataEntityArray(records)).toBeTrue();
                expect(records).toEqual(expected);
            });

            it('should be able to update a record with a proper field', async () => {
                await indexStore.update({
                    test_number: 77777
                }, expected[2].test_id);

                const record = await indexStore.get(expected[2].test_id);
                expect(record).toMatchObject({
                    test_number: 77777
                });
            });
        });
    });
});
