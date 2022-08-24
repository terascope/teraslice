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

describe('ping', () => {
    let wrappedClient: WrappedClient;
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);
    });

    it('should return true if cluster is running', async () => {
        const resp = await wrappedClient.ping();

        expect(resp).toBe(true);
    });

    it('should throw an error if tried on a non-supported distribution', async () => {
        const badDistribution = new WrappedClient(client, distribution, [10, 0, 0]);

        await expect(() => badDistribution.ping()).rejects.toThrowError(`${distribution} version 10.0.0 is not supported`);
    });
});
