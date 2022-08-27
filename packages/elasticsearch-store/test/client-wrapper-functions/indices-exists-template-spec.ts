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

describe('indices.existsTemplate', () => {
    let wrappedClient: WrappedClient;
    let client: any;
    const tempName = 'test-template-exists';

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);

        await wrappedClient.indices.putTemplate({
            name: tempName,
            body: {
                index_patterns: ['test-template-exists*'],
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

    it('should return true if template exists', async () => {
        const params = {
            name: tempName,
            master_timeout: '60s' as TimeSpan,
            local: false,
            flat_settings: false
        };

        const resp = await wrappedClient.indices.existsTemplate(params);

        expect(resp).toBeTrue();
    });

    it('should return false if template does not exist', async () => {
        const params = {
            name: 'not-exists',
            master_timeout: '60s' as TimeSpan,
            local: false,
            flat_settings: false
        };

        const resp = await wrappedClient.indices.existsTemplate(params);

        expect(resp).toBeFalse();
    });
});
