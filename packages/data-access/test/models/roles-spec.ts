import 'jest-extended';
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
                return expect(roles.hasAccessToSpace(admin.id, restrictedSpaceId))
                    .resolves.toBeTrue();
            });

            it(`should have access to "${devSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(admin.id, devSpaceId))
                    .resolves.toBeTrue();
            });
        });

        describe('when the using the dev role', () => {
            it(`should not have access to "${restrictedSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(dev.id, restrictedSpaceId))
                    .resolves.toBeFalse();
            });

            it(`should have access to "${devSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(dev.id, devSpaceId))
                    .resolves.toBeTrue();
            });
        });

        describe('when the using the bad role', () => {
            it(`should not have access to "${restrictedSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(bad.id, restrictedSpaceId))
                    .resolves.toBeFalse();
            });

            it(`should have access to "${devSpaceId}"`, () => {
                return expect(roles.hasAccessToSpace(bad.id, devSpaceId))
                    .resolves.toBeFalse();
            });
        });
    });
});
