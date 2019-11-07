import 'jest-extended';
import { Client } from 'elasticsearch';
import { QueryAccess } from 'xlucene-evaluator';
import { times, TSError, AnyObject } from '@terascope/utils';
import {
    IndexModel, IndexModelRecord, IndexModelConfig, IndexModelOptions
} from '../src';
import { makeClient, cleanupIndexStore } from './helpers/elasticsearch';
import { TEST_INDEX_PREFIX } from './helpers/config';

describe('IndexModel', () => {
    interface ExampleRecord extends IndexModelRecord {
        name: string;
        type: string;
        config: AnyObject;
    }

    const client = makeClient();
    const exampleConfig: IndexModelConfig<ExampleRecord> = {
        name: 'example_model',
        mapping: {
            properties: {
                name: {
                    type: 'keyword',
                    fields: {
                        text: {
                            type: 'text',
                            analyzer: 'lowercase_keyword_analyzer',
                        },
                    },
                },
                type: {
                    type: 'keyword',
                },
                config: {
                    type: 'object',
                    enabled: false,
                },
            },
        },
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

    const indexModel = new ExampleIndexModel(client, {
        namespace: `${TEST_INDEX_PREFIX}indexmodel`,
    });

    beforeAll(async () => {
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

        it('should not be able to create the record with conflicts', async () => {
            expect.hasAssertions();

            try {
                await indexModel.createRecord({
                    client_id: 1,
                    name: 'Billy',
                    type: 'billy',
                    config: {
                        foo: 2,
                        bar: 2,
                        baz: {
                            a: 2,
                        },
                    },
                });
            } catch (err) {
                expect(err.message).toEqual('ExampleModel requires name to be unique');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(409);
            }
        });

        it('should be able to create the same name in different client', async () => expect(
            indexModel.createRecord({
                client_id: 2,
                name: 'Billy',
                type: 'billy',
                config: {
                    foo: 2,
                    bar: 2,
                    baz: {
                        a: 2,
                    },
                },
            })
        ).resolves.toMatchObject({
            client_id: 2,
            name: 'Billy',
        }));

        it('should not be able to create the record without a name', async () => {
            expect.hasAssertions();

            try {
                await indexModel.createRecord({} as any);
            } catch (err) {
                expect(err.message).toEqual('ExampleModel requires field name');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(422);
            }
        });

        describe('when using the convience method findAndApply', () => {
            describe('when given null', () => {
                it('should throw an error', async () => {
                    expect.hasAssertions();
                    try {
                        await indexModel.findAndApply(undefined);
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

        it('should not be able to update with a different name', async () => {
            expect.hasAssertions();

            const name = 'fooooobarrr';
            await indexModel.createRecord({
                name,
                client_id: 1,
                type: 'foobar',
                config: {},
            });

            try {
                await indexModel.updateRecord(created._key, {
                    type: 'billy',
                    name,
                });
            } catch (err) {
                expect(err.message).toEqual('ExampleModel requires name to be unique');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(409);
            }
        });

        it('should not be able to update without an _key', async () => {
            expect.hasAssertions();

            try {
                await indexModel.updateRecord(undefined as any, {} as any);
            } catch (err) {
                expect(err.message).toStartWith('Invalid ID given to updateRecord, expected string or integer');
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
            expect.hasAssertions();

            try {
                await indexModel.fetchRecord('WrongBilly');
            } catch (err) {
                expect(err.message).toEqual('Unable to find ExampleModel by _key: "WrongBilly" OR name: "WrongBilly"');
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
            expect.hasAssertions();
            await indexModel.deleteRecord(fetched._key);

            try {
                await indexModel.findById(fetched._key);
            } catch (err) {
                expect(err.message).toInclude('Record Missing');
                expect(err.statusCode).toEqual(410);
            }
        });

        it('should be able to delete the record', async () => {
            await indexModel.deleteById(fetched._key);

            return expect(indexModel.findById(fetched._key)).rejects.toThrowError(/Unable to find ExampleModel/);
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

    describe('when creating mulitple records', () => {
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
                const result = await indexModel.search('name:Bob*', {
                    size: 6,
                });

                expect(result).toBeArrayOfSize(5);
                for (const record of result) {
                    expect(record).toHaveProperty('_key');
                    expect(record).toHaveProperty('_created');
                    expect(record).toHaveProperty('_updated');
                    expect(record.name).toStartWith('Bob');
                }
            });

            it('should be able to find all of the Joes', async () => {
                const result = await indexModel.search('name:Joe*', { size: 6 });

                expect(result).toBeArrayOfSize(5);

                for (const record of result) {
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
                const result = await indexModel.search('name:Joe*', { size: 2 });

                expect(result).toBeArrayOfSize(2);

                for (const record of result) {
                    expect(record.name).toStartWith('Joe');
                }
            });

            it('should be able to sort by name', async () => {
                const result = await indexModel.search('name:(Bob* OR Joe*)', {
                    size: 11,
                    sort: 'name:desc',
                    includes: ['name', '_updated'],
                });

                expect(result).toBeArrayOfSize(10);

                result.reverse().forEach((record, index) => {
                    if (index < 5) {
                        expect(record).toHaveProperty('name', `Bob ${index}`);
                    } else {
                        expect(record).toHaveProperty('name', `Joe ${index - 5}`);
                    }
                });
            });

            it('should be able to limit the fields returned', async () => {
                const result = await indexModel.search('name:Joe*', {
                    size: 1,
                    includes: ['name'],
                });

                expect(result).toBeArrayOfSize(1);

                for (const record of result) {
                    expect(record).not.toHaveProperty('_key');
                    expect(record).not.toHaveProperty('_created');
                    expect(record).not.toHaveProperty('_updated');
                    expect(record.name).toStartWith('Joe');
                }
            });

            it('should be able to find no Ninjas', async () => {
                const result = await indexModel.search('name:"Ninja"', {
                    size: 2,
                });

                expect(result).toBeArrayOfSize(0);
            });
        });

        describe('with query restirctions', () => {
            it('should be able to count all of the Bobs', async () => {
                const queryAccess = new QueryAccess({
                    includes: ['name'],
                });

                const count = await indexModel.count('name:Bob*', {}, queryAccess);
                expect(count).toBe(5);
            });

            it('should be able to find all by ids', async () => {
                const queryAccess = new QueryAccess({
                    includes: ['_key', 'name'],
                });

                const findResult = await indexModel.search('name:Bob*', {
                    size: 3,
                    includes: ['_key'],
                });

                const ids = findResult.map((doc) => doc._key);

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
                });

                const result = await indexModel.search('name:Bob*', {
                    size: 6
                }, queryAccess);

                expect(result).toBeArrayOfSize(5);
                for (const record of result) {
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
                });

                const NOT_NAME = 'Bob 1';
                const result = await indexModel.search(`NOT name:"${NOT_NAME}"`, { size: 6 }, queryAccess);

                expect(result).toBeArrayOfSize(4);
                for (const record of result) {
                    expect(record).not.toBeNil();
                    expect(record.name).not.toEqual(NOT_NAME);
                    expect(record.name).toStartWith('Bob');
                }
            });
        });
    });

    describe('when appending to an array', () => {
        it('should return early if given empty values', async () => {
            await indexModel.appendToArray('example', 'name', []);
        });
    });

    describe('when removing from an array', () => {
        it('should return early if given empty values', async () => {
            await indexModel.removeFromArray('example', 'name', []);
        });
    });
});
