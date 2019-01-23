import 'jest-extended';
import { Base, BaseModel } from '../../src/models/base';
import { makeClient } from '../helpers/elasticsearch';

describe('Base', () => {
    interface ExampleModel extends BaseModel {
        name: string;
    }

    const client = makeClient();

    const base = new Base<ExampleModel>(client, {
        name: 'base',
        namespace: 'test',
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
        let fetched: ExampleModel;

        beforeAll(async () => {
            created = await base.create({
                name: 'Peter DeMartini'
            });

            fetched = await base.findById(created.id);
        });

        it('should have created the record', () => {
            expect(created).toEqual(fetched);
        });
    });
});
