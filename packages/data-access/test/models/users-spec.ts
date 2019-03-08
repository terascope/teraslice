import 'jest-extended';
import nanoid from 'nanoid';
import { TSError, DataEntity } from '@terascope/utils';
import { Users, PrivateUserModel } from '../../src/models/users';
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
        let password = 'secret-password';

        let created: PrivateUserModel;

        beforeAll(async () => {
            created = await users.createWithPassword({
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

        it('should return private field when creating user', () => {
            expect(created).toHaveProperty('api_token');
            expect(created).toHaveProperty('hash');
            expect(created).toHaveProperty('salt');
        });

        it('should be able fetch the user by id', async () => {
            const fetched = await users.findById(created.id);

            expect(created).toMatchObject(fetched);
            expect(fetched).not.toHaveProperty('api_token');
            expect(fetched).not.toHaveProperty('hash');
            expect(fetched).not.toHaveProperty('salt');
        });

        it('should be able fetch the user by any id', async () => {
            const fetched = await users.findByAnyId(created.username);

            expect(created).toMatchObject(fetched);
            expect(fetched).not.toHaveProperty('api_token');
            expect(fetched).not.toHaveProperty('hash');
            expect(fetched).not.toHaveProperty('salt');
        });

        it('should be able find all by ids', async () => {
            const result = await users.findAll([created.id]);

            expect(result).toBeArrayOfSize(1);

            for (const fetched of result) {
                expect(fetched).not.toHaveProperty('api_token');
                expect(fetched).not.toHaveProperty('hash');
                expect(fetched).not.toHaveProperty('salt');
            }
        });

        it('should be able to omit private fields', () => {
            const createdMetadata = DataEntity.getMetadata(created);
            expect(createdMetadata).not.toBeNil();

            const omitted = users.omitPrivateFields(created);

            expect(omitted).not.toBe(created);
            expect(DataEntity.isDataEntity(omitted)).toBeTrue();

            const ommittedMetadata = DataEntity.getMetadata(omitted);
            expect(ommittedMetadata).not.toBeNil();
            expect(ommittedMetadata).toEqual(createdMetadata);

            expect(omitted).not.toHaveProperty('api_token');
            expect(omitted).not.toHaveProperty('hash');
            expect(omitted).not.toHaveProperty('salt');
        });

        it('should be able to update the api_token', async () => {
            const current = await users.authenticateWithToken(created.api_token);
            const newToken = await users.updateToken(username);
            const updated = await users.authenticateWithToken(newToken);

            expect(updated.hash).toEqual(current.hash);
            expect(updated.salt).toEqual(current.salt);
            expect(updated.api_token).not.toEqual(current.api_token);
            expect(updated.api_token).toEqual(newToken);
        });

        it('should be able to update the password', async () => {
            const current = await users.authenticate(username, password);

            const newPassword = 'secret-password-2';
            await users.updatePassword(username, newPassword);
            password = newPassword;

            const updated = await users.authenticate(username, password);

            expect(updated.hash).not.toEqual(current.hash);
            expect(updated.salt).not.toEqual(current.salt);
            expect(updated.api_token).toEqual(current.api_token);
        });

        describe('when given the correct password', () => {
            it('should be able to authenticate the user', async () => {
                const result = await users.authenticate(username, password);
                expect(result).toMatchObject({
                    username,
                });
            });
        });

        describe('when given an incorrect password', () => {
            it('should NOT be able to authenticate the user', async () => {
                expect.hasAssertions();
                try {
                    await users.authenticate('wrong-username', password);
                } catch (err) {
                    expect(err.message).toEqual('Unable to authenticate user');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toBe(403);
                }
            });
        });

        describe('when given an incorrect username', () => {
            it('should NOT be able to authenticate the user', async () => {
                expect.hasAssertions();
                try {
                    await users.authenticate(username, 'wrong-password');
                } catch (err) {
                    expect(err.message).toEqual('Unable to authenticate user with credentials');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toBe(403);
                }
            });
        });

        describe('when given an incorrect api_token', () => {
            it('should NOT be able to authenticate the user', async () => {
                expect.hasAssertions();
                try {
                    await users.authenticateWithToken('wrong-api-token');
                } catch (err) {
                    expect(err.message).toEqual('Unable to authenticate user with api token');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toBe(403);
                }
            });
        });
    });

    describe('when using a legacy user', () => {
        describe('when a role exists not roles', () => {
            const username = 'legacy-user';
            const id = nanoid();
            const roleId = 'foobar-role-id';

            beforeAll(async () => {
                await users.store.client.index({
                    id,
                    index: users.store.indexQuery,
                    refresh: true,
                    type: 'users',
                    body: {
                        id,
                        username,
                        email: 'legacy.foobar@example.com',
                        firstname: 'Legacy',
                        lastname: 'FooBar',
                        client_id: 235,
                        role: roleId,
                        created: new Date(),
                        updated: new Date(),
                    }
                });
            });

            it('should be able fetch the user', async () => {
                const fetched = await users.findById(id);

                expect(fetched).not.toHaveProperty('role');
                expect(fetched.roles).toEqual([
                    roleId
                ]);
            });

            it('should be fixed when updating it', async () => {
                const prefetched = await users.store.client.get<PrivateUserModel>({
                    id,
                    index: users.store.indexQuery,
                    type: 'users'
                });

                expect(prefetched._source).toHaveProperty('role', roleId);
                expect(prefetched._source).not.toHaveProperty('roles');

                await users.update({
                    id,
                    username,
                    // @ts-ignore
                    role: roleId
                });

                const fetched = await users.store.client.get<PrivateUserModel>({
                    id,
                    index: users.store.indexQuery,
                    type: 'users'
                });

                expect(fetched._source.roles).toEqual([
                    roleId
                ]);
            });
        });
    });

    describe('when testing user validation', () => {
        describe('when adding multiple roles', () => {
            it('should throw a validation error', async () => {
                expect.hasAssertions();

                try {
                    await users.createWithPassword({
                        username: 'coolbeans',
                        firstname: 'Cool',
                        lastname: 'Beans',
                        email: 'cool.beans@example.com',
                        client_id: 123,
                        // @ts-ignore
                        roles: [
                            'example-role-id-2',
                            'example-role-id',
                        ]
                    }, 'supersecret');
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.message).toEqual('.roles should NOT have more than 1 items');
                    expect(err.statusCode).toEqual(422);
                }
            });
        });

        describe('when adding an invalid email address', () => {
            it('should throw a validation error', async () => {
                expect.hasAssertions();

                try {
                    await users.createWithPassword({
                        username: 'coolbeans',
                        firstname: 'Cool',
                        lastname: 'Beans',
                        email: 'cool.beans',
                        client_id: 123,
                        roles: [
                            'example-role-id',
                        ]
                    }, 'supersecret');
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.message).toEqual('.email should match format \"email\"');
                    expect(err.statusCode).toEqual(422);
                }
            });
        });

        describe('when adding a messy email address', () => {
            it('should trim and to lower the email address', async () => {
                const result = await users.createWithPassword({
                    username: 'coolbeans',
                    firstname: 'Cool',
                    lastname: 'Beans',
                    email: ' cool.BEANS@example.com ',
                    client_id: 123,
                    roles: [
                        'example-role-id',
                    ]
                }, 'supersecret');

                expect(result.email).toEqual('cool.beans@example.com');
            });
        });
    });
});
