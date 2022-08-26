import { debugLogger } from '@terascope/utils';
import { createClient, WrappedClient, Semver, } from '../../src';
import {
    getDistributionAndVersion
} from '../helpers/elasticsearch';

const testLogger = debugLogger('create-client-test');

const {
    version,
    host,
    distribution
} = getDistributionAndVersion();

const semver = version.split('.').map((i) => parseInt(i, 10)) as Semver;
const majorVersion = semver[0];

describe('indices.getTemplate', () => {
    let wrappedClient: WrappedClient;
    let client: any;
    const tempName = 'test-template-get';

    const settings = {
        number_of_shards: '3',
        number_of_replicas: '2'
    };

    const mappings = {
        properties: {
            name: { type: 'keyword' },
            uuid: { type: 'keyword' },
            created: { type: 'date' }
        }
    };

    const indexPatterns = ['test-template-get*'];

    const aliases = { template_test: {} };

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);

        if (majorVersion !== 6) {
            await client.indices.putIndexTemplate({
                name: tempName,
                body: {
                    index_patterns: indexPatterns,
                    template: {
                        settings,
                        mappings,
                        aliases
                    }
                }
            });
        }
    });

    afterAll(async () => {
        if (majorVersion !== 6) {
            await client.indices.deleteIndexTemplate({ name: tempName });
        }
    });

    it('should return template', async () => {
        const params = {
            name: tempName
        };

        if (majorVersion !== 6) {
            const resp = await wrappedClient.indices.getIndexTemplate(params);

            expect(resp).toEqual({
                index_templates: [
                    {
                        name: tempName,
                        index_template: {
                            index_patterns: indexPatterns,
                            template: {
                                settings: { index: settings },
                                mappings,
                                aliases
                            },
                            composed_of: []
                        },
                    }
                ]
            });
        }
    });
});
