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
    getDistributionAndVersion,
    getTotalFormat
} from '../helpers/elasticsearch';
import { data } from '../helpers/data';

const testLogger = debugLogger('create-client-test');

const {
    version,
    host,
    distribution
} = getDistributionAndVersion();

const semver = version.split('.').map((i) => parseInt(i, 10)) as Semver;

const total = getTotalFormat(distribution, semver[0], 1);

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
            body: [
                { index },
                { query: { match: { uuid: 'bd920141-45b3-41fd-8eea-b1640a2fa3d2' } } },
                { index },
                { query: { match: { uuid: 'b23a8550-0081-453f-9e80-93a90782a5bd' } } }
            ]
        };

        const resp = await wrappedClient.msearch(params);

        expect(resp.responses.length).toBe(2);

        expect(resp.responses[0].hits.total).toEqual(total);
        expect(resp.responses[0].hits.hits[0]._source.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
        expect(resp.responses[1].hits.total).toEqual(total);
        expect(resp.responses[1].hits.hits[0]._source.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
    });

    it('should handle type in params and return requested records', async () => {
        const params = {
            index,
            type: docType,
            body: [
                { index, type: docType },
                { query: { match: { uuid: 'bd920141-45b3-41fd-8eea-b1640a2fa3d2' } } },
                { index, type: docType },
                { query: { match: { uuid: 'b23a8550-0081-453f-9e80-93a90782a5bd' } } }
            ]
        };

        const resp = await wrappedClient.msearch(params);

        expect(resp.responses.length).toBe(2);

        expect(resp.responses[0].hits.total).toEqual(total);
        expect(resp.responses[0].hits.hits[0]._source.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
        expect(resp.responses[1].hits.total).toEqual(total);
        expect(resp.responses[1].hits.hits[0]._source.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
    });

    it('should handle ccs_minimize_roundtrips in params and return requested records', async () => {
        const params = {
            ccs_minimize_roundtrips: true,
            body: [
                { index, type: docType },
                { query: { match: { uuid: 'bd920141-45b3-41fd-8eea-b1640a2fa3d2' } } },
                { index, type: docType },
                { query: { match: { uuid: 'b23a8550-0081-453f-9e80-93a90782a5bd' } } }
            ]
        };

        const resp = await wrappedClient.msearch(params);

        expect(resp.responses.length).toBe(2);

        expect(resp.responses[0].hits.total).toEqual(total);
        expect(resp.responses[0].hits.hits[0]._source.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
        expect(resp.responses[1].hits.total).toEqual(total);
        expect(resp.responses[1].hits.hits[0]._source.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
    });
});
