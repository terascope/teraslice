import { debugLogger, get } from '@terascope/utils';
import { createClient, ElasticsearchTestHelpers } from '../src/index.js';

describe('can create an elasticsearch or opensearch client', () => {
    const testLogger = debugLogger('create-client-test');

    const {
        host, distribution: testDist,
        version: testVersion, majorVersion: testMajorVersion,
        minorVersion: testMinorVersion
    } = ElasticsearchTestHelpers.getTestENVClientInfo();

    it('can make a client', async () => {
        const { client, log } = await createClient({ node: host }, testLogger);

        expect(client).toBeDefined();
        expect(log).toBeDefined();

        const metadata = get(client, '__meta');
        expect(metadata).toBeDefined();

        const {
            distribution, version, majorVersion, minorVersion
        } = metadata;

        expect(distribution).toEqual(testDist);
        expect(version).toEqual(testVersion);
        expect(majorVersion).toEqual(testMajorVersion);
        expect(minorVersion).toEqual(testMinorVersion);
    });
});
