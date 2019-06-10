import 'jest-extended';
import { DataTypes } from '../../src/models/data-types';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';
import { TypeConfig } from 'xlucene-evaluator';

describe('DataTypes', () => {
    const client = makeClient();
    const dataTypes = new DataTypes(client, {
        namespace: 'test',
    });

    beforeAll(async () => {
        await cleanupIndex(dataTypes);
        return dataTypes.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(dataTypes);
        return dataTypes.shutdown();
    });

    describe('when testing data type creation', () => {
        it('should be able to create a data type', async () => {
            const typeConfig: TypeConfig = {};
            typeConfig['foo'] = 'geo';
            // we need to make sure we can set a dot notated field
            typeConfig['foo.bar'] = 'ip';

            const created = await dataTypes.create({
                client_id: 1,
                name: 'hello',
                type_config: typeConfig,
            });

            const fetched = await dataTypes.findById(created.id);

            expect(created).toEqual(fetched);
        });
    });
});
