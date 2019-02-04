import 'jest-extended';
import { TSError } from '@terascope/utils';
import { Views, ViewModel } from '../../src/models/views';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Views', () => {
    const client = makeClient();
    const views = new Views(client, {
        namespace: 'test'
    });

    beforeAll(async () => {
        await cleanupIndex(views);
        return views.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(views);
        return views.shutdown();
    });

    describe('when testing view creation', () => {
        it('should be able to create a view', async () => {
            const created = await views.create({
                name: 'hello',
                space: 'space-id',
                roles: ['role-id'],
                excludes: ['example'],
                includes: ['other'],
            });

            const fetched = await views.findById(created.id);

            expect(created).toEqual(fetched);
        });
    });

    describe('when getting a view for a role', () => {
        let view: ViewModel;

        const spaceId = 'some-space-id';
        const roleId = 'some-role-id';

        beforeAll(async () => {
            view = await views.create({
                name: 'hello',
                space: spaceId,
                roles: [roleId],
            });
        });

        it('should return the view if using the right space', async () => {
            const found = await views.getViewForRole(roleId, spaceId);
            expect(found).toEqual(view);
        });

        it('should throw and error if no view is found', async () => {
            expect.hasAssertions();

            try {
                await views.getViewForRole(roleId, 'missing');
            } catch (err) {
                const errMsg = `No View found for role "${roleId}" and space "missing"`;
                expect(err).toBeInstanceOf(TSError);
                expect(err).toHaveProperty('statusCode', 404);
                expect(err).toHaveProperty('message', errMsg);
            }
        });
    });
});
