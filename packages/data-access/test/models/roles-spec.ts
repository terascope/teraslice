import 'jest-extended';
import { TSError } from '@terascope/utils';
import { Roles, RoleModel } from '../../src/models/roles';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Roles', () => {
    const client = makeClient();
    const roles = new Roles(client, {
        namespace: 'test'
    });

    beforeAll(async () => {
        await cleanupIndex(roles);
        return roles.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(roles);
        return roles.shutdown();
    });

    describe('when testing role creation', () => {
        it('should be able to create a role', async () => {
            const created = await roles.create({
                name: 'hello',
                spaces: ['space-id'],
            });

            const fetched = await roles.findById(created.id);

            expect(created).toEqual(fetched);
        });
    });

    describe('when testing role-to-space access', () => {
        let admin: RoleModel;
        let dev: RoleModel;
        let bad: RoleModel;

        const restrictedSpaceId = 'restricted-space';
        const devSpaceId = 'dev-space';

        beforeAll(async () => {
            // @ts-ignore
            bad = await roles.create({
                name: 'bad',
            });

            dev = await roles.create({
                name: 'dev',
                spaces: [
                    devSpaceId,
                ]
            });

            admin = await roles.create({
                name: 'admin',
                spaces: [
                    devSpaceId,
                    restrictedSpaceId,
                    'other-space'
                ]
            });
        });

        describe('when the using the admin role', () => {
            it(`should have access to "${restrictedSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(admin, restrictedSpaceId))
                    .resolves.toBeTrue();
            });

            it(`should have access to "${devSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(admin, devSpaceId))
                    .resolves.toBeTrue();
            });
        });

        describe('when the using the dev role', () => {
            it(`should not have access to "${restrictedSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(dev, restrictedSpaceId))
                    .resolves.toBeFalse();
            });

            it(`should have access to "${devSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(dev, devSpaceId))
                    .resolves.toBeTrue();
            });
        });

        describe('when the using the bad role', () => {
            it(`should not have access to "${restrictedSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(bad, restrictedSpaceId))
                    .resolves.toBeFalse();
            });

            it(`should have access to "${devSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(bad, devSpaceId))
                    .resolves.toBeFalse();
            });
        });
    });

    describe('when testing role updates', () => {
        it('should throw when adding a sapce to role without a space id', async () => {
            expect.hasAssertions();

            try {
                await roles.addSpaceToRoles('', []);
            } catch (err) {
                expect(err.message).toEqual('Missing space to attaching to roles');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(422);
            }
        });

        it('should throw when removing a sapce to role without a space id', async () => {
            expect.hasAssertions();

            try {
                await roles.removeSpaceFromRoles('');
            } catch (err) {
                expect(err.message).toEqual('Missing space to remove from roles');
                expect(err).toBeInstanceOf(TSError);
                expect(err.statusCode).toEqual(422);
            }
        });
    });
});
