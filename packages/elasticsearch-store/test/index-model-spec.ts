import 'jest-extended';
import { QueryAccess } from 'xlucene-translator';
import { FieldType } from '@terascope/types';
import { times, TSError, AnyObject } from '@terascope/core-utils';
import { Client, ElasticsearchTestHelpers } from '@terascope/opensearch-client';
import {
    IndexModel, IndexModelRecord, IndexModelConfig,
    IndexModelOptions, makeRecordDataType
} from '../src/index.js';
import { cleanupIndexStore } from './helpers/utils.js';

const { makeClient, TEST_INDEX_PREFIX } = ElasticsearchTestHelpers;

describe('IndexModel', () => {
    interface ExampleRecord extends IndexModelRecord {
        name: string;
        type: string;
        config: AnyObject;
    }

    const dataType = makeRecordDataType({
        name: 'ExampleModel',
        fields: {
            name: {
                type: FieldType.KeywordCaseInsensitive,
                use_fields_hack: true
            },
            type: { type: FieldType.Keyword },
            config: { type: FieldType.Object, indexed: false },
        }
    });

    const exampleConfig: IndexModelConfig<ExampleRecord> = {
        name: 'example_model',
        data_type: dataType,
        schema: {
            properties: {
                name: {
                    type: 'string',
                },
                type: {
                    type: 'string',
                },
                config: {
                    type: 'object',
                    additionalProperties: true,
                    default: {},
                },
            },
        },
        default_sort: 'name:asc',
        unique_fields: ['name'],
        version: 1,
    };

    class ExampleIndexModel extends IndexModel<ExampleRecord> {
        constructor(_client: Client, options: IndexModelOptions) {
            super(_client, options, exampleConfig);
        }
    }

    let indexModel: ExampleIndexModel;

    beforeAll(async () => {
        const client = await makeClient();
        indexModel = new ExampleIndexModel(client, {
            namespace: `${TEST_INDEX_PREFIX}index_model`,
        });

        await cleanupIndexStore(indexModel);
        return indexModel.initialize();
    });

    afterAll(async () => {
        await cleanupIndexStore(indexModel);
        return indexModel.shutdown();
    });

    describe('when creating a record', () => {
        let created: ExampleRecord;
        let fetched: ExampleRecord;

        beforeAll(async () => {
            created = await indexModel.createRecord({
                client_id: 1,
                name: 'Billy',
                type: 'billy',
                config: {
                    foo: 1,
                    bar: 1,
                    baz: {
                        a: 1,
                    },
                },
            });

            fetched = await indexModel.findById(created._key);
        });

        it('should have _created the record', () => {
            expect(created).toEqual(fetched);
        });

        it('should be able to find the record with restrictions', async () => {
            const queryAccess = new QueryAccess({
                excludes: ['_updated'],
                type_config: indexModel.xLuceneTypeConfig
            });
            const result = await indexModel.findById(fetched._key, {}, queryAccess);

            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('_created');
            expect(result).not.toHaveProperty('_updated');
        });

        describe('when preventing query injection', () => {
            const valueTestCases = ['a" OR _key:* OR _key:"a'];
            const oneOfTestCases = ['a") OR _key:* OR _key:("a'];

            test.each([valueTestCases])('should be able to query findById with %s', async (query) => {
                await expect(indexModel.findById(query)).rejects.toThrow(/Unable to find/);
            });

            test.each([valueTestCases])('should be able to query countBy with %s', async (query) => {
                await expect(indexModel.countBy({ _key: query })).resolves.toBe(0);
            });

            test.each([valueTestCases])('should be able to query findByAnyId with %s', async (query) => {
                await expect(indexModel.fetchRecord(query)).rejects.toThrow(/Unable to find/);
            });

            test.each([oneOfTestCases])('should be able to query findAll with %s', async (query) => {
                await expect(indexModel.findAll(query)).rejects.toThrow();
            });

            test.each([oneOfTestCases])('should be able to query exists with %s', async (query) => {
                await expect(indexModel.exists(query)).resolves.toBeFalse();
            });
        });

        describe('when testing uniqueness', () => {
            const name = 'Some@Body_ _hello*';
            let id: string;

            beforeAll(async () => {
                const record = await indexModel.createRecord({
                    client_id: 5,
                    name,
                    type: name,
                    config: {},
                });
                id = record._key;
            });

            it('should NOT be able to create a record with the same name and client', async () => {
                try {
                    await expect(indexModel.createRecord({
                        client_id: 5,
                        name,
                        type: name,
                        config: {},
                    })).toReject();
                } catch (err) {
                    expect(err.message).toEqual('ExampleModel requires name to be unique');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(409);
                }
            });

            it('should NOT be able to create a record with a similar name and client', async () => {
                try {
                    await expect(indexModel.createRecord({
                        client_id: 5,
                        name: 'Some-Body_(_hello?',
                        type: name,
                        config: {},
                    })).toReject();
                } catch (err) {
                    expect(err.message).toEqual('ExampleModel requires name to be unique');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(409);
                }
            });
            it('should NOT be able to create a record with a similar lowercased name and client', async () => {
                try {
                    await expect(indexModel.createRecord({
                        client_id: 5,
                        name: name.toLowerCase(),
                        type: name,
                        config: {},
                    })).toReject();
                } catch (err) {
                    expect(err.message).toEqual('ExampleModel requires name to be unique');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(409);
                }
            });

            it('should be able to create the same name in different client', async () => {
                await expect(indexModel.createRecord({
                    client_id: 6,
                    name,
                    type: name,
                    config: {},
                })).resolves.toMatchObject({
                    name,
                    client_id: 6,
                });
            });

            it('should be to soft delete the record and create a new one with the same name', async () => {
                await expect(indexModel.deleteRecord(id)).resolves.toBeTrue();

                await expect(indexModel.createRecord({
                    client_id: 5,
                    name,
                    type: name,
                    config: {},
                })).resolves.toMatchObject({
                    name,
                    client_id: 5,
                });
            });
        });

        it('should not be able to create the record without a name', async () => {
            try {
                await expect(indexModel.createRecord({} as any)).toReject();
            } catch (err) {
                expect(err.message).toEqual('ExampleModel requires field name');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(422);
            }
        });

        describe('when using the convenience method findAndApply', () => {
            describe('when given null', () => {
                it('should throw an error', async () => {
                    try {
                        await expect(indexModel.findAndApply(undefined)).toReject();
                    } catch (err) {
                        expect(err.message).toEqual('Invalid input for ExampleModel');
                        expect(err).toBeInstanceOf(TSError);
                        expect(err.statusCode).toEqual(422);
                    }
                });
            });

            describe('when given an object with a _key', () => {
                it('should resolve the full record', async () => {
                    const result = await indexModel.findAndApply({ _key: fetched._key });
                    expect(result).toEqual(fetched);
                });
            });

            describe('when given an object without an _key', () => {
                it('should resolve the partial record record', () => {
                    const input = { config: {} };
                    return expect(indexModel.findAndApply(input)).resolves.toEqual(input);
                });
            });
        });

        it('should NOT be able to update with a different name', async () => {
            const name = 'fooooobarrr';
            await indexModel.createRecord({
                name,
                client_id: 1,
                type: 'foobar',
                config: {},
            });

            try {
                await expect(indexModel.updateRecord(created._key, {
                    type: 'billy',
                    name,
                })).toReject();
            } catch (err) {
                expect(err.message).toEqual('ExampleModel requires name to be unique');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(409);
            }
        });

        it('should not be able to update without an _key', async () => {
            try {
                await expect(
                    indexModel.updateRecord(undefined as any, {} as any)
                ).toReject();
            } catch (err) {
                expect(err.message).toStartWith('Invalid ID given to updateRecord, expected string');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(400);
            }
        });

        it('should have the required properties', () => {
            expect(fetched).toHaveProperty('_key');
            expect(fetched).toHaveProperty('_updated');
            expect(fetched).toHaveProperty('_created');
        });

        it('should be able to find by name since it is treated a name', async () => {
            const result = await indexModel.fetchRecord('Billy');
            expect(result).toEqual(fetched);
        });

        it('should be able to find one record by specific fields', async () => {
            const result = await indexModel.findBy({
                name: 'Billy',
                client_id: 1,
                type: 'billy'
            });
            expect(result).toEqual(fetched);
        });

        it('should not be able to find by name an incorrect name', async () => {
            try {
                await expect(
                    indexModel.fetchRecord('WrongBilly')
                ).toReject();
            } catch (err) {
                expect(err.message).toEqual('Unable to find ExampleModel by _key: WrongBilly OR name: WrongBilly');
                expect(err.statusCode).toEqual(404);
                expect(err).toBeInstanceOf(TSError);
            }
        });

        it('should be able to update the record', async () => {
            const updateInput = { ...fetched, name: 'Hello' };

            const updateResult = await indexModel.updateRecord(fetched._key, updateInput);
            expect(updateResult).not.toBe(updateInput);

            const result = await indexModel.findById(fetched._key);
            expect(result).toHaveProperty('name', 'Hello');

            expect(new Date(result._updated)).toBeAfter(new Date(fetched._updated));
        });

        it('should be able to correctly handle a partial update', async () => {
            const updateInput = { config: { foo: 1 } };

            await indexModel.updateRecord(fetched._key, updateInput);

            const result = await indexModel.findById(fetched._key);
            expect(result).toHaveProperty('config', {
                foo: 1,
            });
        });

        it('should be able to soft delete the record', async () => {
            await expect(indexModel.deleteRecord(fetched._key)).resolves.toBeTrue();
            await expect(indexModel.deleteRecord(fetched._key)).resolves.toBeFalse();

            try {
                await expect(indexModel.findById(fetched._key)).toReject();
            } catch (err) {
                expect(err.message).toInclude('Unable to find');
                expect(err.statusCode).toEqual(404);
            }

            return expect(indexModel.recordExists(fetched._key)).resolves.toBeFalse();
        });

        it('should be able to hard delete the record', async () => {
            await indexModel.deleteById(fetched._key);

            return expect(indexModel.findById(fetched._key)).rejects.toThrow(/Unable to find ExampleModel/);
        });
    });

    describe('when giving an invalid input into findAll', () => {
        it('should NOT fail when given an empty array', async () => {
            const result = await indexModel.findAll([]);
            expect(result).toBeArrayOfSize(0);
        });

        it('should NOT fail when given an array of falsey values', async () => {
            const input: any = ['', undefined, null];
            return expect(indexModel.findAll(input)).resolves.toBeArrayOfSize(0);
        });
    });

    describe('when creating multiple records', () => {
        beforeAll(async () => {
            await Promise.all(
                times(5, (n) => indexModel.createRecord({
                    client_id: 1,
                    type: 'joe',
                    name: `Joe ${n}`,
                    config: {},
                }))
            );

            await Promise.all(
                times(5, (n) => indexModel.createRecord({
                    client_id: 2,
                    type: 'bob',
                    name: `Bob ${n}`,
                    config: {},
                }))
            );
        });

        describe('without query restrictions', () => {
            it('should be able to count all of the Bobs', async () => {
                const count = await indexModel.count('name:Bob*');
                expect(count).toBe(5);
            });

            it('should be able to find all of the Bobs', async () => {
                const response = await indexModel.search('name:Bob*', {
                    size: 6,
                });

                expect(response._total).toBe(5);
                expect(response._fetched).toBe(5);
                expect(response.results).toBeArrayOfSize(5);
                for (const record of response.results) {
                    expect(record).toHaveProperty('_key');
                    expect(record).toHaveProperty('_created');
                    expect(record).toHaveProperty('_updated');
                    expect(record.name).toStartWith('Bob');
                }
            });

            it('should be able to find all of the Joes', async () => {
                const response = await indexModel.search('name:Joe*', { size: 6 });

                expect(response._total).toBe(5);
                expect(response._fetched).toBe(5);
                expect(response.results).toBeArrayOfSize(5);

                for (const record of response.results) {
                    expect(record).toHaveProperty('_key');
                    expect(record).toHaveProperty('_created');
                    expect(record).toHaveProperty('_updated');
                    expect(record.name).toStartWith('Joe');
                }
            });

            it('should be able to find all by specific fields', async () => {
                const result = await indexModel.findAllBy(
                    { type: 'joe', client_id: 1 },
                    'AND',
                    { size: 3 }
                );

                expect(result).toBeArrayOfSize(3);

                for (const record of result) {
                    expect(record).toHaveProperty('_key');
                    expect(record).toHaveProperty('_created');
                    expect(record).toHaveProperty('_updated');
                    expect(record.name).toStartWith('Joe');
                }
            });

            it('should be able to find 2 of the Joes', async () => {
                const response = await indexModel.search('name:Joe*', { size: 2 });

                expect(response._total).toBe(5);
                expect(response._fetched).toBe(2);
                expect(response.results).toBeArrayOfSize(2);

                for (const record of response.results) {
                    expect(record.name).toStartWith('Joe');
                }
            });

            it('should be able to sort by name', async () => {
                const { results } = await indexModel.search('name:(Bob* OR Joe*)', {
                    size: 11,
                    sort: 'name:desc',
                    includes: ['name', '_updated'],
                });

                expect(results).toBeArrayOfSize(10);

                results.reverse().forEach((record, index) => {
                    if (index < 5) {
                        expect(record).toHaveProperty('name', `Bob ${index}`);
                    } else {
                        expect(record).toHaveProperty('name', `Joe ${index - 5}`);
                    }
                });
            });

            it('should be able to limit the fields returned', async () => {
                const response = await indexModel.search('name:Joe*', {
                    size: 1,
                    includes: ['name'],
                });

                expect(response._total).toBe(5);
                expect(response._fetched).toBe(1);
                expect(response.results).toBeArrayOfSize(1);

                for (const record of response.results) {
                    expect(record).not.toHaveProperty('_key');
                    expect(record).not.toHaveProperty('_created');
                    expect(record).not.toHaveProperty('_updated');
                    expect(record.name).toStartWith('Joe');
                }
            });

            it('should be able to find no Ninjas', async () => {
                const response = await indexModel.search('name:"Ninja"', {
                    size: 2,
                });

                expect(response._total).toBe(0);
                expect(response._fetched).toBe(0);
                expect(response.results).toBeArrayOfSize(0);
            });
        });

        describe('with query restrictions', () => {
            it('should be able to count all of the Bobs', async () => {
                const queryAccess = new QueryAccess({
                    includes: ['name'],
                    type_config: indexModel.xLuceneTypeConfig
                });

                const count = await indexModel.count('name:Bob*', {}, queryAccess);
                expect(count).toBe(5);
            });

            it('should be able to find all by ids', async () => {
                const queryAccess = new QueryAccess({
                    includes: ['_key', 'name'],
                    type_config: indexModel.xLuceneTypeConfig
                });

                const { results } = await indexModel.search('name:Bob*', {
                    size: 3,
                    includes: ['_key'],
                });

                const ids = results.map((doc) => doc._key);

                const result = await indexModel.findAll(ids, queryAccess);

                expect(result).toBeArrayOfSize(3);
                for (const record of result) {
                    expect(record).not.toBeNil();
                    expect(record).toHaveProperty('_key');
                    expect(record).toHaveProperty('name');
                    expect(record).not.toHaveProperty('_created');
                }
            });

            it('should be able to search for all of the Bobs', async () => {
                const queryAccess = new QueryAccess({
                    constraint: 'name:Bob*',
                    excludes: ['_created'],
                    type_config: indexModel.xLuceneTypeConfig
                });

                const { results } = await indexModel.search('name:Bob*', {
                    size: 6
                }, queryAccess);

                expect(results).toBeArrayOfSize(5);
                for (const record of results) {
                    expect(record).not.toBeNil();
                    expect(record).toHaveProperty('_key');
                    expect(record).not.toHaveProperty('_created');
                    expect(record).toHaveProperty('_updated');
                    expect(record.name).toStartWith('Bob');
                }
            });

            it('should be able to use NOT query when finding bobs', async () => {
                const queryAccess = new QueryAccess({
                    constraint: 'name:Bob*',
                    excludes: ['_created'],
                    type_config: indexModel.xLuceneTypeConfig
                });

                const NOT_NAME = 'Bob 1';
                const { results } = await indexModel.search(
                    `NOT name:"${NOT_NAME}"`, { size: 6 }, queryAccess
                );

                expect(results).toBeArrayOfSize(4);
                for (const record of results) {
                    expect(record).not.toBeNil();
                    expect(record.name).not.toEqual(NOT_NAME);
                    expect(record.name).toStartWith('Bob');
                }
            });
        });
    });

    describe('when appending to an array', () => {
        it('should return early if given empty values', async () => {
            const result = await indexModel.appendToArray('example', 'name', []);
            expect(result).toBeUndefined();
        });
    });

    describe('when removing from an array', () => {
        it('should return early if given empty values', async () => {
            const result = await indexModel.removeFromArray('example', 'name', []);
            expect(result).toBeUndefined();
        });
    });

    it('should return false on recordExists if invalid id', async () => {
        const result = await Promise.all([
            indexModel.recordExists('', 1),
            indexModel.recordExists([], 1),
            indexModel.recordExists('foo', 1)
        ]);

        expect(result).toBeArrayOfSize(3);
        expect(result).toMatchObject([false, false, false]);
    });
});
