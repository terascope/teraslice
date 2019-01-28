import 'jest-extended';
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

    describe('when getting a view for a user', () => {
        describe('when everything is setup correctly', () => {
            const username = 'example-username';

            let spaceId: string;
            let err: any;
            let config: DataAccessConfig;

            beforeAll(async () => {
                const space = await manager.spaces.create({
                    name: 'Example Space',
                    views: []
                });

                spaceId = space.id;

                const { id: roleId } = await manager.roles.create({
                    name: 'Example Role',
                    spaces: [spaceId],
                });

                const { id: viewId } = await manager.views.create({
                    name: 'Example View',
                    space: spaceId,
                    roles: [roleId],
                    includes: ['foo'],
                    excludes: ['bar']
                });

                await manager.spaces.update(Object.assign(space, {
                    views: [viewId]
                }));

                await manager.users.create({
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
                    space: 'Example Space',
                    role: 'Example Role'
                });
            });
        });
    });
});
