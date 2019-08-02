import 'jest-extended';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';
import { TEST_INDEX_PREFIX } from '../helpers/config';
import { Roles } from '../../src/models/roles';

describe('Roles', () => {
    const client = makeClient();
    const roles = new Roles(client, {
        namespace: `${TEST_INDEX_PREFIX}da`,
    });

    beforeAll(async () => {
        await cleanupIndex(roles);
        return roles.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(roles);
        return roles.shutdown();
    });

    it('should be able to create a role', async () => {
        const created = await roles.create({
            client_id: 1,
            name: 'hello',
        });

        const fetched = await roles.findById(created.id);
        expect(created).toEqual(fetched);
    });
});
