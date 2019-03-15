import 'jest-extended';
import { TSError, times } from '@terascope/utils';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import { ACLManager, UserModel } from '../src';

describe('ACLManager', () => {
    const client = makeClient();
    const manager = new ACLManager(client, { namespace: 'test_manager' });

    beforeAll(async () => {
        await cleanupIndexes(manager);
        return manager.initialize();
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
        let user: UserModel;

        beforeAll(async () => {
            user = await manager.createUser({
                user: {
                    username: 'some-user',
                    firstname: 'Some',
                    lastname: 'User',
                    client_id: 121,
                    email: 'some-user@example.com',
                },
                password: 'secrets',
            });
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
                });
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

    describe('when creating views', () => {
        const roles: string[] = [];

        beforeAll(async () => {
            const promises = times(2, (n) => {
                return manager.createRole({
                    role: {
                        name: `Role ${n}`,
                    }
                });
            });

            const results = await Promise.all(promises);

            roles.push(...results.map((role) => role.id));
        });

        // FIXME OR REMOVEME
        // it('should only allow unique roles for the space', async () => {
        //     expect.hasAssertions();

        //     await manager.createView({
        //         view: {
        //             name: 'Some View',
        //             roles: [roles[0]],
        //             data_type: 'some-data-type'
        //         }
        //     });

        //     try {
        //         await manager.createView({
        //             view: {
        //                 name: 'Double Role View',
        //                 roles: [roles[0], roles[1]],
        //                 data_type: 'some-data-type'
        //             }
        //         });
        //     } catch (err) {
        //         expect(err.message).toEqual('A role can only exist in a view once per data type');
        //         expect(err).toBeInstanceOf(TSError);
        //         expect(err.statusCode).toEqual(422);
        //     }
        // });

        // FIXME or REMOVEME
        // it('should not allow another view to be updated with the same role', async () => {
        //     expect.hasAssertions();

        //     try {
        //         await manager.updateView({
        //             view: {
        //                 id: viewIds[0],
        //                 name: 'DFG View',
        //                 space: spaceId,
        //                 roles: [roles[0], roles[1]]
        //             }
        //         });
        //     } catch (err) {
        //         expect(err.message).toEqual('A role can only exist in a view once per data type');
        //         expect(err).toBeInstanceOf(TSError);
        //         expect(err.statusCode).toEqual(422);
        //     }
        // });

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
                    }),
                    await manager.createDataType({
                        dataType: {
                            name: 'DataType Two'
                        }
                    })
                ]);
                dataType1Id = dataType1.id;
                dataType2Id = dataType2.id;

                const view = await manager.createView({
                    view: {
                        name: 'The View',
                        data_type: dataType1Id,
                        roles: [],
                    }
                });

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
                    });
                } catch (err) {
                    expect(err.message).toEqual('Cannot not update the data_type on a view');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(422);
                }
            });
        });
    });

    describe('when getting a view for a user', () => {
        describe('when no roles exists on the user', () => {
            let apiToken: string;
            beforeAll(async () => {
                const user = await manager.createUser({
                    user: {
                        username: 'foooooo',
                        firstname: 'Foo',
                        lastname: 'ooooo',
                        email: 'foobar@example.com',
                    },
                    password: 'secrets'
                });

                apiToken = user.api_token;
            });

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
            const username = 'example-username';

            let spaceId: string;
            let roleId: string;
            let userId: string;
            let viewId: string;
            let dataTypeId: string;
            let apiToken: string;

            beforeAll(async () => {
                const role = await manager.createRole({
                    role: {
                        name: 'Example Role',
                    }
                });
                roleId = role.id;

                const dataType = await manager.createDataType({
                    dataType: {
                        name: 'MyExampleType',
                        typeConfig: {
                            created: 'date',
                            location: 'geo'
                        },
                    },
                });
                dataTypeId = dataType.id;

                const view = await manager.createView({
                    view: {
                        name: 'Example View',
                        data_type: dataTypeId,
                        roles: [roleId],
                        includes: ['foo']
                    }
                });
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
                });
                spaceId = space.id;

                await manager.updateRole({
                    role: {
                        id: roleId,
                        name: 'Example Role',
                    }
                });

                const user = await manager.createUser({
                    user: {
                        username,
                        firstname: 'Foo',
                        lastname: 'Bar',
                        client_id: 1888,
                        email: 'foobar@example.com',
                        role: roleId,
                    },
                    password: 'secrets'
                });

                userId = user.id;
                apiToken = user.api_token;
            });

            it('should be able to get config by space id', () => {
                return expect(manager.getViewForSpace({
                    api_token: apiToken,
                    space: spaceId
                })).resolves.toMatchObject({
                    user_id: userId,
                    role_id: roleId,
                    data_type: {
                        id: dataTypeId,
                        typeConfig: {
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
                return expect(manager.getViewForSpace({
                    api_token: apiToken,
                    space: 'example-space'
                })).resolves.toMatchObject({
                    space_id: spaceId,
                    user_id: userId,
                    role_id: roleId,
                });
            });

            it('should be able to remove the user', () => {
                return expect(manager.removeUser({ id: userId }))
                    .resolves.toBeTrue();
            });

            it('should be able to remove the role', () => {
                return expect(manager.removeRole({ id: roleId }))
                    .resolves.toBeTrue();
            });

            it('should be able to remove the view', () => {
                return expect(manager.removeView({ id: viewId }))
                    .resolves.toBeTrue();
            });

            it('should be able to remove the space', () => {
                return expect(manager.removeSpace({ id: spaceId }))
                    .resolves.toBeTrue();
            });

            it('should be able to remove the data type', () => {
                return expect(manager.removeDataType({ id: dataTypeId }))
                    .resolves.toBeTrue();
            });
        });
    });
});
