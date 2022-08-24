import { debugLogger } from '@terascope/utils';
import {
    createClient,
    WrappedClient,
    Semver
} from '../../src';
import { getDistributionAndVersion } from '../helpers/elasticsearch';

const testLogger = debugLogger('create-client-test');

const {
    version,
    host,
    distribution
} = getDistributionAndVersion();

const semver = version.split('.').map((i) => parseInt(i, 10)) as Semver;

describe('info', () => {
    let wrappedClient: WrappedClient;
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);
    });

    it('should return info about the cluster', async () => {
        const resp = await wrappedClient.info();

        if (distribution === 'elasticsearch') {
            if (semver[0] === 8) {
                expect(resp.cluster_name).toBe('docker-cluster');
            } else {
                expect(resp.cluster_name).toBe(distribution);
            }
        }

        if (distribution === 'opensearch') {
            expect(resp.cluster_name).toBe('docker-cluster');
            expect(resp.version.distribution).toBe('opensearch');
        }

        expect(resp.version.number).toBe(version);
    });

    it('should throw an error if tried on a non-supported distribution', async () => {
        const badDistribution = new WrappedClient(client, distribution, [3, 2, 1]);

        await expect(() => badDistribution.ping()).rejects.toThrowError(`Unsupported ${distribution} version: 3.2.1`);
    });
});
