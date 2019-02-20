import 'jest-extended';
import { TSError } from '@terascope/utils';
import { makeClient, cleanupIndexes } from './helpers/elasticsearch';
import { ACLManager, DataAccessConfig } from '../src';

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

    describe('when creating a role and given null', () => {
        it('should throw an error', async () => {
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

    describe('when getting a view for a user', () => {
        describe('when everything is setup correctly', () => {
            const username = 'example-username';

            let spaceId: string;
            let err: any;
            let config: DataAccessConfig;

            beforeAll(async () => {
                const { id: roleId } = await manager.createRole({
                    role: {
                        name: 'Example Role',
                        spaces: [],
                    }
                });

                const spaceResult = await manager.createSpace({
                    space: {
                        name: 'Example Space',
                    },
                    views: [
                        {
                            name: 'Example View',
                            roles: [roleId],
                            includes: ['foo'],
                            excludes: ['bar']
                        }
                    ]
                });

                spaceId = spaceResult.space.id;

                await manager.updateRole({
                    role: {
                        id: roleId,
                        name: 'Example Role',
                        spaces: [spaceId]
                    }
                });

                await manager.createUser({
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

                try {
                    config = await manager.getDataAccessConfig({ username, space: spaceId });
                } catch (_err) {
                    err = _err;
                }
            });

            it('should not have error', () => {
                expect(err).toBeNil();
            });

            it('should return a valid config', () => {
                expect(config).toMatchObject({
                    user: {},
                    view: {},
                    role: 'Example Role'
                });
            });
        });
    });
});
