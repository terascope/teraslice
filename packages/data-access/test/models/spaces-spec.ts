import 'jest-extended';
import { Spaces } from '../../src/models/spaces';
import { makeClient, cleanupIndex } from '../helpers/elasticsearch';

describe('Spaces', () => {
    const client = makeClient();
    const spaces = new Spaces(client, {
        namespace: 'test'
    });

    beforeAll(async () => {
        await cleanupIndex(spaces);
        return spaces.initialize();
    });

    afterAll(async () => {
        await cleanupIndex(spaces);
        return spaces.shutdown();
    });

    describe('when testing space creation', () => {
        it('should be able to create a space', async () => {
            const created = await spaces.create({
                name: 'hello',
                views: ['hello']
            });

            const fetched = await spaces.findById(created.id);

            expect(created).toEqual(fetched);
        });
    });
});
