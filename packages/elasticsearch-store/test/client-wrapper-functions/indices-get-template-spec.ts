import { debugLogger } from '@terascope/utils';
import { TimeSpan } from '../../src/elasticsearch-client/method-helpers/interfaces';
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

        await wrappedClient.indices.putTemplate({
            name: tempName,
            body: {
                index_patterns: indexPatterns,
                settings,
                mappings,
                aliases
            }
        });
    });

    afterAll(async () => {
        await client.indices.deleteTemplate({ name: tempName });
    });

    it('should return template', async () => {
        const params = {
            name: tempName,
            master_timeout: '60s' as TimeSpan,
            local: false,
            flat_settings: false
        };

        const resp = await wrappedClient.indices.getTemplate(params);

        if (distribution === 'elasticsearch' && majorVersion === 6) {
            if (semver[0] === 6) {
                expect(resp).toEqual({
                    [tempName]: {
                        order: 0,
                        index_patterns: indexPatterns,
                        settings: { index: settings },
                        mappings: { _doc: mappings },
                        aliases
                    }
                });
            }
        } else {
            expect(resp).toEqual({
                [tempName]: {
                    order: 0,
                    index_patterns: indexPatterns,
                    settings: { index: settings },
                    mappings,
                    aliases
                }
            });
        }
    });
});
