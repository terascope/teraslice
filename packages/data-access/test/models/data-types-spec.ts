import 'jest-extended';
import { DataTypes } from '../../src/models/data-types';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

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
        it('should be able to create/update and find a data type', async () => {
            const created = await dataTypes.create({
                client_id: 1,
                name: 'hello',
                type_config: {
                    location: 'geo',
                    some_date: 'date',
                    'foo.bar': 'ip',
                },
            });

            await dataTypes.update({
                id: created.id,
                type_config: {
                    location: 'geo',
                    // make sure a dot notated field can be set
                    'foo.bar': 'ip',
                },
            });

            const fetched = await dataTypes.findById(created.id);

            // ignore the updated timestamp and type config
            const { updated: __, type_config: ___, ..._created } = created;
            const { updated: ____, type_config: _____, ..._fetched } = fetched;
            expect(_created).toEqual(_fetched);

            // ensure the type config was created/updated corectly
            expect(created.type_config).toHaveProperty('location', 'geo');
            expect(fetched.type_config).toHaveProperty('location', 'geo');
            expect(created.type_config).toHaveProperty('some_date', 'date');
            expect(fetched.type_config).not.toHaveProperty('some_date', 'date');
            expect(created.type_config).toContainEntry(['foo.bar', 'ip']);
            expect(fetched.type_config).toContainEntry(['foo.bar', 'ip']);
        });
    });
});
