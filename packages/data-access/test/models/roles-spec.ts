import 'jest-extended';
import { Roles } from '../../src/models/roles';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Roles', () => {
    const client = makeClient();
    const roles = new Roles(client, {
        namespace: 'test'
    });

    beforeAll(async () => {
        await cleanupIndex(roles);
        return roles.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(roles);
        return roles.shutdown();
    });

    describe('when testing role creation', () => {
        it('should be able to create a role', async () => {
            const created = await roles.create({
                client_id: 1,
                name: 'hello',
            });

            const fetched = await roles.findById(created.id);

            expect(created).toEqual(fetched);
        });
    });
});
