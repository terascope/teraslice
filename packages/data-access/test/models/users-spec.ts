import 'jest-extended';
import { Users } from '../../src/models/users';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Users', () => {
    const client = makeClient();
    const users = new Users(client, {
        namespace: 'test'
    });

    beforeAll(async () => {
        await cleanupIndex(users);
        return users.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(users);
        return users.shutdown();
    });

    describe('when testing user creation', () => {
        it('should be able to create a user', async () => {
            const created = await users.create({
                username: 'billyjoe',
                firstname: 'Billy',
                lastname: 'Joe',
                email: 'billy.joe@example.com',
                client_id: 123,
                roles: [
                    'example-role-id'
                ]
            }, 'secret-password');

            const fetched = await users.findById(created.id);

            expect(created).toMatchObject(fetched);
            expect(created).toHaveProperty('api_token');
            expect(created).toHaveProperty('hash');
            expect(created).toHaveProperty('salt');
        });
    });
});
