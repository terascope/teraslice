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
                    version: 1,
                    fields: {
                        location: { type: 'Geo' },
                        some_date: { type: 'Date' },
                        'foo.bar': { type: 'IP' },
                    },
                },
            });

            await dataTypes.update({
                id: created.id,
                type_config: {
                    version: 1,
                    fields: {
                        location: { type: 'Geo' },
                        // make sure a dot notated field can be set
                        'foo.bar': { type: 'IP' },
                    },
                },
            });

            const fetched = await dataTypes.findById(created.id);

            // ignore the updated timestamp and type config
            const { updated: __, type_config: ___, ..._created } = created;
            const { updated: ____, type_config: _____, ..._fetched } = fetched;
            expect(_created).toEqual(_fetched);

            // ensure the type config was created/updated corectly
            expect(created.type_config.fields).toHaveProperty('location', { type: 'Geo' });
            expect(fetched.type_config.fields).toHaveProperty('location', { type: 'Geo' });
            expect(created.type_config.fields).toHaveProperty('some_date', { type: 'Date' });
            expect(fetched.type_config.fields).not.toHaveProperty('some_date', { type: 'Date' });
            expect(created.type_config.fields).toContainEntry(['foo.bar', { type: 'IP' }]);
            expect(fetched.type_config.fields).toContainEntry(['foo.bar', { type: 'IP' }]);
        });
    });
});
