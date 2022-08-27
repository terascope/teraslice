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

describe('indices.putTemplate', () => {
    let wrappedClient: WrappedClient;
    const tempName = 'test-template-put';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);
    });

    afterAll(async () => {
        await client.indices.deleteTemplate({ name: tempName });
    });

    it('should save the template to the cluster', async () => {
        const params = {
            name: tempName,
            include_type_name: false,
            order: 0,
            create: true,
            master_timeout: '60s' as TimeSpan,
            body: {
                index_patterns: ['test-put-template'],
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
        };

        const resp = await wrappedClient.indices.putTemplate(params);

        expect(resp.acknowledged).toBeTrue();
    });
});
