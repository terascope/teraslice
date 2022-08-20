import { debugLogger, DataEntity } from '@terascope/utils';
import {
    createClient,
    WrappedClient,
    Semver
} from '../../src';
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

describe('search', () => {
    let wrappedClient: WrappedClient;
    const index = 'test-msearch';
    const docType = '_doc';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);

        const testData = data.slice(0, 10)
            .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

        await cleanupIndex(client, index);

        await upload(client, { index, type: docType }, testData);
        await waitForData(client, index, 10);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('should return requested records', async () => {
        const params = {
            index,
            body: [
                {},
                { query: { match: { uuid: 'bd920141-45b3-41fd-8eea-b1640a2fa3d2' } } },
                { index },
                { query: { match: { uuid: 'b23a8550-0081-453f-9e80-93a90782a5bd' } } }
            ]
        };

        const resp = await wrappedClient.search(params);

        console.log(resp);
    });
});
