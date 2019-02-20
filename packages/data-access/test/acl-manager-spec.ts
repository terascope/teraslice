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

    describe('when creating a user and the roles do not exist', () => {
        it('should throw and error', async () => {
            try {
                await manager.createUser({
                    username: 'uh-oh',
                    firstname: 'Uh',
                    lastname: 'Oh',
                    client_id: 100,
                    email: 'uh-oh@example.com',
                    roles: ['non-existant-role-id'],
                }, 'secrets');
            } catch (err) {
                expect(err).toBeInstanceOf(TSError);
                expect(err.message).toInclude('Unable to create user with roles');
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
                const { id: roleId } = await manager.roles.create({
                    name: 'Example Role',
                    spaces: [],
                });

                const spaceResult = await manager.createSpace({
                    name: 'Example Space',
                }, [
                    {
                        name: 'Example View',
                        roles: [roleId],
                        includes: ['foo'],
                        excludes: ['bar']
                    }
                ]);

                spaceId = spaceResult.space.id;

                await manager.roles.update({
                    id: roleId,
                    name: 'Example Role',
                    spaces: [spaceId]
                });

                await manager.createUser({
                    username,
                    firstname: 'Foo',
                    lastname: 'Bar',
                    client_id: 1888,
                    email: 'foobar@example.com',
                    roles: [roleId],
                }, 'secrets');

                try {
                    config = await manager.getDataAccessConfig(username, spaceId);
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
