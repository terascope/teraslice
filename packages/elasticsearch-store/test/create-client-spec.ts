import { debugLogger, get } from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';
import { createClient } from '../src';
import { ELASTICSEARCH_HOST, ELASTICSEARCH_VERSION } from './helpers/config';

describe('can create an elasticsearch or opensearch client', () => {
    const testLogger = debugLogger('create-client-test');

    it('can make a client', async () => {
        const { client, log } = await createClient({
            node: ELASTICSEARCH_HOST
        }, testLogger);

        expect(client).toBeDefined();
        expect(log).toBeDefined();

        const metadata = get(client, '__meta');
        expect(metadata).toBeDefined();

        const { distribution, version } = metadata;

        expect(distribution).toEqual(ElasticsearchDistribution.elasticsearch);
        expect(version).toEqual(ELASTICSEARCH_VERSION);
    });
});
