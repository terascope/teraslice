import 'jest-extended';
import { Client } from 'elasticsearch';
import { QueryAccess } from 'xlucene-evaluator';
import { times, TSError, AnyObject } from '@terascope/utils';
import { IndexModel, IndexModelRecord, IndexModelConfig, IndexModelOptions } from '../src';
import { makeClient, cleanupIndexStore } from './helpers/elasticsearch';
import { TEST_INDEX_PREFIX } from './helpers/config';

describe('IndexModel', () => {
    interface ExampleRecord extends IndexModelRecord {
        name: string;
        config: AnyObject;
    }

    const client = makeClient();
    const exampleConfig: IndexModelConfig<ExampleRecord> = {
        name: 'index_model',
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
                config: {
                    type: 'object',
                },
            },
        },
        schema: {
            properties: {
                name: {
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
        await cleanupIndexStore(indexModel.store);
        return indexModel.initialize();
    });

    afterAll(async () => {
        await cleanupIndexStore(indexModel.store);
        return indexModel.shutdown();
    });

    describe('when creating a record', () => {
        let created: ExampleRecord;
        let fetched: ExampleRecord;

        beforeAll(async () => {
            created = await indexModel.create({
                client_id: 1,
                name: 'Billy',
                config: {
                    foo: 1,
                    bar: 1,
                    baz: {
                        a: 1,
                    },
                },
            });

            fetched = await indexModel.findById(created.id);
        });

        it('should have created the record', () => {
            expect(created).toEqual(fetched);
        });

        it('should be able to find the record with restrictions', async () => {
            const queryAccess = new QueryAccess({
                excludes: ['updated'],
            });
            const result = await indexModel.findById(fetched.id, queryAccess);

            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('created');
            expect(result).not.toHaveProperty('updated');
        });

        describe('when preventing query injection', () => {
            const valueTestCases = ['a" OR id:* OR id:"a'];
            const oneOfTestCases = ['a") OR id:* OR id:("a'];

            test.each([valueTestCases])('should be able to query findById with %s', async query => {
                await expect(indexModel.findById(query)).rejects.toThrow(/Unable to find/);
            });

            test.each([valueTestCases])('should be able to query countBy with %s', async query => {
                await expect(indexModel.countBy({ id: query })).resolves.toBe(0);
            });

            test.each([valueTestCases])('should be able to query findByAnyId with %s', async query => {
                await expect(indexModel.findByAnyId(query)).rejects.toThrow(/Unable to find/);
            });

            test.each([oneOfTestCases])('should be able to query findAll with %s', async query => {
                await expect(indexModel.findAll(query)).rejects.toThrow();
            });

            test.each([oneOfTestCases])('should be able to query exists with %s', async query => {
                await expect(indexModel.exists(query)).resolves.toBeFalse();
            });
        });

        it('should not be able to create the record with conflicts', async () => {
            expect.hasAssertions();

            try {
                await indexModel.create({
                    client_id: 1,
                    name: 'Billy',
                    config: {
                        foo: 2,
                        bar: 2,
                        baz: {
                            a: 2,
                        },
                    },
                });
            } catch (err) {
                expect(err.message).toEqual('IndexModel requires name to be unique');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(409);
            }
        });

        it('should be able to create the same name in different client', async () => {
            return expect(
                indexModel.create({
                    client_id: 2,
                    name: 'Billy',
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
            });
        });

        it('should not be able to create the record without a name', async () => {
            expect.hasAssertions();

            try {
                // @ts-ignore
                await indexModel.create({});
            } catch (err) {
                expect(err.message).toEqual('IndexModel requires field name');
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
                        expect(err.message).toEqual('Invalid input for IndexModel');
                        expect(err).toBeInstanceOf(TSError);
                        expect(err.statusCode).toEqual(422);
                    }
                });
            });

            describe('when given an object with a id', () => {
                it('should resolve the full record', () => {
                    return expect(indexModel.findAndApply({ id: fetched.id })).resolves.toEqual(fetched);
                });
            });

            describe('when given an object without an id', () => {
                it('should resolve the partial record record', () => {
                    const input = { config: {} };
                    return expect(indexModel.findAndApply(input)).resolves.toEqual(input);
                });
            });
        });

        it('should not be able to update with a different name', async () => {
            expect.hasAssertions();

            const name = 'fooooobarrr';
            await indexModel.create({
                name,
                client_id: 1,
                config: {},
            });

            try {
                await indexModel.update({
                    ...created,
                    name,
                });
            } catch (err) {
                expect(err.message).toEqual('IndexModel requires name to be unique');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(409);
            }
        });

        it('should not be able to update without an id', async () => {
            expect.hasAssertions();

            try {
                // @ts-ignore
                await indexModel.update({});
            } catch (err) {
                expect(err.message).toEqual('IndexModel update requires id');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(422);
            }
        });

        it('should have the required properties', () => {
            expect(fetched).toHaveProperty('id');
            expect(fetched).toHaveProperty('updated');
            expect(fetched).toHaveProperty('created');
        });

        it('should be able to find by name since it is treated a name', async () => {
            const result = await indexModel.findByAnyId('Billy');
            expect(result).toEqual(fetched);
        });

        it('should not be able to find by name an incorrect name', async () => {
            expect.hasAssertions();

            try {
                await indexModel.findByAnyId('WrongBilly');
            } catch (err) {
                expect(err.message).toEqual('Unable to find IndexModel by id: "WrongBilly" OR name: "WrongBilly"');
                expect(err.statusCode).toEqual(404);
                expect(err).toBeInstanceOf(TSError);
            }
        });

        it('should be able to update the record', async () => {
            const updateInput = { ...fetched, name: 'Hello' };

            const updateResult = await indexModel.update(updateInput);
            expect(updateResult).not.toBe(updateInput);

            const result = await indexModel.findById(fetched.id);
            expect(result).toHaveProperty('name', 'Hello');

            expect(new Date(result.updated)).toBeAfter(new Date(fetched.updated));
        });

        it('should be able to correctly handle a partial update', async () => {
            const updateInput = { id: fetched.id, config: { foo: 1 } };

            await indexModel.update(updateInput);

            const result = await indexModel.findById(fetched.id);
            expect(result).toHaveProperty('config', {
                foo: 1,
            });
        });

        it('should be able to delete the record', async () => {
            await indexModel.deleteById(fetched.id);

            return expect(indexModel.findById(fetched.id)).rejects.toThrowError(/Unable to find IndexModel/);
        });
    });

    describe('when giving an invalid input into findAll', () => {
        it('should NOT fail when given an empty array', async () => {
            return expect(indexModel.findAll([])).resolves.toBeArrayOfSize(0);
        });

        it('should NOT fail when given an array of falsey values', async () => {
            const input: any = ['', undefined, null];
            return expect(indexModel.findAll(input)).resolves.toBeArrayOfSize(0);
        });
    });

    describe('when creating mulitple records', () => {
        beforeAll(async () => {
            await Promise.all(
                times(5, n => {
                    return indexModel.create({
                        client_id: 1,
                        name: `Joe ${n}`,
                        config: {},
                    });
                })
            );

            await Promise.all(
                times(5, n => {
                    return indexModel.create({
                        client_id: 1,
                        name: `Bob ${n}`,
                        config: {},
                    });
                })
            );
        });

        describe('without query restrictions', () => {
            it('should be able to count all of the Bobs', async () => {
                const count = await indexModel.count('name:Bob*');
                expect(count).toBe(5);
            });

            it('should be able to find all of the Bobs', async () => {
                const result = await indexModel.find('name:Bob*', {
                    size: 6,
                });

                expect(result).toBeArrayOfSize(5);
                for (const record of result) {
                    expect(record).toHaveProperty('id');
                    expect(record).toHaveProperty('created');
                    expect(record).toHaveProperty('updated');
                    expect(record.name).toStartWith('Bob');
                }
            });

            it('should be able to find all of the Joes', async () => {
                const result = await indexModel.find('name:Joe*', { size: 6 });

                expect(result).toBeArrayOfSize(5);

                for (const record of result) {
                    expect(record).toHaveProperty('id');
                    expect(record).toHaveProperty('created');
                    expect(record).toHaveProperty('updated');
                    expect(record.name).toStartWith('Joe');
                }
            });

            it('should be able to find 2 of the Joes', async () => {
                const result = await indexModel.find('name:Joe*', { size: 2 });

                expect(result).toBeArrayOfSize(2);

                for (const record of result) {
                    expect(record.name).toStartWith('Joe');
                }
            });

            it('should be able to sort by name', async () => {
                const result = await indexModel.find('name:(Bob* OR Joe*)', {
                    size: 11,
                    sort: 'name:desc',
                    includes: ['name', 'updated'],
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
                const result = await indexModel.find('name:Joe*', {
                    size: 1,
                    includes: ['name'],
                });

                expect(result).toBeArrayOfSize(1);

                for (const record of result) {
                    expect(record).not.toHaveProperty('id');
                    expect(record).not.toHaveProperty('created');
                    expect(record).not.toHaveProperty('updated');
                    expect(record.name).toStartWith('Joe');
                }
            });

            it('should be able to find no Ninjas', async () => {
                const result = await indexModel.find('name:"Ninja"', {
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

                const count = await indexModel.count('name:Bob*', queryAccess);
                expect(count).toBe(5);
            });

            it('should be able to find all by ids', async () => {
                const queryAccess = new QueryAccess({
                    includes: ['id', 'name'],
                });

                const findResult = await indexModel.find('name:Bob*', {
                    size: 3,
                    includes: ['id'],
                });

                const ids = findResult.map(doc => doc.id);

                const result = await indexModel.findAll(ids, queryAccess);

                expect(result).toBeArrayOfSize(3);
                for (const record of result) {
                    expect(record).not.toBeNil();
                    expect(record).toHaveProperty('id');
                    expect(record).toHaveProperty('name');
                    expect(record).not.toHaveProperty('created');
                }
            });

            it('should be able to search for all of the Bobs', async () => {
                const queryAccess = new QueryAccess({
                    constraint: 'name:Bob*',
                    excludes: ['created'],
                });

                const result = await indexModel.find('name:Bob*', { size: 6 }, queryAccess);

                expect(result).toBeArrayOfSize(5);
                for (const record of result) {
                    expect(record).not.toBeNil();
                    expect(record).toHaveProperty('id');
                    expect(record).not.toHaveProperty('created');
                    expect(record).toHaveProperty('updated');
                    expect(record.name).toStartWith('Bob');
                }
            });

            it('should be able to use NOT query when finding bobs', async () => {
                const queryAccess = new QueryAccess({
                    constraint: 'name:Bob*',
                    excludes: ['created'],
                });

                const NOT_NAME = 'Bob 1';
                const result = await indexModel.find(`NOT name:"${NOT_NAME}"`, { size: 6 }, queryAccess);

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
            // @ts-ignore
            await indexModel._appendToArray('example', 'name', []);
        });
    });

    describe('when removing from an array', () => {
        it('should return early if given empty values', async () => {
            // @ts-ignore
            await indexModel._removeFromArray('example', 'name', []);
        });
    });
});
