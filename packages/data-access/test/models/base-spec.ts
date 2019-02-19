import 'jest-extended';
import { DataEntity, times, TSError, Omit } from '@terascope/utils';
import { Base, BaseModel, ModelConfig } from '../../src/models/base';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Base', () => {
    interface ExampleModel extends BaseModel {
        name: string;
    }

    const client = makeClient();
    const baseConfig: ModelConfig = {
        name: 'base',
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
        uniqueFields: ['name'],
        version: 1,
    };

    type CreateExampleInput = Omit<ExampleModel, 'id'|'created'|'updated'>;
    type UpdateExampleInput = Omit<ExampleModel, 'created'|'updated'>;

    const base = new Base<ExampleModel, CreateExampleInput, UpdateExampleInput>(client, {
        namespace: 'test',
        storeOptions: {
            bulkMaxSize: 50,
            bulkMaxWait: 300,
        }
    }, baseConfig);

    beforeAll(async () => {
        await cleanupIndex(base);
        return base.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(base);
        return base.shutdown();
    });

    describe('when creating a record', () => {
        let created: ExampleModel;
        let fetched: DataEntity<ExampleModel>;

        beforeAll(async () => {
            created = await base.create({
                name: 'Billy'
            });

            fetched = await base.findById(created.id);
        });

        it('should have created the record', () => {
            expect(created).toEqual(fetched);
        });

        it('should not be able to create the record again due to conflicts', async () => {
            expect.hasAssertions();

            try {
                await base.create(created);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(409);
                expect(err.message).toEqual('Create requires name to be unique');
            }
        });

        it('should not be able to create the record without a name', async () => {
            expect.hasAssertions();

            try {
                // @ts-ignore
                await base.create({});
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(422);
                expect(err.message).toEqual('Create requires field name');
            }
        });

        it('should not be able to update with a different name', async () => {
            expect.hasAssertions();

            const name = 'fooooobarrr';
            await base.create({
                name
            });

            try {
                await base.update({
                    ...created,
                    name
                });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(409);
                expect(err.message).toEqual('Update requires name to be unique');
            }
        });

        it('should have the required properties', () => {
            expect(fetched).toHaveProperty('id');
            expect(fetched).toHaveProperty('updated');
            expect(fetched).toHaveProperty('created');
        });

        it('should be able to find by name since it is treated a name', async () => {
            const result = await base.findByAnyId('Billy');
            expect(result).toEqual(fetched);
        });

        it('should not be able to find by name an incorrect name', async () => {
            expect.hasAssertions();

            try {
                await base.findByAnyId('WrongBilly');
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toEqual('Unable to find Base by \'id:"WrongBilly" OR name:"WrongBilly"\'');
                expect(err.statusCode).toEqual(404);
            }
        });

        it('should be able to update the record', async () => {
            const updateInput = { ...fetched, name: 'Hello' } as UpdateExampleInput;

            const updateResult = await base.update(updateInput);
            expect(updateResult).not.toBe(updateInput);

            const result = await base.findById(fetched.id);
            expect(result).toHaveProperty('name', 'Hello');

            expect(new Date(result.updated)).toBeAfter(new Date(fetched.updated));
        });

        it('should be able to delete the record', async () => {
            await base.deleteById(fetched.id);

            return expect(base.findById(fetched.id))
                .rejects.toThrowError(/Not Found/);
        });
    });

    describe('when finding mulitple records', () => {
        beforeAll(async () => {
            await Promise.all(times(5, (n) => {
                return base.create({
                    name: `Joe ${n}`
                });
            }));

            await Promise.all(times(5, (n) => {
                return base.create({
                    name: `Bob ${n}`
                });
            }));
        });

        it('should be able to find all of the Bobs', async () => {
            const result = await base.find('name:Bob*', 6);

            expect(result).toBeArrayOfSize(5);
            for (const record of result) {
                expect(record).toHaveProperty('id');
                expect(record).toHaveProperty('created');
                expect(record).toHaveProperty('updated');
                expect(record.name).toStartWith('Bob');
            }
        });

        it('should be able to find all of the Joes', async () => {
            const result = await base.find('name:Joe*', 6);

            expect(result).toBeArrayOfSize(5);

            for (const record of result) {
                expect(record).toHaveProperty('id');
                expect(record).toHaveProperty('created');
                expect(record).toHaveProperty('updated');
                expect(record.name).toStartWith('Joe');
            }
        });

        it('should be able to find 2 of the Joes', async () => {
            const result = await base.find('name:Joe*', 2);

            expect(result).toBeArrayOfSize(2);

            for (const record of result) {
                expect(record.name).toStartWith('Joe');
            }
        });

        it('should be able to sort by name', async () => {
            const result = await base.find('name:(Bob* OR Joe*)', 11, [], 'name:asc');

            expect(result).toBeArrayOfSize(10);

            result.forEach((record, index) => {
                if (index < 5) {
                    expect(record.name).toEqual(`Bob ${index}`);
                } else {
                    expect(record.name).toEqual(`Joe ${index - 5}`);
                }
            });
        });

        it('should be able to limit the fields returned', async () => {
            const result = await base.find('name:Joe*', 1, ['name']);

            expect(result).toBeArrayOfSize(1);

            for (const record of result) {
                expect(record).not.toHaveProperty('id');
                expect(record).not.toHaveProperty('created');
                expect(record).not.toHaveProperty('updated');
                expect(record.name).toStartWith('Joe');
            }
        });

        it('should be able to find no Ninjas', async () => {
            const result = await base.find('name:"Ninja"', 2);

            expect(result).toBeArrayOfSize(0);
        });
    });
});
