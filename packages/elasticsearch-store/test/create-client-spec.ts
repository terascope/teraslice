import { debugLogger } from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';
import { createClient } from '../src';
import { ELASTICSEARCH_HOST, ELASTICSEARCH_API_VERSION } from './helpers/config';

describe('can create an elasticsearch or opensearch client', () => {
    const testLogger = debugLogger('create-client-test');

    it('can make a client', async () => {
        const { client, log } = await createClient({
            node: ELASTICSEARCH_HOST
        }, testLogger);

        expect(client).toBeDefined();
        expect(log).toBeDefined();
        // @ts-expect-error
        expect(client.__meta).toBeDefined();
        // @ts-expect-error
        const { distribution, version } = client.__meta;

        expect(distribution).toEqual(ElasticsearchDistribution.elasticsearch);
        expect(version).toEqual(ELASTICSEARCH_API_VERSION);
    });
});
