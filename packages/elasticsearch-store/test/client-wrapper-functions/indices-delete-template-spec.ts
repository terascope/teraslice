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

describe('indices.deleteTemplate', () => {
    let wrappedClient: WrappedClient;
    const tempName = 'test-template-delete';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);

        await wrappedClient.indices.putTemplate({
            name: tempName,
            body: {
                index_patterns: ['test-delete-template'],
                settings: {
                    number_of_shards: 3,
                    number_of_replicas: 2
                },
                mappings: {
                    properties: {
                        name: { type: 'keyword' },
                        uuid: { type: 'keyword' },
                        created: { type: 'date' }
                    }
                },
                aliases: {
                    template_test: {}
                }
            }
        });
    });

    afterAll(async () => {
        await client.indices.deleteTemplate({ name: tempName });
    });

    it('should delete the template', async () => {
        const params = {
            name: tempName,
            master_timeout: '60s' as TimeSpan
        };

        const resp = await wrappedClient.indices.deleteTemplate(params);

        expect(resp.acknowledged).toBeTrue();
    });
});
