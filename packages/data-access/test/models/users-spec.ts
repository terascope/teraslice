import 'jest-extended';
import { TSError } from '@terascope/utils';
import { QueryAccess } from 'xlucene-evaluator';
import { Users, User } from '../../src/models/users';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Users', () => {
    const client = makeClient();
    const users = new Users(client, {
        namespace: 'test',
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

        let created: User;

        beforeAll(async () => {
            created = await users.createWithPassword(
                {
                    username,
                    firstname: 'Billy',
                    lastname: 'Joe',
                    email: 'billy.joe@example.com',
                    client_id: 123,
                    role: 'example-role-id',
                },
                password
            );
        });

        it('should return private field when creating user', () => {
            expect(created).toHaveProperty('api_token');
            expect(created).toHaveProperty('hash');
            expect(created).toHaveProperty('salt');
            expect(created).toHaveProperty('type', 'USER');
        });

        it('should create a properly formatted token', () => {
            expect(created.api_token).toHaveLength(40);
            expect(created.api_token).toMatch(/^[a-fA-F0-9_]*$/);
        });

        it('should be able fetch the user by id', async () => {
            const queryAccess = new QueryAccess({
                excludes: ['api_token', 'hash', 'salt'],
            });

            const fetched = await users.findById(created.id, queryAccess);

            expect(created).toMatchObject(fetched);
            expect(fetched).not.toHaveProperty('api_token');
            expect(fetched).not.toHaveProperty('hash');
            expect(fetched).not.toHaveProperty('salt');
        });

        it('should be able fetch the user by any id', async () => {
            const queryAccess = new QueryAccess({
                excludes: ['hash', 'salt'],
            });
            const fetched = await users.findByAnyId(created.username, queryAccess);

            expect(created).toMatchObject(fetched);
            expect(fetched).toHaveProperty('api_token');
            expect(fetched).not.toHaveProperty('hash');
            expect(fetched).not.toHaveProperty('salt');
        });

        it('should be able find all by ids', async () => {
            const queryAccess = new QueryAccess({
                excludes: ['api_token', 'hash', 'salt'],
            });
            const result = await users.findAll([created.id], queryAccess);

            expect(result).toBeArrayOfSize(1);

            for (const fetched of result) {
                expect(fetched).not.toHaveProperty('api_token');
                expect(fetched).not.toHaveProperty('hash');
                expect(fetched).not.toHaveProperty('salt');
            }
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
                    await users.authenticateWithToken('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
                } catch (err) {
                    expect(err.message).toEqual('Unable to authenticate user with api token');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toBe(403);
                }
            });
        });

        describe('when authenticating an invalid token', () => {
            it('should NOT be authenticate with wildcard query', async () => {
                expect.hasAssertions();
                try {
                    await users.authenticateWithToken('?aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa*');
                } catch (err) {
                    expect(err.message).toEqual('Unable to authenticate user with api token');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toBe(403);
                }
            });

            it('should NOT be authenticate with a invalid length query', async () => {
                expect.hasAssertions();
                try {
                    await users.authenticateWithToken('wrong');
                } catch (err) {
                    expect(err.message).toEqual('Unable to authenticate user with api token');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toBe(403);
                }
            });

            it('should NOT be authenticate using query injection', async () => {
                expect.hasAssertions();
                try {
                    await users.authenticateWithToken('aaaaaaaaaaaaaaaa" OR token:* OR token:"a');
                } catch (err) {
                    expect(err.message).toEqual('Unable to authenticate user with api token');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toBe(403);
                }
            });
        });
    });

    describe('when testing user validation', () => {
        describe('when adding an invalid email address', () => {
            it('should throw a validation error', async () => {
                expect.hasAssertions();

                try {
                    await users.createWithPassword(
                        {
                            username: 'coolbeans-1',
                            firstname: 'Cool',
                            lastname: 'Beans',
                            email: 'cool.beans',
                            client_id: 123,
                            role: 'example-role-id',
                        },
                        'supersecret'
                    );
                } catch (err) {
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.message).toEqual('.email should match format "email"');
                    expect(err.statusCode).toEqual(422);
                }
            });
        });

        describe('when adding a messy email address', () => {
            it('should trim and to lower the email address', async () => {
                const result = await users.createWithPassword(
                    {
                        username: 'coolbeans-2',
                        firstname: 'Cool',
                        lastname: 'Beans',
                        email: ' cool.BEANS@example.com ',
                        client_id: 123,
                        role: 'example-role-id',
                    },
                    'supersecret'
                );

                expect(result.email).toEqual('cool.beans@example.com');
            });
        });
    });
});
