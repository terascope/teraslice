import { debugLogger, DataEntity } from '@terascope/utils';
import { createClient, WrappedClient, Semver, } from '../../src';
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
    const index = 'test-search';
    const docType = '_doc';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);

        const testData = data.slice(0, 10).map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

        await cleanupIndex(client, index);

        await upload(client, { index, type: docType }, testData);
        await waitForData(client, index, 10);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('should return record on q search', async () => {
        const params = {
            index,
            q: 'uuid:bea4086e-6f2e-4f4b-a1bf-c20330f92e8c'
        };

        const resp = await wrappedClient.search(params);

        expect(resp.hits.total).toEqual(total);

        expect(resp.hits.hits[0]._source).toEqual({
            ip: '143.174.175.238',
            userAgent: 'Mozilla/5.0 (Windows; U; Windows NT 6.3) AppleWebKit/531.0.0 (KHTML, like Gecko) Chrome/22.0.897.0 Safari/531.0.0',
            url: 'http://dedrick.biz',
            uuid: 'bea4086e-6f2e-4f4b-a1bf-c20330f92e8c',
            created: '2019-04-26T15:00:23.213+00:00',
            ipv6: '5b2a:9397:6e8c:ac74:63a0:799c:00b5:92d2',
            location: '88.04393, -35.42878',
            bytes: 188644
        });
    });

    it('should return record with type and index in search', async () => {
        const params = {
            type: docType,
            index,
            q: 'uuid:bea4086e-6f2e-4f4b-a1bf-c20330f92e8c'
        };

        const resp = await wrappedClient.search(params);

        expect(resp.hits.total).toEqual(total);
        expect(resp.hits.hits[0]._source).toEqual({
            ip: '143.174.175.238',
            userAgent: 'Mozilla/5.0 (Windows; U; Windows NT 6.3) AppleWebKit/531.0.0 (KHTML, like Gecko) Chrome/22.0.897.0 Safari/531.0.0',
            url: 'http://dedrick.biz',
            uuid: 'bea4086e-6f2e-4f4b-a1bf-c20330f92e8c',
            created: '2019-04-26T15:00:23.213+00:00',
            ipv6: '5b2a:9397:6e8c:ac74:63a0:799c:00b5:92d2',
            location: '88.04393, -35.42878',
            bytes: 188644
        });
    });

    it('should return record with body search', async () => {
        const params = {
            type: docType,
            index,
            body: {
                query: {
                    match: {
                        uuid: 'bea4086e-6f2e-4f4b-a1bf-c20330f92e8c'
                    }
                }
            }
        };

        const resp = await wrappedClient.search(params);

        expect(resp.hits.total).toEqual(total);
        expect(resp.hits.hits[0]._source).toEqual({
            ip: '143.174.175.238',
            userAgent: 'Mozilla/5.0 (Windows; U; Windows NT 6.3) AppleWebKit/531.0.0 (KHTML, like Gecko) Chrome/22.0.897.0 Safari/531.0.0',
            url: 'http://dedrick.biz',
            uuid: 'bea4086e-6f2e-4f4b-a1bf-c20330f92e8c',
            created: '2019-04-26T15:00:23.213+00:00',
            ipv6: '5b2a:9397:6e8c:ac74:63a0:799c:00b5:92d2',
            location: '88.04393, -35.42878',
            bytes: 188644
        });
    });
});
