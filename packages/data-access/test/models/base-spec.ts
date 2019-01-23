import 'jest-extended';
import { DataEntity, times } from '@terascope/utils';
import { Base, BaseModel } from '../../src/models/base';
import { makeClient } from '../helpers/elasticsearch';

describe('Base', () => {
    interface ExampleModel extends BaseModel {
        name: string;
    }

    const client = makeClient();

    const mapping = {
        _all: {
            enabled: false
        },
        dynamic: false,
        properties: {
            id: {
                type: 'keyword'
            },
            name: {
                type: 'keyword'
            },
            created: {
                type: 'date'
            },
            updated: {
                type: 'date'
            }
        }
    };

    const base = new Base<ExampleModel>(client, {
        name: 'base',
        namespace: 'test',
        indexSchema: {
            mapping,
            version: 1,
            strict: true,
        },
        version: 1,
        bulkMaxSize: 50,
        bulkMaxWait: 300,
    });

    beforeAll(async () => {
        await client.indices.delete({
            index: base.store.indexQuery,
        }).catch(() => {});

        return base.initialize();
    });

    afterAll(async () => {
        await client.indices.delete({
            index: base.store.indexQuery,
        }).catch(() => {});

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

        it('should have the required properties', () => {
            expect(fetched).toHaveProperty('id');
            expect(fetched).toHaveProperty('updated');
            expect(fetched).toHaveProperty('created');
        });

        it('should be able to update the record', async () => {
            await base.update(Object.assign({}, fetched, { name: 'Hello' }));

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
            await Promise.all(times(5, () => {
                return base.create({
                    name: 'Joe'
                });
            }));

            await Promise.all(times(5, () => {
                return base.create({
                    name: 'Bob'
                });
            }));
        });

        it('should be able to find all of the Bobs', async () => {
            const result = await base.find('name:"Bob"');

            expect(result).toBeArrayOfSize(5);
            for (const record of result) {
                expect(record).toHaveProperty('id');
                expect(record).toHaveProperty('created');
                expect(record).toHaveProperty('updated');
                expect(record).toHaveProperty('name', 'Bob');
            }
        });

        it('should be able to find all of the Joes', async () => {
            const result = await base.find('name:"Joe"');

            expect(result).toBeArrayOfSize(5);

            for (const record of result) {
                expect(record).toHaveProperty('id');
                expect(record).toHaveProperty('created');
                expect(record).toHaveProperty('updated');
                expect(record).toHaveProperty('name', 'Joe');
            }
        });

        it('should be able to find 2 of the Joes', async () => {
            const result = await base.find('name:"Joe"', 2);

            expect(result).toBeArrayOfSize(2);

            for (const record of result) {
                expect(record).toHaveProperty('name', 'Joe');
            }
        });

        it('should be able to sort by name', async () => {
            const result = await base.find('name:("Bob" OR "Joe")', 10, [], 'name:asc');

            expect(result).toBeArrayOfSize(10);

            result.forEach((record, index) => {
                if (index < 5) {
                    expect(record).toHaveProperty('name', 'Bob');
                } else {
                    expect(record).toHaveProperty('name', 'Joe');
                }
            });
        });

        it('should be able to limit the fields returned', async () => {
            const result = await base.find('name:"Joe"', 1, ['name']);

            expect(result).toBeArrayOfSize(1);

            for (const record of result) {
                expect(record).not.toHaveProperty('id');
                expect(record).not.toHaveProperty('created');
                expect(record).not.toHaveProperty('updated');
                expect(record).toHaveProperty('name', 'Joe');
            }
        });

        it('should be able to find no Ninjas', async () => {
            const result = await base.find('name:"Ninja"', 2);

            expect(result).toBeArrayOfSize(0);
        });
    });
});
