import 'jest-extended';
import es from 'elasticsearch';
import {
    times,
    pDelay,
    DataEntity,
    Omit,
    TSError,
    debugLogger
} from '@terascope/utils';
import {
    SimpleRecord,
    SimpleRecordInput,
    mapping,
    schema
} from './helpers/simple-index';
import { ELASTICSEARCH_HOST } from './helpers/config';
import { IndexStore, IndexConfig } from '../src';

describe('IndexStore', () => {
    const client = new es.Client({});
    const logger = debugLogger('index-store-spec');

    describe('when constructed with nothing', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new IndexStore();
            }).toThrowWithMessage(TSError, 'IndexStore requires elasticsearch client');
        });
    });

    describe('when constructed without a config', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new IndexStore(client);
            }).toThrowError();
        });
    });

    const index = 'test__store-v1-s1';
    const config: IndexConfig = {
        name: 'test__store',
        indexSchema: {
            version: 1,
            mapping,
            strict: true,
        },
        version: 1,
        indexSettings: {
            'index.number_of_shards': 4,
            'index.number_of_replicas': 1
        },
        logger,
        bulkMaxSize: 50,
        bulkMaxWait: 300,
        ingestTimeField: '_created',
        eventTimeField: '_updated',
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

            // it should be able to call shutdown twice
            await indexStore.shutdown();
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

            it('should not be able to create a record again', async () => {
                expect.hasAssertions();

                try {
                    await indexStore.create(record, record.test_id);
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.message).toInclude('Document Already Exists');
                    expect(err.statusCode).toEqual(409);
                }
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

            it('should throw when updating a record that does not exist', async () => {
                expect.hasAssertions();

                try {
                    await indexStore.update({
                        test_number: 1,
                    }, 'wrong-id');
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.message).toInclude('Not Found');
                    expect(err.statusCode).toEqual(404);
                }
            });

            it('should be able to get the record by id', async () => {
                const r = await indexStore.get(record.test_id);

                expect(DataEntity.isDataEntity(r)).toBeTrue();
                expect(r).toEqual(record);

                const metadata = r.getMetadata();
                expect(metadata).toMatchObject({
                    _index: index,
                    _key: record.test_id,
                    _type: 'test__store'
                });

                expect(metadata._processTime).toBeNumber();

                const ingestTime = record._created ? new Date(record._created).getTime() : null;
                expect(metadata).toHaveProperty('_ingestTime', ingestTime);

                const eventTime = record._updated ? new Date(record._updated).getTime() : null;
                expect(metadata).toHaveProperty('_eventTime', eventTime);
            });

            it('should throw when getting a record that does not exist', async () => {
                expect.hasAssertions();

                try {
                    await indexStore.get('wrong-id');
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.message).toInclude('Not Found');
                    expect(err.statusCode).toEqual(404);
                }
            });

            it('should be able to remove the record', () => {
                return indexStore.remove(record.test_id);
            });

            it('should throw when trying to remove a record that does not exist', async () => {
                expect.hasAssertions();

                try {
                    await indexStore.remove('wrong-id');
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.message).toInclude('Not Found');
                    expect(err.statusCode).toEqual(404);
                }
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

            const records: SimpleRecordInput[] = times(100, (n) => ({
                test_id: `bulk-${n + 1}`,
                test_keyword: keyword,
                test_object: { bulk: true },
                test_number: (n + 10) * 2,
                test_boolean: true,
                _updated: new Date().toISOString(),
            }));

            beforeAll(async () => {
                let useIndex = false;
                for (const record of records) {
                    if (useIndex) {
                        await indexStore.bulk('index', record, record.test_id);
                    } else {
                        await indexStore.bulk('create', record, record.test_id);
                    }
                    useIndex = !useIndex;
                }

                await pDelay(500);
                await indexStore.refresh();
            });

            afterAll(async () => {
                for (const record of records.slice(0, 10)) {
                    await indexStore.bulk('update', {
                        test_object: {
                            updateAfterShutdown: true,
                        },
                    }, record.test_id);
                }
            });

            it('should be able to search the records', async () => {
                const result = await indexStore.search({
                    q: `test_keyword: ${keyword}`,
                    sort: 'test_number',
                    size: records.length + 1
                });

                expect(DataEntity.isDataEntityArray(result)).toBeTrue();
                expect(result).toBeArrayOfSize(records.length);
            });

            it('should be able to bulk update the records', async () => {
                for (const record of records) {
                    await indexStore.bulk('index', Object.assign(record, {
                        test_object: {
                            updated: true
                        }
                    }), record.test_id);
                }

                await indexStore.flush(true);
                await indexStore.refresh();

                const result = await indexStore.search({
                    q: `test_keyword: ${keyword}`,
                    sort: 'test_id',
                    size: records.length + 1
                });

                expect(result[0]).toHaveProperty('test_object', {
                    updated: true
                });
            });

            it('should be able to bulk delete the records', async () => {
                for (const record of records) {
                    await indexStore.bulk('delete', record.test_id);
                }

                await indexStore.flush(true);

                await indexStore.refresh();

                const result = await indexStore.search({
                    q: `test_keyword: ${keyword}`,
                    sort: 'test_id',
                    size: records.length + 1
                });

                expect(result).toBeArrayOfSize(0);
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
                version: 1,
                schema,
                allFormatters: true,
                strict: true,
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

        it('should fail when given an invalid record', async () => {
            expect.hasAssertions();

            const record = {
                test_id: 'invalid-record-id',
                test_boolean: Buffer.from('wrong'),
                test_number: '123',
                _created: 'wrong-date'
            };

            try {
                // @ts-ignore
                await indexStore.indexWithId(record, record.test_id);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toMatch(/(test_keyword|_created)/);
                expect(err.statusCode).toEqual(422);
            }
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
