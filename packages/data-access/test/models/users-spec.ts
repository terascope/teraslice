import 'jest-extended';
import { Users, UserModel } from '../../src/models/users';
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

    describe('when testing user access', () => {
        const username = 'billyjoe';
        const password = 'secret-password';

        let created: UserModel;

        beforeAll(async () => {
            created = await users.create({
                username,
                firstname: 'Billy',
                lastname: 'Joe',
                email: 'billy.joe@example.com',
                client_id: 123,
                roles: [
                    'example-role-id'
                ]
            }, password);
        });

        it('should be able fetch the user', async () => {
            const fetched = await users.findById(created.id);

            expect(created).toMatchObject(fetched);
            expect(created).toHaveProperty('api_token');
            expect(created).toHaveProperty('hash');
            expect(created).toHaveProperty('salt');
        });

        describe('when give the correct password', () => {
            it('should be able to authenticate the user', async () => {
                const result = await users.authenticate(username, password);
                expect(result).toBeTrue();
            });
        });

        describe('when give the incorrect password', () => {
            it('should NOT be able to authenticate the user', async () => {
                const result = await users.authenticate(username, 'wrong-password');
                expect(result).toBeFalse();
            });
        });
    });
});
