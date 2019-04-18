import 'jest-extended';
import { TSError } from '@terascope/utils';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import { ACLManager, User, Role } from '../src';

describe('ACLManager', () => {
    const client = makeClient();
    const manager = new ACLManager(client, { namespace: 'test_manager' });
    let superAdminUser: User;
    let normalUser: User;
    let normalRole: Role;

    beforeAll(async () => {
        await cleanupIndexes(manager);
        await manager.initialize();
        normalRole = await manager.createRole({
            role: {
                client_id: 1,
                name: 'Example Role',
            }
        }, false);

        ([superAdminUser, normalUser] = await Promise.all([
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
            }, false),
            manager.createUser({
                user: {
                    username: 'user-user',
                    email: 'user-user@example.com',
                    firstname: 'User',
                    lastname: 'User',
                    type: 'USER',
                    role: normalRole.id,
                    client_id: 1,
                },
                password: 'password'
            }, false),
        ]));
    });

    afterAll(async () => {
        await cleanupIndexes(manager);
        return manager.shutdown();
    });

    describe('when creating a user and given null', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser({
                    // @ts-ignore
                    user: null
                }, 'password');
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Invalid Input');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a user and the role do not exist', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser({
                    user: {
                        username: 'uh-oh',
                        firstname: 'Uh',
                        lastname: 'Oh',
                        client_id: 100,
                        email: 'uh-oh@example.com',
                        role: 'non-existant-role-id',
                    },
                    password: 'secrets',
                }, false);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing role with user, non-existant-role-id');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a user and sending a private field', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createUser({
                    user: {
                        username: 'uh-oh',
                        firstname: 'Uh',
                        lastname: 'Oh',
                        client_id: 100,
                        email: 'uh-oh@example.com',
                        // @ts-ignore
                        api_token: 'oh no'
                    },
                    password: 'secrets',
                }, false);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Cannot update restricted fields,');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when updating a user and sending a private field', () => {
        let user: User;

        beforeAll(async () => {
            user = await manager.createUser({
                user: {
                    username: 'some-random-user',
                    firstname: 'Some',
                    lastname: 'User',
                    client_id: 121,
                    email: 'some-random-user@example.com',
                },
                password: 'secrets',
            }, superAdminUser);
        });

        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.updateUser({
                    user: {
                        id: user.id,
                        email: 'some-user@example.com',
                        // @ts-ignore
                        api_token: 'oh no'
                    },
                    password: 'secrets',
                }, user);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Cannot update restricted fields,');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a data type and given null', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createDataType({
                    // @ts-ignore
                    dataType: null
                }, false);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Invalid Input');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a space and the roles do not exist', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace({
                    space: {
                        client_id: 1,
                        name: 'uh-oh',
                        endpoint: 'uh-oh',
                        data_type: 'hello',
                        views: [],
                        roles: ['non-existant-role-id'],
                    }
                }, false);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing roles with space, non-existant-role-id');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a space and given data-access as the endpoint', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            // @ts-ignore
            const dataType: string = undefined;

            try {
                await manager.createSpace({
                    space: {
                        client_id: 1,
                        name: 'uh-oh',
                        endpoint: 'data-access',
                        data_type: dataType,
                        views: [],
                        roles: [],
                    }
                }, false);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Space endpoint "data-access" is reserved');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a space with a invalid data type', () => {
        let dataType1: string;
        let dataType2: string;
        let viewId: string;

        beforeAll(async () => {
            const [dt1, dt2] = await Promise.all([
                manager.createDataType({
                    dataType: {
                        client_id: 1,
                        name: 'ABC DataType'
                    }
                }, superAdminUser),
                manager.createDataType({
                    dataType: {
                        client_id: 1,
                        name: 'BCD DataType'
                    }
                }, superAdminUser),
            ]);
            dataType1 = dt1.id;
            dataType2 = dt2.id;

            const view = await manager.createView({
                view: {
                    client_id: 1,
                    name: 'BCD View',
                    data_type: dataType2,
                    roles: [],
                }
            }, superAdminUser);
            viewId = view.id;
        });

        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace({
                    space: {
                        client_id: 1,
                        name: 'uh-oh',
                        endpoint: 'uh-oh',
                        data_type: dataType1,
                        views: [viewId],
                        roles: [],
                    }
                }, false);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Views must have the same data type');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a space with a invalid roles', () => {
        let dataTypeId: string;
        let role1Id: string;
        let role2Id: string;
        let role3Id: string;
        let view1Id: string;
        let view2Id: string;

        beforeAll(async () => {
            const [role1, role2, role3, dataType] = await Promise.all([
                manager.createRole({
                    role: {
                        client_id: 1,
                        name: 'Some Role 1',
                    }
                }, superAdminUser),
                manager.createRole({
                    role: {
                        client_id: 1,
                        name: 'Some Role 2',
                    }
                }, superAdminUser),
                manager.createRole({
                    role: {
                        client_id: 1,
                        name: 'Some Role 3',
                    }
                }, superAdminUser),
                manager.createDataType({
                    dataType: {
                        client_id: 1,
                        name: 'Some DataType'
                    }
                }, superAdminUser)
            ]);
            dataTypeId = dataType.id;
            role1Id = role1.id;
            role2Id = role2.id;
            role3Id = role3.id;

            const [view1, view2] = await Promise.all([
                manager.createView({
                    view: {
                        client_id: 1,
                        name: 'Some View 1',
                        data_type: dataTypeId,
                        roles: [role1Id, role2Id],
                    }
                }, superAdminUser),
                manager.createView({
                    view: {
                        client_id: 1,
                        name: 'Some View 2',
                        data_type: dataTypeId,
                        roles: [role1Id],
                    }
                }, superAdminUser)
            ]);
            view1Id = view1.id;
            view2Id = view2.id;
        });

        it('should throw an error if the view contains a extra role', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace({
                    space: {
                        client_id: 1,
                        name: 'uh-oh',
                        endpoint: 'uh-oh',
                        data_type: dataTypeId,
                        views: [view1Id, view2Id],
                        roles: [role1Id, role2Id, role3Id],
                    }
                }, superAdminUser);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Multiple views cannot contain the same role within a space');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating views', () => {
        describe('when moving to a different data_type', () => {
            let viewId: string;
            let dataType1Id: string;
            let dataType2Id: string;

            beforeAll(async () => {
                const [dataType1, dataType2] = await Promise.all([
                    await manager.createDataType({
                        dataType: {
                            client_id: 1,
                            name: 'DataType One'
                        }
                    }, superAdminUser),
                    await manager.createDataType({
                        dataType: {
                            client_id: 1,
                            name: 'DataType Two'
                        }
                    }, superAdminUser)
                ]);
                dataType1Id = dataType1.id;
                dataType2Id = dataType2.id;

                const view = await manager.createView({
                    view: {
                        client_id: 1,
                        name: 'The View',
                        data_type: dataType1Id,
                        roles: [],
                    }
                }, superAdminUser);

                viewId = view.id;
            });

            it('should remove the view from the old space', async () => {
                expect.hasAssertions();

                try {
                    await manager.updateView({
                        view: {
                            client_id: 1,
                            id: viewId,
                            data_type: dataType2Id,
                            roles: []
                        }
                    }, superAdminUser);
                } catch (err) {
                    expect(err.message).toEqual('Cannot not update the data_type on a view');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(422);
                }
            });
        });
    });

    describe('when creating a space and given null', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace({
                    // @ts-ignore
                    space: null
                }, false);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Invalid Input');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a view and given null', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createView({
                    // @ts-ignore
                    view: null
                }, false);
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Invalid Input');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when getting a view for a user', () => {
        let dataTypeId: string;

        beforeAll(async () => {
            const dataType = await manager.createDataType({
                dataType: {
                    client_id: 1,
                    name: 'MyExampleType',
                    type_config: {
                        created: 'date',
                        location: 'geo'
                    },
                },
            }, superAdminUser);
            dataTypeId = dataType.id;
        });

        afterAll(() => {
            return Promise.all([
                manager.removeUser({ id: normalUser.id }, superAdminUser),
                manager.removeRole({ id: normalUser.id }, superAdminUser),
                manager.removeDataType({ id: normalUser.id }, superAdminUser),
            ]);
        });

        describe('when no roles exists on the user', () => {
            let otherUser: User;

            beforeAll(async () => {
                otherUser = await manager.createUser({
                    user: {
                        client_id: 1,
                        username: 'foooooo',
                        email: 'someotheruser@example.co.uk',
                        firstname: 'other',
                        lastname: 'user'
                    },
                    password: 'password'
                }, superAdminUser);
            });

            it('should throw a forbidden error', async () => {
                expect.hasAssertions();

                try {
                    await manager.getViewForSpace({
                        token: otherUser.api_token,
                        space: ''
                    }, false);
                } catch (err) {
                    expect(err.message).toEqual('User "foooooo" is not assigned to a role');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(403);
                }
            });
        });

        describe('when everything is setup correctly', () => {
            let spaceId: string;
            let viewId: string;

            beforeAll(async () => {
                const view = await manager.createView({
                    view: {
                        client_id: 1,
                        name: 'Example View',
                        data_type: dataTypeId,
                        roles: [normalRole.id],
                        includes: ['foo']
                    }
                }, superAdminUser);
                viewId = view.id;

                const space = await manager.createSpace({
                    space: {
                        client_id: 1,
                        name: 'Example Space',
                        data_type: dataTypeId,
                        endpoint: 'example-space',
                        roles: [normalRole.id],
                        views: [viewId],
                        search_config: {
                            index: 'hello',
                            require_query: true,
                            sort_dates_only: true,
                            default_date_field: 'Updated ',
                            default_geo_field: 'other_LOCation'
                        },
                    }
                }, superAdminUser);
                spaceId = space.id;
            });

            afterAll(async () => {
                await Promise.all([
                    manager.removeView({ id: viewId }, superAdminUser),
                    manager.removeSpace({ id: spaceId }, superAdminUser),
                ]);

                await Promise.all([
                    manager.removeView({ id: viewId }, superAdminUser),
                    manager.removeSpace({ id: spaceId }, superAdminUser),
                ]);
            });

            it('should be able to update the view', async () => {
                await manager.updateView({
                    view: {
                        id: viewId,
                        constraint: 'hello:there'
                    }
                }, superAdminUser);
            });

            it('should be able to get config by space id', () => {
                return expect(manager.getViewForSpace({
                    token: normalUser.api_token,
                    space: spaceId
                }, normalUser)).resolves.toMatchObject({
                    user_id: normalUser.id,
                    role_id: normalRole.id,
                    data_type: {
                        id: dataTypeId,
                        type_config: {
                            created: 'date',
                            updated: 'date',
                            location: 'geo',
                            other_location: 'geo',
                        }
                    },
                    view: {
                        name: 'Example View',
                        roles: [normalRole.id],
                        includes: ['foo'],
                        excludes: [],
                        constraint: 'hello:there'
                    },
                    space_id: spaceId,
                    search_config: {
                        index: 'hello',
                        require_query: true,
                        sort_dates_only: true,
                        default_date_field: 'updated',
                        default_geo_field: 'other_location',
                    },
                });
            });

            it('should be able to get config by space endpoint', () => {
                return expect(manager.getViewForSpace({
                    token: normalUser.api_token,
                    space: 'example-space'
                }, normalUser)).resolves.toMatchObject({
                    space_id: spaceId,
                    user_id: normalUser.id,
                    role_id: normalRole.id,
                });
            });
        });

        describe('when testing default view access', () => {
            let spaceId: string;

            beforeAll(async () => {
                const space = await manager.createSpace({
                    space: {
                        client_id: 1,
                        name: 'Another Space',
                        data_type: dataTypeId,
                        endpoint: 'another-space',
                        roles: [normalRole.id],
                        views: [],
                        search_config: {
                            index: 'howdy',
                            sort_default: 'created:asc',
                            preserve_index_name: true,
                        },
                    }
                }, superAdminUser);
                spaceId = space.id;
            });

            afterAll(() => {
                return Promise.all([
                    manager.removeSpace({ id: spaceId }, superAdminUser),
                ]);
            });

            it('should be able to get the default view', () => {
                return expect(manager.getViewForSpace({
                    token: normalUser.api_token,
                    space: spaceId
                }, normalUser)).resolves.toMatchObject({
                    user_id: normalUser.id,
                    role_id: normalRole.id,
                    data_type: {
                        id: dataTypeId,
                        type_config: {
                            created: 'date',
                            location: 'geo'
                        }
                    },
                    view: {
                        name: `Default View for Role ${normalRole.id}`,
                        roles: [normalRole.id]
                    },
                    space_id: spaceId,
                    search_config: {
                        index: 'howdy',
                        sort_default: 'created:asc',
                        preserve_index_name: true
                    },
                });
            });
        });
    });
});
