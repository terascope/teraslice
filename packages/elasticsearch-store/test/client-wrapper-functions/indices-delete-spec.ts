import { debugLogger, DataEntity } from '@terascope/utils';
import { createClient, WrappedClient, Semver, } from '../../src';
import {
    upload,
    cleanupIndex,
    waitForData,
    getDistributionAndVersion
} from '../helpers/elasticsearch';
import { data } from '../helpers/data';

const testLogger = debugLogger('create-client-test');

const {
    version,
    host,
    distribution
} = getDistributionAndVersion();

const semver = version.split('.').map((i) => parseInt(i, 10)) as Semver;

describe('indices.delete', () => {
    let wrappedClient: WrappedClient;
    const index = 'test-indices-delete';
    const docType = '_doc';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);

        const testData = data.slice(0, 1).map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

        await cleanupIndex(client, index);

        await upload(client, { index, type: docType }, testData);
        await waitForData(client, index, 1);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('should delete the index', async () => {
        const params = {
            index
        };

        const resp = await wrappedClient.indices.delete(params);

        expect(resp.acknowledged).toBeTrue();
    });
});
