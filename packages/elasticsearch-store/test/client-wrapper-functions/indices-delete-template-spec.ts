import { debugLogger } from '@terascope/utils';
import { TimeSpan } from '../../src/elasticsearch-client/method-helpers/interfaces';
import { createClient, WrappedClient, Semver, } from '../../src';
import {
    cleanupIndex,
    getDistributionAndVersion
} from '../helpers/elasticsearch';

const testLogger = debugLogger('create-client-test');

const {
    version,
    host,
    distribution
} = getDistributionAndVersion();

const semver = version.split('.').map((i) => parseInt(i, 10)) as Semver;

describe('indices.deleteTemplate', () => {
    let wrappedClient: WrappedClient;
    const index = 'test-indices-delete-template';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        await client.indices.putTemplate({
            name: 'great-test-template',
            body: {
                index_patterns: ['test-delete-template'],
                template: {
                    settings: {
                        number_of_shards: 3,
                        number_of_replicas: 2
                    },
                    mappings: {
                        properties: {
                            name: { type: 'keyword' },
                            uuid: { type: 'uuid' },
                            created: { type: 'date' }
                        }
                    },
                    aliases: {
                        template_test: {}
                    }
                }
            }
        });

        wrappedClient = new WrappedClient(client, distribution, semver);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('should delete the template', async () => {
        const params = {
            name: 'great-test-template',
            master_timeout: '60s' as TimeSpan,
            timeout: '60s' as TimeSpan
        };

        const resp = await wrappedClient.indices.deleteTemplate(params);

        console.log(JSON.stringify(resp, null, 2));

        expect(resp.acknowledged).toBeTrue();
    });
});
