import 'jest-extended';
import { Client } from 'elasticsearch';
import { times, TSError } from '@terascope/utils';
import { IndexModel, IndexModelRecord, IndexModelConfig, IndexModelOptions } from '../src';
import { makeClient, cleanupIndexStore } from './helpers/elasticsearch';
import { LuceneQueryAccess } from 'xlucene-evaluator';

describe('IndexModel', () => {
    interface ExampleRecord extends IndexModelRecord {
        name: string;
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
                            analyzer: 'lowercase_keyword_analyzer'
                        }
                    }
                },
            }
        },
        schema: {
            properties: {
                name: {
                    type: 'string'
                }
            }
        },
        storeOptions: {
            defaultSort: 'name:asc',
        },
        uniqueFields: ['name'],
        version: 1,
    };

    class ExampleIndexModel extends IndexModel<ExampleRecord> {
        constructor(client: Client, options: IndexModelOptions) {
            super(client, options, exampleConfig);
        }
    }

    const indexModel = new ExampleIndexModel(client, {
        namespace: 'test',
        storeOptions: {
            bulkMaxSize: 50,
            bulkMaxWait: 300,
        }
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
                name: 'Billy'
            });

            fetched = await indexModel.findById(created.id);
        });

        it('should have created the record', () => {
            expect(created).toEqual(fetched);
        });

        it('should be able to find the record with restrictions', async () => {
            const queryAccess = new LuceneQueryAccess({
                excludes: ['updated']
            });
            const result = await indexModel.findById(fetched.id, queryAccess);

            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('created');
            expect(result).not.toHaveProperty('updated');
        });

        it('should not be able to create the record again due to conflicts', async () => {
            expect.hasAssertions();

            try {
                await indexModel.create(created);
            } catch (err) {
                expect(err.message).toEqual('IndexModel create requires name to be unique');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(409);
            }
        });

        it('should not be able to create the record without a name', async () => {
            expect.hasAssertions();

            try {
                // @ts-ignore
                await indexModel.create({});
            } catch (err) {
                expect(err.message).toEqual('IndexModel create requires field name');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(422);
            }
        });

        it('should not be able to update with a different name', async () => {
            expect.hasAssertions();

            const name = 'fooooobarrr';
            await indexModel.create({
                name
            });

            try {
                await indexModel.update({
                    ...created,
                    name
                });
            } catch (err) {
                expect(err.message).toEqual('IndexModel update requires name to be unique');
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
                expect(err.message).toEqual('Unable to find IndexModel by \'id:"WrongBilly" OR name:"WrongBilly"\'');
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

        it('should be able to delete the record', async () => {
            await indexModel.deleteById(fetched.id);

            return expect(indexModel.findById(fetched.id))
                .rejects.toThrowError(/Unable to find IndexModel/);
        });
    });

    describe('when creating mulitple records', () => {
        beforeAll(async () => {
            await Promise.all(times(5, (n) => {
                return indexModel.create({
                    name: `Joe ${n}`
                });
            }));

            await Promise.all(times(5, (n) => {
                return indexModel.create({
                    name: `Bob ${n}`
                });
            }));
        });

        it('should be able to count all of the Bobs', async () => {
            const count = await indexModel.count('name:Bob*');
            expect(count).toBe(5);
        });

        it('should be able to count with restrictions', async () => {
            const queryAccess = new LuceneQueryAccess({
                includes: ['name']
            });

            const count = await indexModel.count('name:Bob*', queryAccess);
            expect(count).toBe(5);
        });

        it('should be able to find all of the Bobs', async () => {
            const result = await indexModel.find('name:Bob*', {
                size: 6
            });

            expect(result).toBeArrayOfSize(5);
            for (const record of result) {
                expect(record).toHaveProperty('id');
                expect(record).toHaveProperty('created');
                expect(record).toHaveProperty('updated');
                expect(record.name).toStartWith('Bob');
            }
        });

        it('should be able to find by ids with restrictions', async () => {
            const queryAccess = new LuceneQueryAccess({
                includes: ['id', 'name']
            });

            const findResult = await indexModel.find('name:Bob*', {
                size: 3,
                includes: ['id']
            });

            const ids = findResult.map((doc) => doc.id);

            const result = await indexModel.findAll(ids, queryAccess);

            expect(result).toBeArrayOfSize(3);
            for (const record of result) {
                expect(record).toHaveProperty('id');
                expect(record).toHaveProperty('name');
                expect(record).not.toHaveProperty('created');
            }
        });

        it('should be able to find all of the Bobs', async () => {
            const queryAccess = new LuceneQueryAccess({
                constraint: 'name:Bob*',
                excludes: ['created']
            });

            const result = await indexModel.find('name:Bob*', { size: 6 }, queryAccess);

            expect(result).toBeArrayOfSize(5);
            for (const record of result) {
                expect(record).toHaveProperty('id');
                expect(record).not.toHaveProperty('created');
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
                includes: ['name', 'updated']
            });

            expect(result).toBeArrayOfSize(10);

            result.reverse().forEach((record, index) => {
                if (index < 5) {
                    expect(record.name).toEqual(`Bob ${index}`);
                } else {
                    expect(record.name).toEqual(`Joe ${index - 5}`);
                }
            });
        });

        it('should be able to limit the fields returned', async () => {
            const result = await indexModel.find('name:Joe*', {
                size: 1,
                includes: ['name']
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
                size: 2
            });

            expect(result).toBeArrayOfSize(0);
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
