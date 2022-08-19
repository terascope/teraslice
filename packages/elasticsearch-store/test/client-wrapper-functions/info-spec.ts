import { debugLogger } from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';
import { createClient, WrappedClient, Semver, } from '../../src';
import {
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_VERSION,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION
} from '../helpers/config';

const testLogger = debugLogger('create-client-test');

const config = { node: '' };
let expectedDistribution: ElasticsearchDistribution;
let expectedVersion: string;

if (process.env.TEST_OPENSEARCH != null) {
    config.node = OPENSEARCH_HOST;
    expectedDistribution = ElasticsearchDistribution.opensearch;
    expectedVersion = OPENSEARCH_VERSION;
} else {
    config.node = ELASTICSEARCH_HOST;
    expectedDistribution = ElasticsearchDistribution.elasticsearch;
    expectedVersion = ELASTICSEARCH_VERSION;
}

const semver = expectedVersion.split('.').map((i) => parseInt(i, 10)) as Semver;

describe('info', () => {
    let wrappedClient: WrappedClient;
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient(config, testLogger));

        wrappedClient = new WrappedClient(client, expectedDistribution, semver);
    });

    it('should return info about the cluster', async () => {
        const resp = await wrappedClient.info();

        expect(resp.cluster_name).toBe(expectedDistribution);
        expect(resp.version.number).toBe(expectedVersion);
    });
});
