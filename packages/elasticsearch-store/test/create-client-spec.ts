import { debugLogger, get } from '@terascope/utils';
import { createClient } from '../src';
import { getDistributionAndVersion } from './helpers/elasticsearch';

describe('can create an elasticsearch or opensearch client', () => {
    const testLogger = debugLogger('create-client-test');

    const distributionData = getDistributionAndVersion();

    it('can make a client', async () => {
        const { client, log } = await createClient({ node: distributionData.host }, testLogger);

        expect(client).toBeDefined();
        expect(log).toBeDefined();

        const metadata = get(client, '__meta');
        expect(metadata).toBeDefined();

        const { distribution, version } = metadata;

        expect(distribution).toEqual(distributionData.distribution);
        expect(version).toEqual(distributionData.version);
    });
});
