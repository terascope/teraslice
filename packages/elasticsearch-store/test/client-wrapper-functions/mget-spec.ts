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
    const index = 'test-mget';
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

    it('should handle docs in body property', async () => {
        const params = {
            body: {
                docs:
                    [
                        { _index: 'test-mget', _id: '1' },
                        { _index: 'test-mget', _id: '7' },
                        { _index: 'test-mget', _id: '4' }
                    ]
            }
        };

        const resp = await wrappedClient.mget(params) as any;

        expect(resp.docs[0]._source.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
        expect(resp.docs[1]._source.uuid).toBe('b284b6c9-43bb-4c59-a4e4-fdb17b004300');
        expect(resp.docs[2]._source.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
    });

    it('should handle docs with _type doc objects', async () => {
        const params = {
            body: {
                docs:
                    [
                        { _index: 'test-mget', _id: '1', _type: docType },
                        { _index: 'test-mget', _id: '7', _type: docType },
                        { _index: 'test-mget', _id: '4', _type: docType }
                    ]
            }
        };

        const resp = await wrappedClient.mget(params) as any;

        expect(resp.docs[0]._source.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
        expect(resp.docs[1]._source.uuid).toBe('b284b6c9-43bb-4c59-a4e4-fdb17b004300');
        expect(resp.docs[2]._source.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
    });

    it('should handle ids in body property', async () => {
        const params = {
            index,
            body: {
                ids: ['1', '7', '4']
            }
        };

        const resp = await wrappedClient.mget(params) as any;

        expect(resp.docs.length).toBe(3);
        expect(resp.docs[0]._source.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
        expect(resp.docs[1]._source.uuid).toBe('b284b6c9-43bb-4c59-a4e4-fdb17b004300');
        expect(resp.docs[2]._source.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
    });

    it('should handle ids in body property with type', async () => {
        const params = {
            index,
            type: docType,
            body: {
                ids: ['1', '7', '4']
            }
        };

        const resp = await wrappedClient.mget(params) as any;

        expect(resp.docs.length).toBe(3);
        expect(resp.docs[0]._source.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
        expect(resp.docs[1]._source.uuid).toBe('b284b6c9-43bb-4c59-a4e4-fdb17b004300');
        expect(resp.docs[2]._source.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
    });
});
