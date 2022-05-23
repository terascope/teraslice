import { debugLogger, get } from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';
import { createClient } from '../src';
import {
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_VERSION,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION
} from './helpers/config';

describe('can create an elasticsearch or opensearch client', () => {
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

    it('can make a client', async () => {
        const { client, log } = await createClient(config, testLogger);

        expect(client).toBeDefined();
        expect(log).toBeDefined();

        const metadata = get(client, '__meta');
        expect(metadata).toBeDefined();

        const { distribution, version } = metadata;

        expect(distribution).toEqual(expectedDistribution);
        expect(version).toEqual(expectedVersion);
    });
});
