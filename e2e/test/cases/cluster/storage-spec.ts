import { TerasliceHarness } from '../../teraslice-harness.js';
import { TEST_OPENSEARCH } from '../../config.js';
import { debugLogger } from '@terascope/utils';

describe('job state', () => {
    let terasliceHarness: TerasliceHarness;
    const testLogger = debugLogger('storage-spec');


    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should have an index with dynamic mapping false', async () => {
        const mapping = await terasliceHarness.client.indices.getMapping({ index: '*__jobs' });
        testLogger.info('@@@@ mapping: ', mapping);
        const indexName = Object.keys(mapping)[0];
        const searchVersion = (await terasliceHarness.client.info()).version.number;
        testLogger.info('@@@@ searchVersion: ', searchVersion);
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
