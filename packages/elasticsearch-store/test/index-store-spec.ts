import 'jest-extended';
import {
    times, pDelay, TSError,
    debugLogger, get, DataEntity
} from '@terascope/core-utils';
import { Translator } from 'xlucene-translator';
import { ElasticsearchDistribution, Omit } from '@terascope/types';
import { type Client, ElasticsearchTestHelpers } from '@terascope/opensearch-client';
import {
    SimpleRecord, SimpleRecordInput, dataType, schema
} from './helpers/simple-index.js';
import {
    IndexStore, IndexConfig, OnBulkConflictFn, UpsertWithScript
} from '../src/index.js';
import { cleanupIndexStore } from './helpers/utils.js';

const { makeClient, sharedEnvSchema } = ElasticsearchTestHelpers;
const { TEST_INDEX_PREFIX } = sharedEnvSchema.parse(process.env);

describe('IndexStore', () => {
    const logger = debugLogger('index-store-spec');

    let client: Client;

    beforeAll(async () => {
        client = await makeClient();
    });

    describe('when constructed with nothing', () => {
        it('should throw an error', () => {
            expect(() => {
                new IndexStore(undefined as any, undefined as any);
            }).toThrowWithMessage(TSError, 'IndexStore requires elasticsearch client');
        });
    });

    describe('when constructed without a config', () => {
        it('should throw an error', () => {
            expect(() => {
                new IndexStore(client as any, undefined as any);
            }).toThrow();
        });
    });

    const index = `${TEST_INDEX_PREFIX}store-v1-s1`;
    const config: IndexConfig<SimpleRecord> = {
        name: `${TEST_INDEX_PREFIX}store`,
        data_type: dataType,
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
        bulk_max_size: 50,
        bulk_max_wait: 300,
        id_field: 'test_id',
        ingest_time_field: '_created',
        event_time_field: '_updated',
    };

    describe('when constructed without a data schema', () => {
        let indexStore: IndexStore<SimpleRecord>;

        beforeAll(async () => {
            indexStore = new IndexStore<SimpleRecord>(client, config);
            await cleanupIndexStore(indexStore);
            await indexStore.initialize();
        });

        afterAll(async () => {
            await indexStore.flush(true).catch((err: any) => {
                // this should probably throw
                // but it is not a deal breaker
                console.error(err);
            });

            // it should be able to call shutdown twice
            await indexStore.shutdown();
            await indexStore.shutdown();
            await cleanupIndexStore(indexStore);
        });

        it('should create the versioned index', async () => {
            const response = await client.indices.exists({ index });
            const exists = get(response, 'body', response);

            expect(exists).toBeTrue();
        });

        describe('when dealing with a record', () => {
            const record: SimpleRecordInput = {
                test_id: 'hello-1234',
                test_keyword: 'hello',
                test_object: {
                    example: 'some-object',
                },
                test_number: 1234,
                test_boolean: false,
                _created: new Date().toISOString(),
                _updated: new Date().toISOString(),
            };

            beforeAll(() => indexStore.createById(record.test_id, record));

            it('should not be able to create a record again', async () => {
                expect.hasAssertions();

                try {
                    await indexStore.createById(record.test_id, record);
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(409);
                }
            });

            it('should be able to index the same record', async () => {
                const result = await indexStore.indexById(record.test_id, record);
                expect(result).toBeDefined();
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

                await indexStore.indexById(otherRecord.test_id, otherRecord);

                const count = await indexStore.count(`test_id: ${otherRecord.test_id}`);
                expect(count).toBe(1);
            });

            it('can use count with variables', async () => {
                const testRecord: SimpleRecordInput = {
                    test_id: 'hello',
                    test_keyword: 'world',
                    test_object: {},
                    test_number: 5678,
                    test_boolean: true,
                };

                const variables = {
                    id: 'hello'
                };

                await indexStore.indexById(testRecord.test_id, testRecord);

                const count = await indexStore.count('test_id: $id', { variables });
                expect(count).toBe(1);
            });

            it('can use countBy with variables', async () => {
                const testRecord: SimpleRecordInput = {
                    test_id: 'goodbye',
                    test_keyword: 'jimmy',
                    test_object: {},
                    test_number: 1111,
                    test_boolean: false,
                };

                const variables = {
                    id: 'goodbye'
                };

                await indexStore.indexById(testRecord.test_id, testRecord);

                const count = await indexStore.countBy({ test_id: '$id' }, 'OR', { variables });
                expect(count).toBe(1);
            });

            it('can use search with variables', async () => {
                const testRecord: SimpleRecordInput = {
                    test_id: 'iamtest',
                    test_keyword: 'aloha',
                    test_object: {},
                    test_number: 111111111,
                    test_boolean: true,
                };

                const variables = {
                    word: 'aloha'
                };

                await indexStore.indexById(testRecord.test_id, testRecord);

                const { results } = await indexStore.search('test_keyword:$word', { variables });
                expect(results).toEqual([testRecord]);
            });

            it('can use findBy with variables', async () => {
                const testRecord: SimpleRecordInput = {
                    test_id: 'iamfindby',
                    test_keyword: 'iamfindby',
                    test_object: {},
                    test_number: 1,
                    test_boolean: false,
                };

                const variables = {
                    word: 'iamfindby'
                };

                await indexStore.indexById(testRecord.test_id, testRecord);

                const results = await indexStore.findBy({ test_keyword: '$word' }, 'OR', { variables });
                expect(results).toEqual(testRecord);
            });

            it('should be able to get the count', () => expect(indexStore.count(`test_id: ${record.test_id}`)).resolves.toBe(1));

            it('should get zero when the using the wrong id', () => expect(indexStore.count('test_id: wrong-id')).resolves.toBe(0));

            it('should be able to update the record', async () => {
                await indexStore.update(
                    record.test_id,
                    {
                        doc: {
                            test_number: 4231,
                        },
                    },
                );

                const updated = await indexStore.get(record.test_id);
                expect(updated).toHaveProperty('test_number', 4231);

                await indexStore.update(record.test_id, { doc: record });
            });

            it('should throw when updating a record that does not exist', async () => {
                expect.hasAssertions();

                try {
                    await indexStore.update(
                        'wrong-id',
                        {
                            doc: {
                                test_number: 1,
                            },
                        },
                    );
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(404);
                }
            });

            it('should be able to get the record by id', async () => {
                const r: DataEntity<SimpleRecord> = (await indexStore.get(record.test_id)) as any;

                expect(DataEntity.isDataEntity(r)).toBeTrue();
                expect(r).toEqual(record);

                const metadata = r.getMetadata();

                expect(metadata).toMatchObject({
                    _index: index,
                    _key: record.test_id,
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
                    expect(err.statusCode).toEqual(404);
                }
            });

            it('should be able to remove the record', async () => {
                await expect(indexStore.deleteById(record.test_id)).resolves.not.toThrow();
            });

            it('should throw when trying to remove a record that does not exist', async () => {
                expect.hasAssertions();

                try {
                    await indexStore.deleteById('wrong-id');
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
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
                },
            ];

            beforeAll(async () => {
                await Promise.all(
                    records.map((record) => indexStore.createById(record.test_id, record, {
                        refresh: false,
                    }))
                );

                await indexStore.refresh();
            });

            it('should be able to mget all of the records', async () => {
                const docs = records.map((r) => ({
                    _id: r.test_id,
                }));

                const result = await indexStore.mget({ docs });

                expect(DataEntity.isDataEntityArray(result)).toBeTrue();
                expect(result).toEqual(records);
            });

            it('should be able to search the records', async () => {
                const {
                    results,
                } = await indexStore.search(`test_keyword: ${keyword}`, {
                    sort: 'test_id',
                });

                expect(DataEntity.isDataEntityArray(results)).toBeTrue();
                expect(results).toEqual(records);
            });

            it('should be able to search the records and get the total', async () => {
                const {
                    results
                } = await indexStore.search(`test_keyword: ${keyword}`, {
                    sort: 'test_id',
                });

                expect(results).toEqual(records);
            });
        });

        describe('when bulk sending records', () => {
            const keyword = 'bulk-record';

            const records: SimpleRecordInput[] = times(100, (n) => ({
                test_id: `bulk-${n + 1}`,
                test_keyword: keyword,
                test_object: { example: 'bulk' },
                test_number: (n + 10) * 2,
                test_boolean: n % 2 === 0,
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
                    await indexStore.bulk(
                        'update',
                        {
                            test_object: {
                                example: 'updateAfterShutdown'
                            },
                        },
                        record.test_id
                    );
                }
            });

            // eslint-disable-next-line
            xit('compare xlucene query', async () => {
                const q = '_exists_:test_number OR test_number:<0 OR test_number:100000 NOT test_keyword:other-keyword';
                const realResult = await indexStore.searchRequest({
                    q,
                    _source_includes: ['test_id', 'test_boolean'],
                    sort: 'test_number:asc',
                    size: 200,
                });
                const {
                    results: xluceneResult
                } = await indexStore.search(q, {
                    size: 200,
                    includes: ['test_id', 'test_boolean'],
                    sort: 'test_number:asc',
                });

                await indexStore.searchRequest({
                    body: {
                        query: {
                            constant_score: {
                                filter: {
                                    bool: {
                                        filter: [
                                            {
                                                exists: {
                                                    field: 'test_number',
                                                },
                                            },
                                        ],
                                        must_not: [
                                            {
                                                term: {
                                                    test_keyword: 'other-keyword',
                                                },
                                            },
                                        ],
                                        should: [
                                            {
                                                range: {
                                                    test_number: {
                                                        gte: 10,
                                                    },
                                                },
                                            },
                                            {
                                                term: {
                                                    test_boolean: false,
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    _source_includes: ['test_id', 'test_boolean'],
                    sort: 'test_number:asc',
                    foo: 'bar',
                    size: 200,
                });

                const translated = new Translator(q, {
                    type_config: indexStore.xLuceneTypeConfig
                }).toElasticsearchDSL();

                // eslint-disable-next-line no-console
                console.log(JSON.stringify({ q, translated }, null, 4));

                // expect(realResult).toEqual(modifiedResult);
                expect(xluceneResult).toEqual(realResult);

                // eslint-disable-next-line no-console
                console.dir(xluceneResult);
            });

            // eslint-disable-next-line
            xit('test lucene query', async () => {
                const result = await indexStore.searchRequest({
                    q: '*rec?rd',
                    size: 200,
                    _source_includes: ['test_id', 'test_number'],
                    sort: 'test_number:asc',
                });
                // expect(result).toBeArrayOfSize(0);

                // eslint-disable-next-line no-console
                console.dir(result);
            });

            it('should be able to search the records', async () => {
                const {
                    results
                } = await indexStore.search(`test_keyword: ${keyword}`, {
                    sort: 'test_number',
                    size: records.length + 1,
                });

                expect(results).toBeArrayOfSize(records.length);
                expect(DataEntity.isDataEntityArray(results)).toBeTrue();
            });

            it('should be able use exists and range xlucene syntax', async () => {
                const {
                    results
                } = await indexStore.search('_exists_:test_number AND test_number: <100', {
                    sort: 'test_number',
                    size: 5,
                });

                expect(results).toBeArrayOfSize(5);
                expect(DataEntity.isDataEntityArray(results)).toBeTrue();
            });

            it('should be able use multi-term xlucene syntax', async () => {
                const query = 'test_id:/bulk-.*/ AND test_number:(20 OR 22 OR 26)';
                const {
                    results
                } = await indexStore.search(query, {
                    sort: 'test_number',
                });

                expect(results).toBeArrayOfSize(3);
                expect(DataEntity.isDataEntityArray(results)).toBeTrue();
            });

            it('should be able to bulk update the records', async () => {
                for (const record of records) {
                    await indexStore.bulk(
                        'update',
                        {
                            test_object: {
                                example: 'updated',
                            },
                        },
                        record.test_id
                    );
                }

                await indexStore.flush(true);
                await indexStore.refresh();

                const {
                    results
                } = await indexStore.search(`test_keyword: ${keyword}`, {
                    sort: 'test_id',
                    size: records.length + 1,
                });

                expect(results[0]).toHaveProperty('test_object', {
                    example: 'updated',
                });
            });

            it('should be able to bulk upsert the records', async () => {
                const onConflict: OnBulkConflictFn<SimpleRecord> = (existingItem) => {
                    const { params } = (existingItem.data as UpsertWithScript<SimpleRecord>).script;
                    if (typeof params.inc !== 'number') {
                        throw new Error(`Expected params.inc to a number got ${typeof params.inc}`);
                    }
                    params.inc += 1;
                    return existingItem;
                };

                for (const record of records) {
                    for (let i = 0; i < 10; i++) {
                        await indexStore.bulk(
                            'upsert-with-script',
                            {
                                script: {
                                    source: 'ctx._source["test_object"]["example"] = params.value;ctx._source["test_number"] += params.inc',
                                    lang: 'painless',
                                    params: {
                                        value: 'updated-with-script',
                                        inc: 1
                                    }
                                },
                                upsert: {
                                    test_boolean: true
                                }
                            },
                            record.test_id,
                            3,
                            onConflict
                        );
                    }
                }

                await indexStore.flush(true);
                await indexStore.refresh();

                const {
                    results
                } = await indexStore.search(`test_keyword: ${keyword}`, {
                    sort: 'test_id',
                    size: records.length + 1,
                });

                expect(results[0]).toHaveProperty('test_object', {
                    example: 'updated-with-script',
                });
                expect(results[0]).toHaveProperty('test_number', 30);
            });

            it('should be able to bulk delete the records', async () => {
                try {
                    for (const record of records) {
                        await indexStore.bulk('delete', record.test_id);
                    }

                    await indexStore.flush(true);

                    await indexStore.refresh();

                    const {
                        results
                    } = await indexStore.search(`test_keyword: ${keyword}`, {
                        sort: 'test_id',
                        size: records.length + 1,
                    });

                    expect(results).toBeArrayOfSize(0);
                } finally {
                    // make sure always flush to avoid breaking afterAll
                    await indexStore.flush(true);
                }
            });
        });
    });

    describe('when constructed with data schema', () => {
        const configWithDataSchema = Object.assign({}, config, {
            data_schema: {
                schema,
                all_formatters: true,
                strict: true,
            },
        });

        let indexStore: IndexStore<SimpleRecord>;
        let isOpenSearch = false;

        beforeAll(async () => {
            indexStore = new IndexStore<SimpleRecord>(
                client,
                configWithDataSchema
            );
            await cleanupIndexStore(indexStore);

            const { distribution } = indexStore.clientMetadata;
            isOpenSearch = distribution === ElasticsearchDistribution.opensearch;

            await indexStore.initialize();
        });

        afterAll(async () => {
            await cleanupIndexStore(indexStore);
            await indexStore.shutdown();
        });

        it('should fail when given an invalid record', async () => {
            expect.hasAssertions();

            const record: Partial<SimpleRecord> = {
                test_id: 'invalid-record-id',
                test_boolean: Buffer.from('wrong') as any,
                test_number: '123' as any,
                _created: 'wrong-date',
            };

            try {
                await indexStore.indexById(record.test_id!, record);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toMatch(/(test_keyword|_created)/);
                expect(err.statusCode).toEqual(400);
            }
        });

        type InputType = 'input' | 'output';
        const cases: [InputType][] = [['input'], ['output']];

        describe.each(cases)('when relying on data schema to transform the %s', (inputType) => {
            const keyword = `data-schema-${inputType}-record`;
            const input: SimpleRecordInput[] = [
                {
                    test_id: `data-schema-${inputType}-1`,
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    _created: new Date().toISOString(),
                },
                {
                    test_id: `data-schema-${inputType}-2`,
                    test_keyword: keyword,
                    test_object: {},
                    test_number: 3333,
                    _updated: new Date().toISOString(),
                },
                {
                    test_id: `data-schema-${inputType}-3`,
                    test_keyword: keyword,
                    test_object: {
                        example: 'obj',
                    },
                    test_boolean: false,
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                },
            ];

            type ExpectedRecord = Omit<SimpleRecord, '_created' | '_updated'>;
            const expected: ExpectedRecord[] = input.map((record) => Object.assign(
                {
                    test_boolean: true,
                    test_number: 676767,
                },
                record
            ));

            beforeAll(async () => {
                await Promise.all(
                    input.map((record, i) => {
                        if (inputType === 'input') {
                            if (i === 0) {
                                return indexStore.createById(record.test_id, record);
                            }
                            return indexStore.indexById(record.test_id, record, {
                                refresh: false,
                            });
                        }
                        if (inputType === 'output') {
                            const indexParams = {
                                index,
                                type: indexStore.config.name,
                                id: record.test_id,
                                body: record,
                                refresh: false,
                            };
                            // TODO: fix this when tests are switched to use new client
                            if (isOpenSearch || indexStore.clientMetadata.majorVersion >= 7) {
                                delete (indexParams as any).type;
                            }
                            return client.index(indexParams);
                        }
                        throw new Error('Invalid Input Type');
                    })
                );

                await indexStore.refresh();
            });

            it('should have created all of the records', async () => {
                const {
                    results,
                } = await indexStore.search(`test_keyword: ${keyword}`, {
                    sort: 'test_id',
                });

                expect(DataEntity.isDataEntityArray(results)).toBeTrue();
                expect(results).toEqual(expected);

                const record = await indexStore.get(expected[0].test_id);

                expect(DataEntity.isDataEntity(record)).toBeTrue();
                expect(record).toEqual(expected[0]);

                const records = await indexStore.mget({
                    docs: expected.map((r) => ({
                        _id: r.test_id,
                    })),
                });

                expect(DataEntity.isDataEntityArray(records)).toBeTrue();
                expect(records).toEqual(expected);
            });

            it('should be able to update a record with a proper field', async () => {
                const result = await indexStore.update(
                    expected[2].test_id,
                    {
                        doc: {
                            test_number: 77777,
                        },
                    }
                );

                expect(result).toBeNil();

                const record = await indexStore.get(expected[2].test_id);
                expect(record).toMatchObject({
                    test_number: 77777,
                });
            });
        });
    });
});
