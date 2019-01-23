import 'jest-extended';
import { DataEntity } from '@terascope/utils';
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
                name: 'Peter DeMartini'
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
    });
});
