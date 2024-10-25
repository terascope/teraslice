import { TerasliceHarness } from '../../teraslice-harness.js';
import { TEST_OPENSEARCH } from '../../config.js';

describe('job state', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('should have an index with dynamic mapping false', async () => {
        const mapping = await terasliceHarness.client.indices.getMapping({ index: '*__jobs' });
        const indexName = Object.keys(mapping)[0];
        const searchVersion = (await terasliceHarness.client.info()).version.number;
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

    it('should make an index with dynamic mapping false', async () => {
        const params = {
            index: 'test_index',
            body: {
                settings: {
                    'index.number_of_shards': 5,
                    'index.number_of_replicas': 1
                },
                mappings: {
                    dynamic: false,
                    properties: {
                        active: {
                            type: 'boolean'
                        },
                        job_id: {
                            type: 'keyword'
                        },
                        _context: {
                            type: 'keyword'
                        },
                        _created: {
                            type: 'date'
                        },
                        _updated: {
                            type: 'date'
                        },
                        _deleted: {
                            type: 'boolean'
                        },
                        _deleted_on: {
                            type: 'date'
                        }
                    }
                }
            }
        };
        await terasliceHarness.client.indices.create(params);
        const mapping = await terasliceHarness.client.indices.getMapping({ index: 'test_index' });
        const indexName = Object.keys(mapping)[0];
        const searchVersion = (await terasliceHarness.client.info()).version.number;
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
