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

describe('indices.putTemplate', () => {
    let wrappedClient: WrappedClient;
    const index = 'test-indices-delete-template';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('should delete the template', async () => {
        const params = {
            name: 'great-test-template',
            include_type_name: false,
            order: 0,
            create: true,
            master_timeout: '60s' as TimeSpan,
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
        };

        const resp = await wrappedClient.indices.putTemplate(params);

        expect(resp.acknowledged).toBeTrue();
    });
});
