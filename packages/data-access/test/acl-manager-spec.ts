import 'jest-extended';
import { TSError } from '@terascope/utils';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import { ACLManager, User } from '../src';

describe('ACLManager', () => {
    const client = makeClient();
    const manager = new ACLManager(client, { namespace: 'test_manager' });
    let superAdminUser: User;
    let adminUser: User;
    let normalUser: User;

    beforeAll(async () => {
        await cleanupIndexes(manager);
        await manager.initialize();
        ([superAdminUser, adminUser, normalUser] = await Promise.all([
            manager.createUser({
                user: {
                    username: 'superadmin',
                    email: 'superadmin@example.com',
                    firstname: 'Super',
                    lastname: 'Admin',
                    type: 'SUPERADMIN',
                    client_id: 0,
                },
                password: 'password'
            }),
            manager.createUser({
                user: {
                    username: 'admin',
                    email: 'admin@example.com',
                    firstname: 'Admin',
                    lastname: 'Admin',
                    type: 'ADMIN',
                    client_id: 1,
                },
                password: 'password'
            }),
            manager.createUser({
                user: {
                    username: 'user',
                    email: 'user@example.com',
                    firstname: 'User',
                    lastname: 'User',
                    type: 'USER',
                    client_id: 1,
                },
                password: 'password'
            })
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
                // @ts-ignore
                await manager.createUser({ user: null });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Invalid User Input');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a user and the roles do not exist', () => {
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
                });
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
                });
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

    describe('when creating a role and given null', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                // @ts-ignore
                await manager.createRole({ role: null });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Invalid Role Input');
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
                        name: 'uh-oh',
                        endpoint: 'uh-oh',
                        data_type: 'hello',
                        views: [],
                        roles: ['non-existant-role-id'],
                    }
                });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing roles with space, non-existant-role-id');
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
                        name: 'ABC DataType'
                    }
                }, superAdminUser),
                manager.createDataType({
                    dataType: {
                        name: 'BCD DataType'
                    }
                }, superAdminUser),
            ]);
            dataType1 = dt1.id;
            dataType2 = dt2.id;

            const view = await manager.createView({
                view: {
                    name: 'BCD View',
                    data_type: dataType2,
                    roles: [],
                }
            });
            viewId = view.id;
        });

        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace({
                    space: {
                        name: 'uh-oh',
                        endpoint: 'uh-oh',
                        data_type: dataType1,
                        views: [viewId],
                        roles: [],
                    }
                });
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
                        name: 'Some Role 1',
                    }
                }, superAdminUser),
                manager.createRole({
                    role: {
                        name: 'Some Role 2',
                    }
                }, superAdminUser),
                manager.createRole({
                    role: {
                        name: 'Some Role 3',
                    }
                }, superAdminUser),
                manager.createDataType({
                    dataType: {
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
                        name: 'Some View 1',
                        data_type: dataTypeId,
                        roles: [role1Id, role2Id],
                    }
                }, superAdminUser),
                manager.createView({
                    view: {
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
                            name: 'DataType One'
                        }
                    }, adminUser),
                    await manager.createDataType({
                        dataType: {
                            name: 'DataType Two'
                        }
                    }, adminUser)
                ]);
                dataType1Id = dataType1.id;
                dataType2Id = dataType2.id;

                const view = await manager.createView({
                    view: {
                        name: 'The View',
                        data_type: dataType1Id,
                        roles: [],
                    }
                }, adminUser);

                viewId = view.id;
            });

            it('should remove the view from the old space', async () => {
                expect.hasAssertions();

                try {
                    await manager.updateView({
                        view: {
                            id: viewId,
                            data_type: dataType2Id,
                            roles: []
                        }
                    }, adminUser);
                } catch (err) {
                    expect(err.message).toEqual('Cannot not update the data_type on a view');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(422);
                }
            });
        });
    });

    describe('when getting a view for a user', () => {
        let userId: string;
        let apiToken: string;
        let roleId: string;
        let dataTypeId: string;

        beforeAll(async () => {
            const user = await manager.createUser({
                user: {
                    username: 'foooooo',
                    firstname: 'Foo',
                    lastname: 'Bar',
                    client_id: 1,
                    email: 'foobar@example.com',
                },
                password: 'secrets'
            });
            userId = user.id;
            apiToken = user.api_token;

            const role = await manager.createRole({
                role: {
                    name: 'Example Role',
                }
            }, adminUser);
            roleId = role.id;

            const dataType = await manager.createDataType({
                dataType: {
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
                manager.removeUser({ id: userId }, adminUser),
                manager.removeRole({ id: userId }, adminUser),
                manager.removeDataType({ id: userId }, superAdminUser),
            ]);
        });

        describe('when no roles exists on the user', () => {
            it('should throw a forbidden error', async () => {
                expect.hasAssertions();

                try {
                    await manager.getViewForSpace({ api_token: apiToken, space: '' });
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
                        name: 'Example View',
                        data_type: dataTypeId,
                        roles: [roleId],
                        includes: ['foo']
                    }
                }, adminUser);
                viewId = view.id;

                const space = await manager.createSpace({
                    space: {
                        name: 'Example Space',
                        data_type: dataTypeId,
                        endpoint: 'example-space',
                        roles: [roleId],
                        views: [viewId],
                        search_config: {
                            index: 'hello',
                            require_query: true,
                            sort_dates_only: true,
                        },
                    }
                }, superAdminUser);
                spaceId = space.id;

                await manager.updateUser({
                    user: {
                        id: userId,
                        role: roleId
                    }
                }, adminUser);
            });

            afterAll(() => {
                return Promise.all([
                    manager.removeView({ id: viewId }, adminUser),
                    manager.removeSpace({ id: spaceId }, superAdminUser),
                ]);
            });

            it('should be able to get config by space id', () => {
                expect(apiToken).toBeTruthy();
                expect(spaceId).toBeTruthy();

                return expect(manager.getViewForSpace({
                    api_token: apiToken,
                    space: spaceId
                })).resolves.toMatchObject({
                    user_id: userId,
                    role_id: roleId,
                    data_type: {
                        id: dataTypeId,
                        type_config: {
                            created: 'date',
                            location: 'geo',
                        }
                    },
                    view: {
                        name: 'Example View',
                        roles: [roleId],
                        includes: ['foo'],
                        excludes: []
                    },
                    space_id: spaceId,
                    search_config: {
                        index: 'hello',
                        require_query: true,
                        sort_dates_only: true,
                    },
                });
            });

            it('should be able to get config by space endpoint', () => {
                expect(apiToken).toBeTruthy();

                return expect(manager.getViewForSpace({
                    api_token: apiToken,
                    space: 'example-space'
                })).resolves.toMatchObject({
                    space_id: spaceId,
                    user_id: userId,
                    role_id: roleId,
                });
            });
        });

        describe('when testing default view access', () => {
            let spaceId: string;

            beforeAll(async () => {
                const space = await manager.createSpace({
                    space: {
                        name: 'Another Space',
                        data_type: dataTypeId,
                        endpoint: 'another-space',
                        roles: [roleId],
                        views: [],
                        search_config: {
                            index: 'howdy',
                            sort_default: 'created:asc',
                            preserve_index_name: true,
                        },
                    }
                });
                spaceId = space.id;

                await manager.updateUser({
                    user: {
                        id: userId,
                        role: roleId
                    }
                }, adminUser);
            });

            afterAll(() => {
                return Promise.all([
                    manager.removeSpace({ id: spaceId }, superAdminUser),
                ]);
            });

            it('should be able to get the default view', () => {
                expect(apiToken).toBeTruthy();
                expect(spaceId).toBeTruthy();

                return expect(manager.getViewForSpace({
                    api_token: apiToken,
                    space: spaceId
                }, normalUser)).resolves.toMatchObject({
                    user_id: userId,
                    role_id: roleId,
                    data_type: {
                        id: dataTypeId,
                        type_config: {
                            created: 'date',
                            location: 'geo',
                        }
                    },
                    view: {
                        name: `Default View for Role ${roleId}`,
                        roles: [roleId]
                    },
                    space_id: spaceId,
                    search_config: {
                        index: 'howdy',
                        sort_default: 'created:asc',
                        preserve_index_name: true,
                    },
                });
            });
        });
    });
});
