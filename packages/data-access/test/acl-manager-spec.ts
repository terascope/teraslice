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
                        roles: ['non-existant-role-id'],
                    },
                    password: 'secrets',
                });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing roles with user, non-existant-role-id');
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
                        roles: [],
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
                    roles: [],
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

    describe('when creating a role and the spaces do not exist', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createRole({
                    role: {
                        name: 'uh-oh',
                        spaces: ['non-existant-space-id'],
                    }
                });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing spaces with role, non-existant-space-id');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a space and the view is null', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace({
                    space: {
                        name: 'Uh oh'
                    },
                    // @ts-ignore
                    views: [null]
                });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Invalid View Input');
                expect(err.statusCode).toEqual(422);
            }
        });
    });

    describe('when creating a space and the view is missing roles', () => {
        it('should throw an error', async () => {
            expect.hasAssertions();

            try {
                await manager.createSpace({
                    space: {
                        name: 'Uh Oh',
                    },
                    views: [
                        {
                            name: 'Uh Oh',
                            roles: ['non-existant-role-id'],
                            includes: ['foo'],
                            excludes: ['bar']
                        }
                    ]
                });
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Missing roles with view, non-existant-role-id');
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
                        spaces: [],
                    }
                });
            });

            const results = await Promise.all(promises);

            roles.push(...results.map((role) => role.id));
        });

        describe('when creating a space with views', () => {
            it('should only allow unique roles for the space', async () => {
                expect.hasAssertions();

                try {
                    await manager.createSpace({
                        space: {
                            name: 'Some Space',
                        },
                        views: [
                            {
                                name: 'Some View',
                                roles: [roles[0]]
                            },
                            {
                                name: 'Double Role View',
                                roles: [roles[0], roles[1]]
                            }
                        ]
                    });
                } catch (err) {
                    expect(err.message).toEqual('A Role can only exist in a space once');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(422);
                }
            });
        });

        describe('when using an existing space', () => {
            let spaceId: string;
            let viewIds: string[];

            beforeAll(async () => {
                const result = await manager.createSpace({
                    space: {
                        name: 'ABC Space',
                    },
                    views: [
                        {
                            name: 'ABC View',
                            roles: [roles[0]]
                        },
                        {
                            name: 'DEF View',
                            roles: [roles[1]]
                        }
                    ]
                });

                spaceId = result.space.id;
                viewIds = result.views.map((view) => view.id);
            });

            it('should not allow another view to be created with the same role', async () => {
                expect.hasAssertions();

                try {
                    await manager.createView({
                        view: {
                            name: 'GHI View',
                            space: spaceId,
                            roles: [roles[0]]
                        }
                    });
                } catch (err) {
                    expect(err.message).toEqual('A Role can only exist in a space once');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(422);
                }
            });

            it('should not allow another view to be updated with the same role', async () => {
                expect.hasAssertions();

                try {
                    await manager.updateView({
                        view: {
                            id: viewIds[0],
                            name: 'DFG View',
                            space: spaceId,
                            roles: [roles[0], roles[1]]
                        }
                    });
                } catch (err) {
                    expect(err.message).toEqual('A Role can only exist in a space once');
                    expect(err).toBeInstanceOf(TSError);
                    expect(err.statusCode).toEqual(422);
                }
            });
        });

        describe('when moving to a different space', () => {
            let spaceAId: string;
            let spaceBId: string;
            let viewId: string;

            beforeAll(async () => {
                const resultA = await manager.createSpace({
                    space: {
                        name: 'A Space',
                    },
                    views: [
                        {
                            name: 'AB View',
                            roles: [roles[0]]
                        }
                    ]
                });

                const resultB = await manager.createSpace({
                    space: {
                        name: 'B Space',
                    }
                });

                spaceAId = resultA.space.id;
                viewId = resultA.views[0].id;

                spaceBId = resultB.space.id;
            });

            it('should remove the view from the old space', async () => {
                await manager.updateView({
                    view: {
                        id: viewId,
                        name: 'AB View',
                        space: spaceBId,
                        roles: []
                    }
                });

                const [spaceA, spaceB] = await Promise.all([
                    manager.findSpace({ id: spaceAId }),
                    manager.findSpace({ id: spaceBId }),
                ]);

                expect(spaceA.views).not.toContain(viewId);
                expect(spaceB.views).toContain(viewId);
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
                        roles: [],
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
                    expect(err.message).toEqual('User "foooooo" is not assigned to any roles');
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
            let apiToken: string;

            beforeAll(async () => {
                const role = await manager.createRole({
                    role: {
                        name: 'Example Role',
                        spaces: [],
                    }
                });

                roleId = role.id;

                const spaceResult = await manager.createSpace({
                    space: {
                        name: 'Example Space'
                    },
                    views: [
                        {
                            name: 'Example View',
                            roles: [roleId],
                            includes: ['foo'],
                            metadata: {
                                a: 'b',
                                example: {
                                    n: 1
                                }
                            }
                        }
                    ],
                    defaultView: {
                        excludes: ['example'],
                        constraint: 'hello:true',
                        metadata: {
                            c: 'd',
                            example: {
                                n: 2
                            }
                        }
                    }
                });

                spaceId = spaceResult.space.id;
                viewId = spaceResult.views[0].id;

                await manager.updateRole({
                    role: {
                        id: roleId,
                        name: 'Example Role',
                        spaces: [spaceId]
                    }
                });

                await manager.updateSpace({
                    space: {
                        id: spaceId,
                        name: 'Example Space',
                        views: [viewId],
                        metadata: {
                            example: true
                        }
                    }
                });

                const user = await manager.createUser({
                    user: {
                        username,
                        firstname: 'Foo',
                        lastname: 'Bar',
                        client_id: 1888,
                        email: 'foobar@example.com',
                        roles: [roleId],
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
                    view: {
                        name: 'Example View',
                        roles: [roleId],
                        includes: ['foo'],
                        excludes: ['example'],
                        constraint: 'hello:true',
                        metadata: {
                            a: 'b',
                            c: 'd',
                            example: {
                                n: 1
                            }
                        }
                    },
                    space_id: spaceId,
                    space_metadata: {
                        example: true
                    }
                });
            });

            it('should be able to get config by space name', () => {
                return expect(manager.getViewForSpace({
                    api_token: apiToken,
                    space: 'Example Space'
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
        });
    });
});
