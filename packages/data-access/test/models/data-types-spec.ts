import 'jest-extended';
import { DataTypes } from '../../src/models/data-types';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('DataTypes', () => {
    const client = makeClient();
    const dataTypes = new DataTypes(client, {
        namespace: 'test'
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
            const created = await dataTypes.create({
                name: 'hello',
                typeConfig: {}
            });

            const fetched = await dataTypes.findById(created.id);

            expect(created).toEqual(fetched);
        });
    });
});
