import 'jest-extended';
import { TSError } from '@terascope/utils';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import { ACLManager, User } from '../src';

describe('ACLManager Permissions', () => {
    const client = makeClient();
    const manager = new ACLManager(client, { namespace: 'test_manager_permissions' });
    let superAdminUser: User;
    let adminUser: User;
    let normalUser: User;
    let otherUser: User;
    let foreignUser: User;
    let foreignAdminUser: User;

    beforeAll(async () => {
        await cleanupIndexes(manager);
        await manager.initialize();
        const users = await Promise.all([
            manager.createUser({
                user: {
                    username: 'super-admin',
                    email: 'super-admin@example.com',
                    firstname: 'Super',
                    lastname: 'Admin',
                    type: 'SUPERADMIN',
                    client_id: 0,
                },
                password: 'password'
            }),
            manager.createUser({
                user: {
                    username: 'admin-admin',
                    email: 'admin-admin@example.com',
                    firstname: 'Admin',
                    lastname: 'Admin',
                    type: 'ADMIN',
                    client_id: 1,
                },
                password: 'password'
            }),
            manager.createUser({
                user: {
                    username: 'user-user',
                    email: 'user-user@example.com',
                    firstname: 'User',
                    lastname: 'User',
                    type: 'USER',
                    client_id: 1,
                },
                password: 'password'
            }),
            manager.createUser({
                user: {
                    username: 'other-user',
                    email: 'other-user@example.com',
                    firstname: 'Other',
                    lastname: 'User',
                    type: 'USER',
                    client_id: 1,
                },
                password: 'password'
            }),
            manager.createUser({
                user: {
                    username: 'foreign-user',
                    email: 'foreign-user@example.com',
                    firstname: 'Foreign',
                    lastname: 'User',
                    type: 'USER',
                    client_id: 2,
                },
                password: 'password'
            }),
            manager.createUser({
                user: {
                    username: 'foreign-admin',
                    email: 'foreign-admin@example.com',
                    firstname: 'Foreign',
                    lastname: 'Admin',
                    type: 'ADMIN',
                    client_id: 2,
                },
                password: 'password'
            })
        ]);
        ([
            superAdminUser,
            adminUser,
            normalUser,
            otherUser,
            foreignUser,
            foreignAdminUser,
        ] = users);
    });

    afterAll(async () => {
        await cleanupIndexes(manager);
        return manager.shutdown();
    });

    describe('when authenticating the user', () => {
        it('should be able to authenticate with a username and password', async () => {
            const result = await manager.authenticateUser({ username: normalUser.username, password: 'password' });
            expect(result.id).toEqual(normalUser.id);
        });

        it('should be able to authenticate user with an api_token', async () => {
            const result = await manager.authenticateUser({ api_token: normalUser.api_token });
            expect(result.id).toEqual(normalUser.id);
        });

        it('should be able to authenticate with an api_token', async () => {
            const result = await manager.authenticateWithToken({ api_token: normalUser.api_token });
            expect(result.id).toEqual(normalUser.id);
        });

        it('should throw without credentials', async () => {
            expect.hasAssertions();

            try {
                await manager.authenticateUser({ });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing user authentication fields, username, password, or api_token');
                expect(err.statusCode).toEqual(401);
            }
        });
    });

    describe('when finding a user', () => {
        it('should be able to find the authenticated user', async () => {
            const result = await manager.findUser({ id: normalUser.id }, normalUser);
            expect(result.id).toEqual(normalUser.id);
            expect(result).toHaveProperty('api_token');
        });

        it('should be able to find the other user as ADMIN', async () => {
            const result = await manager.findUser({ id: otherUser.id }, adminUser);
            expect(result.id).toEqual(otherUser.id);
            expect(result).toHaveProperty('api_token');
        });

        it('should NOT be able to see the private properties if other USER', async () => {
            const result = await manager.findUser({ id: normalUser.id }, otherUser);
            expect(result.id).toEqual(normalUser.id);
            expect(result).not.toHaveProperty('api_token');
        });

        it('should throw a 404 if looking for a USER from another client', async () => {
            expect.hasAssertions();

            try {
                await manager.findUser({ id: foreignUser.id }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Unable to find User');
                expect(err.statusCode).toEqual(404);
            }
        });
    });

    describe('when finding users', () => {
        it('should be able to find users without tokens of the same client as USER', async () => {
            const result = await manager.findUsers({ query: '*' }, normalUser);
            expect(result).toBeArray();
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).not.toHaveProperty('api_token');
        });

        it('should be able to find users with tokens of the same client as ADMIN', async () => {
            const result = await manager.findUsers({ query: '*' }, adminUser);
            expect(result).toBeArray();
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('api_token');
        });

        it('should NOT be able to find users from another client as USER', async () => {
            const result = await manager.findUsers({ query: 'NOT firstname:Foreign' }, foreignUser);
            expect(result).toBeArrayOfSize(0);
        });

        it('should NOT be able to find users from another client as ADMIN', async () => {
            const result = await manager.findUsers({ query: 'NOT firstname:Foreign' }, foreignAdminUser);
            expect(result).toBeArrayOfSize(0);
        });

        it('should be able to find users from another client as SUPERADMIN', async () => {
            const result = await manager.findUsers({ query: '*' }, superAdminUser);
            expect(result).toBeArray();
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('api_token');
        });
    });

    describe('when creating a user as ADMIN', () => {
        it('should throw if not under the same client_id', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser({
                    user: {
                        username: 'foreign-user-2',
                        email: 'foreign-user-2@example.com',
                        firstname: 'Foreign',
                        lastname: 'User 2',
                        type: 'USER',
                        client_id: 2,
                    },
                    password: 'password'
                }, adminUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to write to users outside of the their client id');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when creating a user as USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser({
                    user: {
                        username: 'user-2',
                        email: 'user-2@example.com',
                        firstname: 'User',
                        lastname: 'User 2',
                        type: 'USER',
                        client_id: 1,
                    },
                    password: 'password'
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to write to other users');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when updating another user as USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser({
                    user: {
                        id: otherUser.id,
                        username: 'other-user',
                    },
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to write to other users');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when updating another user\'s password as USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.updatePassword({
                    id: otherUser.id,
                    password: 'other-user',
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to write to other users');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when updating another user\'s token as USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.updateToken({
                    id: otherUser.id,
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to write to other users');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when updating one of your USERs as an AMDIN', () => {
        it('should succeed', async () => {
            await manager.updateUser({
                user: {
                    id: otherUser.id,
                    firstname: 'Otherrr'
                },
            }, adminUser);
        });
    });

    describe('when updating a foreign USER as an AMDIN', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser({
                    user: {
                        id: foreignUser.id,
                        firstname: 'Foreign'
                    },
                }, adminUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to write to users outside of the their client id');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when updating a USER\'s own record', () => {
        it('should succeed', async () => {
            await manager.updateUser({
                user: {
                    id: otherUser.id,
                    firstname: 'Otherr'
                },
            }, otherUser);
        });
    });

    describe('when updating a USER\'s own password', () => {
        it('should succeed', async () => {
            await manager.updatePassword({
                id: otherUser.id,
                password: 'password'
            }, otherUser);
        });
    });

    describe('when updating a USER\'s own api token', () => {
        it('should succeed', async () => {
            await manager.updateToken({
                id: otherUser.id,
            }, otherUser);
        });
    });

    describe('when removing a user as USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.removeUser({
                    id: otherUser.id,
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to write to other users');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when creating a role as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.createRole({
                    role: {
                        name: 'SomeExampleRole'
                    }
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to create roles');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when removing a role as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.removeRole({
                    id: 'random-id'
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to remove roles');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when creating a role as a ADMIN', () => {
        it('should succeed', async () => {
            await manager.createRole({
                role: {
                    name: 'SomeRandomExampleRole'
                }
            }, adminUser);
        });
    });

    describe('when updating a role as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.updateRole({
                    role: {
                        id: 'random-id',
                    }
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to update roles');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when creating a data type as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.createDataType({
                    dataType: {
                        name: 'SomeExampleDataType'
                    }
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to create data types');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when removing a data type as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.removeDataType({
                    id: 'random-id'
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to remove data types');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when updating a data type as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.updateDataType({
                    dataType: {
                        id: 'random-id',
                    }
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to update data types');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when creating a data type as a SUPERADMIN', () => {
        it('should succeed', async () => {
            await manager.createDataType({
                dataType: {
                    name: 'SomeRandomExampleDataType'
                }
            }, superAdminUser);
        });
    });

    describe('when creating a space as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace({
                    space: {
                        name: 'SomeExampleSpace',
                        endpoint: 'some-example-space',
                        data_type: 'random-id',
                        roles: [],
                        views: [],
                    }
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to create spaces');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when removing a space as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.removeSpace({
                    id: 'random-id'
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to remove spaces');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when removing a space as a ADMIN', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.removeSpace({
                    id: 'random-id'
                }, adminUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to remove spaces');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when creating a space as a ADMIN', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace({
                    space: {
                        name: 'SomeExampleSpace',
                        endpoint: 'some-example-space',
                        data_type: 'random-id',
                        roles: [],
                        views: [],
                    }
                }, adminUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to create spaces');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when updating a space as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.updateSpace({
                    space: {
                        id: 'random-id',
                    }
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to update spaces');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when creating a space as a SUPERADMIN', () => {
        let dataTypeId: string;

        beforeAll(async() => {
            const dataType = await manager.createDataType({
                dataType: {
                    name: 'CreateSpaceDataTypeTest',
                }
            }, superAdminUser);

            dataTypeId = dataType.id;
        });

        it('should succeed', async () => {
            await manager.createSpace({
                space: {
                    name: 'SomeRandomExampleSpace',
                    endpoint: 'some-random-example-space',
                    data_type: dataTypeId,
                    roles: [],
                    views: [],
                }
            }, superAdminUser);
        });
    });

    describe('when creating a view as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.createView({
                    view: {
                        name: 'SomeExampleDataType',
                        data_type: 'random-id',
                        roles: [],
                    }
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to create views');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when removing a views as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.removeView({
                    id: 'random-id'
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to remove views');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when updating a data type as a USER', () => {
        it('should throw a forbidden', async () => {
            expect.hasAssertions();

            try {
                await manager.updateView({
                    view: {
                        id: 'random-id',
                    }
                }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('User doesn\'t have permission to update views');
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when creating a view as a ADMIN', () => {
        let dataTypeId: string;

        beforeAll(async() => {
            const dataType = await manager.createDataType({
                dataType: {
                    name: 'CreateViewDataTypeTest',
                }
            }, superAdminUser);

            dataTypeId = dataType.id;
        });

        it('should succeed', async () => {
            await manager.createView({
                view: {
                    name: 'SomeRandomExampleView',
                    data_type: dataTypeId,
                    roles: [],
                }
            }, adminUser);
        });
    });
});
