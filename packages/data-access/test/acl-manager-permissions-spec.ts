import 'jest-extended';
import { TSError } from '@terascope/utils';
import { LATEST_VERSION } from '@terascope/data-types';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import { ACLManager, User, DataType, Role } from '../src';
import { TEST_INDEX_PREFIX } from './helpers/config';

describe('ACLManager Permissions', () => {
    const client = makeClient();
    const manager = new ACLManager(client, { namespace: `${TEST_INDEX_PREFIX}acl_perm` });

    let someRole: Role;
    let superAdminUser: User;
    let adminUser: User;
    let otherAdminUser: User;
    let dataAdminUser: User;
    let normalUser: User;
    let otherUser: User;
    let foreignUser: User;
    let foreignAdminUser: User;
    let foreignDataAdminUser: User;
    let dataType: DataType;

    beforeAll(async () => {
        await cleanupIndexes(manager);
        await manager.initialize();

        someRole = await manager.createRole(
            {
                role: {
                    name: 'SomeRole',
                    client_id: 1,
                },
            },
            false
        );

        const users = await Promise.all([
            manager.createUser(
                {
                    user: {
                        username: 'super-admin',
                        email: 'super-admin@example.com',
                        firstname: 'Super',
                        lastname: 'Admin',
                        type: 'SUPERADMIN',
                        client_id: 0,
                    },
                    password: 'password',
                },
                false
            ),
            manager.createUser(
                {
                    user: {
                        username: 'admin-admin',
                        email: 'admin-admin@example.com',
                        firstname: 'Main',
                        lastname: 'Admin',
                        type: 'ADMIN',
                        client_id: 1,
                    },
                    password: 'password',
                },
                false
            ),
            manager.createUser(
                {
                    user: {
                        username: 'other-admin',
                        email: 'other-admin@example.com',
                        firstname: 'Other',
                        lastname: 'Admin',
                        type: 'ADMIN',
                        client_id: 1,
                    },
                    password: 'password',
                },
                false
            ),
            manager.createUser(
                {
                    user: {
                        username: 'dataadmin',
                        email: 'dataadmin@example.com',
                        firstname: 'Main',
                        lastname: 'DataAdmin',
                        type: 'DATAADMIN',
                        client_id: 1,
                    },
                    password: 'password',
                },
                false
            ),
            manager.createUser(
                {
                    user: {
                        username: 'user-user',
                        email: 'user-user@example.com',
                        firstname: 'Main',
                        lastname: 'User',
                        type: 'USER',
                        client_id: 1,
                    },
                    password: 'password',
                },
                false
            ),
            manager.createUser(
                {
                    user: {
                        username: 'other-user',
                        email: 'other-user@example.com',
                        firstname: 'Other',
                        lastname: 'User',
                        type: 'USER',
                        client_id: 1,
                    },
                    password: 'password',
                },
                false
            ),
            manager.createUser(
                {
                    user: {
                        username: 'foreign-user',
                        email: 'foreign-user@example.com',
                        firstname: 'Foreign',
                        lastname: 'User',
                        type: 'USER',
                        client_id: 2,
                    },
                    password: 'password',
                },
                false
            ),
            manager.createUser(
                {
                    user: {
                        username: 'foreign-admin',
                        email: 'foreign-admin@example.com',
                        firstname: 'Foreign',
                        lastname: 'Admin',
                        type: 'ADMIN',
                        client_id: 2,
                    },
                    password: 'password',
                },
                false
            ),
            manager.createUser(
                {
                    user: {
                        username: 'foreign-dataadmin',
                        email: 'foreign-dataadmin@example.com',
                        firstname: 'Foreign',
                        lastname: 'DataAdmin',
                        type: 'DATAADMIN',
                        client_id: 2,
                    },
                    password: 'password',
                },
                false
            ),
        ]);

        [
            superAdminUser,
            adminUser,
            otherAdminUser,
            dataAdminUser,
            normalUser,
            otherUser,
            foreignUser,
            foreignAdminUser,
            foreignDataAdminUser,
        ] = users;

        dataType = await manager.createDataType(
            {
                dataType: {
                    client_id: 1,
                    name: 'SomeTestDataType',
                    config: {
                        fields: {
                            hello: { type: 'Keyword' },
                        },
                        version: LATEST_VERSION,
                    },
                },
            },
            superAdminUser
        );
    });

    afterAll(async () => {
        await cleanupIndexes(manager);
        return manager.shutdown();
    });

    describe('when acting as a SUPERADMIN', () => {
        it('should be able to find users from another client', async () => {
            const result = await manager.findUsers({}, superAdminUser);
            expect(result).toBeArray();
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('api_token');
        });

        it('should be able to create a data type', async () => {
            await manager.createDataType(
                {
                    dataType: {
                        client_id: 1,
                        name: 'SomeRandomExampleDataType',
                        config: {
                            fields: {
                                hello: { type: 'Keyword' },
                            },
                            version: LATEST_VERSION,
                        },
                    },
                },
                superAdminUser
            );
        });

        it('should be able to create space', async () => {
            await manager.createSpace(
                {
                    space: {
                        type: 'SEARCH',
                        client_id: 1,
                        name: 'SomeRandomExampleSpace',
                        endpoint: 'some-random-example-space',
                        data_type: dataType.id,
                        roles: [],
                        views: [],
                    },
                },
                superAdminUser
            );
        });
    });

    describe('when acting as a ADMIN', () => {
        it('should be able to find the other user', async () => {
            const result = await manager.findUser({ id: otherUser.id }, adminUser);
            expect(result.id).toEqual(otherUser.id);
            expect(result).toHaveProperty('api_token');
        });

        it('should be able to find users with tokens of the same client', async () => {
            const result = await manager.findUsers({}, adminUser);
            expect(result).toBeArray();
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('api_token');
        });

        it('should NOT be able to find users from another client', async () => {
            const result = await manager.findUsers({ query: 'NOT firstname:Foreign' }, foreignAdminUser);
            expect(result).toBeArrayOfSize(0);
        });

        it('should NOT be able to create a user for a different client', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser(
                    {
                        user: {
                            username: 'foreign-user-2',
                            email: 'foreign-user-2@example.com',
                            firstname: 'Foreign',
                            lastname: 'User 2',
                            type: 'USER',
                            client_id: 2,
                        },
                        password: 'password',
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to users outside of the their client id");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should be able to update another user', async () => {
            await manager.updateUser(
                {
                    user: {
                        id: otherUser.id,
                        firstname: 'Otherrr',
                    },
                },
                adminUser
            );
        });

        it('should be allowed to update another users token by username', async () => {
            await manager.updateToken(
                {
                    id: otherUser.username,
                },
                adminUser
            );
        });

        it('should NOT be allowed to update a user from another client', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: foreignUser.id,
                            firstname: 'Foreign',
                        },
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to users outside of the their client id");
                expect(err.statusCode).toEqual(403);
            }
        });

        it("should NOT be able to elevate its own user's permission to SUPERADMIN", async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: adminUser.id,
                            type: 'SUPERADMIN',
                        },
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to elevate user to SUPERADMIN");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able be able to create a SUPERADMIN', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser(
                    {
                        user: {
                            username: 'test-superadmin',
                            firstname: 'test-superadmin',
                            lastname: 'test-superadmin',
                            type: 'SUPERADMIN',
                            client_id: 0,
                        },
                        password: 'password',
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to create user with type SUPERADMIN");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able be able to create a DATAADMIN', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser(
                    {
                        user: {
                            username: 'test-dataadmin',
                            firstname: 'test-dataadmin',
                            lastname: 'test-dataadmin',
                            type: 'DATAADMIN',
                            client_id: 0,
                        },
                        password: 'password',
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to create user with type DATAADMIN");
                expect(err.statusCode).toEqual(403);
            }
        });

        it("should NOT be able to elevate another user's permission to SUPERADMIN", async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: otherAdminUser.id,
                            type: 'SUPERADMIN',
                        },
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to elevate user to SUPERADMIN");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should be able to update the other admin to USER and then back to ADMIN via another user', async () => {
            await manager.updateUser(
                {
                    user: {
                        id: otherAdminUser.id,
                        type: 'USER',
                    },
                },
                otherAdminUser
            );

            await manager.updateUser(
                {
                    user: {
                        id: otherAdminUser.id,
                        type: 'ADMIN',
                    },
                },
                adminUser
            );
        });

        it('should NOT be able to change its client id', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: adminUser.id,
                            client_id: 3,
                        },
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to change client on user");
                expect(err.statusCode).toEqual(403);
            }
        });

        it("should NOT be able to change another admin's client id", async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: otherAdminUser.id,
                            client_id: 3,
                        },
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to change client on user");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should be able to create a role', async () => {
            await manager.createRole(
                {
                    role: {
                        client_id: 1,
                        name: 'SomeRandomExampleRole',
                    },
                },
                adminUser
            );
        });

        it('should be able to create a view', async () => {
            await manager.createView(
                {
                    view: {
                        client_id: 1,
                        name: 'SomeRandomExampleView',
                        data_type: dataType.id,
                        roles: [],
                    },
                },
                adminUser
            );
        });

        it('should NOT be allowed to remove a space', async () => {
            expect.hasAssertions();

            try {
                await manager.removeSpace(
                    {
                        id: 'random-id',
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to remove Space");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be allowed to create a space', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace(
                    {
                        space: {
                            type: 'SEARCH',
                            client_id: 1,
                            name: 'SomeExampleSpace',
                            endpoint: 'some-example-space',
                            data_type: 'random-id',
                            roles: [],
                            views: [],
                        },
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to create Space");
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when acting as a DATAADMIN', () => {
        it('should NOT be able to find the other user', async () => {
            expect.hasAssertions();

            try {
                await manager.findUser({ id: otherUser.id }, dataAdminUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Unable to find User');
                expect(err.statusCode).toEqual(404);
            }
        });

        it('should be able to find itself', async () => {
            return expect(manager.findUser({ id: dataAdminUser.id }, dataAdminUser)).resolves.toMatchObject({
                id: dataAdminUser.id,
                client_id: dataAdminUser.client_id,
            });
        });

        it('should NOT be able to find other users of the same client', async () => {
            const result = await manager.findUsers({ query: `NOT id:"${dataAdminUser.id}"` }, dataAdminUser);
            expect(result).toBeArrayOfSize(0);
        });

        it('should NOT be able to find other users of a different client', async () => {
            const result = await manager.findUsers({ query: 'NOT firstname:Foreign' }, foreignDataAdminUser);
            expect(result).toBeArrayOfSize(0);
        });

        it('should NOT be able to create a user', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser(
                    {
                        user: {
                            username: 'other-user-2',
                            email: 'other-user-2@example.com',
                            firstname: 'Other',
                            lastname: 'User 2',
                            type: 'USER',
                            client_id: 1,
                        },
                        password: 'password',
                    },
                    dataAdminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to other users");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to update another user', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: otherUser.id,
                            firstname: 'Otherrr',
                        },
                    },
                    dataAdminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to other users");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should be allowed to update itself', async () => {
            return expect(
                manager.updateToken(
                    {
                        id: dataAdminUser.id,
                    },
                    dataAdminUser
                )
            ).resolves.toBeString();
        });

        it('should NOT be allowed to update a user from another client', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: foreignUser.id,
                            firstname: 'Foreign',
                        },
                    },
                    adminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to users outside of the their client id");
                expect(err.statusCode).toEqual(403);
            }
        });

        it("should NOT be able to elevate its own user's permission to ADMIN", async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: dataAdminUser.id,
                            type: 'ADMIN',
                        },
                    },
                    dataAdminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to elevate user to ADMIN");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to change its client id', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: dataAdminUser.id,
                            client_id: 3,
                        },
                    },
                    dataAdminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to change client on user");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should be able allowed to find roles', async () => {
            const result = await manager.findRoles({ query: `name:"${someRole.name}"` }, dataAdminUser);
            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toHaveProperty('id', someRole.id);
        });

        it('should NOT be able to create a role', async () => {
            expect.hasAssertions();

            try {
                await manager.createRole(
                    {
                        role: {
                            client_id: 1,
                            name: 'IDKExampleRole',
                        },
                    },
                    dataAdminUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to create Role");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should be allowed to read/write to Views, DataTypes and Spaces', async () => {
            const { id: dataTypeId } = await manager.createDataType(
                {
                    dataType: {
                        client_id: 1,
                        name: 'IDKExampleDataType',
                        config: {
                            version: 1,
                            fields: {},
                        },
                    },
                },
                dataAdminUser
            );

            await expect(manager.findDataType({ id: dataTypeId }, dataAdminUser)).resolves.toMatchObject({
                id: dataTypeId,
            });

            const { id: spaceId } = await manager.createSpace(
                {
                    space: {
                        type: 'SEARCH',
                        client_id: 1,
                        name: 'IDKExampleSpace',
                        endpoint: 'idk-example-space',
                        data_type: dataTypeId,
                        roles: [],
                        views: [],
                    },
                },
                dataAdminUser
            );

            await expect(manager.findSpace({ id: spaceId }, dataAdminUser)).resolves.toMatchObject({
                id: spaceId,
            });

            const { id: viewId } = await manager.createView(
                {
                    view: {
                        client_id: 1,
                        name: 'IDKExampleView',
                        data_type: dataTypeId,
                        roles: [],
                        constraint: 'example:view',
                    },
                },
                dataAdminUser
            );

            await expect(manager.findView({ id: viewId }, dataAdminUser)).resolves.toMatchObject({
                id: viewId,
            });

            await manager.removeView(
                {
                    id: viewId,
                },
                dataAdminUser
            );

            await manager.removeSpace(
                {
                    id: spaceId,
                },
                dataAdminUser
            );

            await manager.removeDataType(
                {
                    id: dataTypeId,
                },
                dataAdminUser
            );
        });
    });

    describe('when acting as a USER', () => {
        it('should be able to find the authenticated user', async () => {
            const result = await manager.findUser({ id: normalUser.id }, normalUser);
            expect(result.id).toEqual(normalUser.id);
            expect(result).toHaveProperty('api_token');
        });

        it('should NOT be able to find another user client', async () => {
            expect.hasAssertions();

            try {
                await manager.findUser({ id: otherUser.id }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Unable to find User');
                expect(err.statusCode).toEqual(404);
            }
        });

        it('should NOT be able to find a user from another client', async () => {
            expect.hasAssertions();

            try {
                await manager.findUser({ id: foreignUser.id }, normalUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Unable to find User');
                expect(err.statusCode).toEqual(404);
            }
        });

        it('should be able to find users without tokens of the same client', async () => {
            const result = await manager.findUsers({ query: `firstname:${otherUser.firstname}` }, normalUser);
            expect(result).toBeArrayOfSize(0);
        });

        it('should NOT be able to find users from another client as USER', async () => {
            const result = await manager.findUsers({ query: 'NOT firstname:Foreign' }, foreignUser);
            expect(result).toBeArrayOfSize(0);
        });

        it('should NOT be able to create another user', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser(
                    {
                        user: {
                            client_id: 1,
                            username: 'user-2',
                            email: 'user-2@example.com',
                            firstname: 'User',
                            lastname: 'User 2',
                            type: 'USER',
                        },
                        password: 'password',
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to other users");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be allowed to update another user', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: otherUser.id,
                            username: 'other-user',
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to other users");
                expect(err.statusCode).toEqual(403);
            }
        });

        it("should NOT be allowed to update another user's password", async () => {
            expect.hasAssertions();

            try {
                await manager.updatePassword(
                    {
                        id: otherUser.id,
                        password: 'other-user',
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to other users");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be allowed to updated another user', async () => {
            expect.hasAssertions();

            try {
                await manager.updateToken(
                    {
                        id: otherUser.id,
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to other users");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should be allowed to update its own record', async () => {
            await manager.updateUser(
                {
                    user: {
                        id: otherUser.id,
                        firstname: 'Otherr',
                    },
                },
                otherUser
            );
        });

        it('should NOT be allowed to elevate its permission to ADMIN', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: normalUser.id,
                            type: 'ADMIN',
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to elevate user to ADMIN");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to change its client id', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: normalUser.id,
                            client_id: 3,
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to change client on user");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be allowed to elevate its permission to SUPERADMIN', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser(
                    {
                        user: {
                            id: normalUser.id,
                            type: 'SUPERADMIN',
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to elevate user to SUPERADMIN");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should be allowed to update its own password', async () => {
            await manager.updatePassword(
                {
                    id: otherUser.id,
                    password: 'password',
                },
                otherUser
            );
        });

        it('should be allowed to update its own token', async () => {
            await manager.updateToken(
                {
                    id: otherUser.id,
                },
                otherUser
            );
        });

        it('should NOT be able to remove another user', async () => {
            expect.hasAssertions();

            try {
                await manager.removeUser(
                    {
                        id: otherUser.id,
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to write to other users");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to remove itself', async () => {
            expect.hasAssertions();

            try {
                await manager.removeUser(
                    {
                        id: normalUser.id,
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to remove itself");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to create a role', async () => {
            expect.hasAssertions();

            try {
                await manager.createRole(
                    {
                        role: {
                            client_id: 1,
                            name: 'SomeExampleRole',
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to create Role");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be allowed to remove a role', async () => {
            expect.hasAssertions();

            try {
                await manager.removeRole(
                    {
                        id: 'random-id',
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to remove Role");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to update roles', async () => {
            expect.hasAssertions();

            try {
                await manager.updateRole(
                    {
                        role: {
                            id: 'random-id',
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to update Role");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to create data types', async () => {
            expect.hasAssertions();

            try {
                await manager.createDataType(
                    {
                        dataType: {
                            client_id: 1,
                            name: 'SomeExampleDataType',
                            config: {
                                fields: {
                                    hello: { type: 'Keyword' },
                                },
                                version: LATEST_VERSION,
                            },
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to create DataType");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to remove a data type', async () => {
            expect.hasAssertions();

            try {
                await manager.removeDataType(
                    {
                        id: 'random-id',
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to remove DataType");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to update a data type', async () => {
            expect.hasAssertions();

            try {
                await manager.updateDataType(
                    {
                        dataType: {
                            id: 'random-id',
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to update DataType");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be allowed to create space', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace(
                    {
                        space: {
                            type: 'SEARCH',
                            client_id: 1,
                            name: 'SomeExampleSpace',
                            endpoint: 'some-example-space',
                            data_type: 'random-id',
                            roles: [],
                            views: [],
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to create Space");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be allowed to remove a space', async () => {
            expect.hasAssertions();

            try {
                await manager.removeSpace(
                    {
                        id: 'random-id',
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to remove Space");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to update a space', async () => {
            expect.hasAssertions();

            try {
                await manager.updateSpace(
                    {
                        space: {
                            type: 'SEARCH',
                            id: 'random-id',
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to update Space");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be able to create a view', async () => {
            expect.hasAssertions();

            try {
                await manager.createView(
                    {
                        view: {
                            client_id: 1,
                            name: 'SomeExampleDataType',
                            data_type: 'random-id',
                            roles: [],
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to create View");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be allowed to remove a view', async () => {
            expect.hasAssertions();

            try {
                await manager.removeView(
                    {
                        id: 'random-id',
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to remove View");
                expect(err.statusCode).toEqual(403);
            }
        });

        it('should NOT be allowed to update a view', async () => {
            expect.hasAssertions();

            try {
                await manager.updateView(
                    {
                        view: {
                            id: 'random-id',
                        },
                    },
                    normalUser
                );
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude("User doesn't have permission to update View");
                expect(err.statusCode).toEqual(403);
            }
        });
    });

    describe('when no user type is needed', () => {
        it('should be able to authenticate with a username and password', async () => {
            const result = await manager.authenticate({
                username: normalUser.username,
                password: 'password',
            });
            expect(result.id).toEqual(normalUser.id);
        });

        it('should be able to authenticate user with an api_token', async () => {
            const result = await manager.authenticate({ token: normalUser.api_token });
            expect(result.id).toEqual(normalUser.id);
        });

        it('should be able to authenticate with an api_token', async () => {
            const result = await manager.authenticate({ token: normalUser.api_token });
            expect(result.id).toEqual(normalUser.id);
        });

        it('should throw if given no credientials', async () => {
            expect.hasAssertions();

            try {
                await manager.authenticate({});
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing credentials');
                expect(err.statusCode).toEqual(401);
            }
        });
    });
});
