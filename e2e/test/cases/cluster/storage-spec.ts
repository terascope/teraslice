import { TerasliceHarness } from '../../teraslice-harness.js';

describe('mappings', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should have a jobs index with dynamic mapping false', async () => {
        const mapping = await terasliceHarness.client.indices.getMapping({ index: '*__jobs' });
        const indexName = Object.keys(mapping)[0];

        expect(mapping[indexName]).toMatchObject({
            mappings: expect.objectContaining({ dynamic: 'false' })
        });
    });
});
