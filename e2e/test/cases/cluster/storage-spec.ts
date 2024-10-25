import { TerasliceHarness } from '../../teraslice-harness.js';
import { TEST_OPENSEARCH } from '../../config.js';

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
        const searchVersion = terasliceHarness.client.__meta.version;
        if (!TEST_OPENSEARCH && searchVersion.charAt(0) === '6') {
            expect(mapping[indexName]).toMatchObject({
                mappings: {
                    job: expect.objectContaining({ dynamic: 'false' })
                }
            });
        } else {
            expect(mapping[indexName]).toMatchObject({
                mappings: expect.objectContaining({ dynamic: 'false' })
            });
        }
    });
});
