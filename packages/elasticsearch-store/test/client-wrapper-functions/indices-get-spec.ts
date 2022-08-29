import { debugLogger, DataEntity } from '@terascope/utils';
import { createClient, WrappedClient, Semver, } from '../../src';
import { ExpandWildcards, TimeSpan } from '../../src/elasticsearch-client/method-helpers/interfaces';
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

describe('indices.get', () => {
    let wrappedClient: WrappedClient;
    const index = 'test-indices-get';
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

    it('should return mappings and settings for the index', async () => {
        const params = {
            index
        };

        const resp = await wrappedClient.indices.get(params);

        expect(resp).toHaveProperty(index);
        expect(resp[index]).toHaveProperty('settings');
        expect(resp[index]).toHaveProperty('mappings');
    });

    it('should return mappings and settings for multiple indices', async () => {
        const index2 = 'test-indices-get2';

        const testData = data.slice(0, 1).map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));
        await upload(client, { index: index2, type: docType }, testData);

        const params = {
            index: 'test-indices-g*'
        };

        const resp = await wrappedClient.indices.get(params);

        expect(resp).toHaveProperty(index);
        expect(resp[index]).toHaveProperty('settings');
        expect(resp[index]).toHaveProperty('mappings');

        expect(resp).toHaveProperty(index2);
        expect(resp[index2]).toHaveProperty('settings');
        expect(resp[index2]).toHaveProperty('mappings');
    });

    it('should handle detailed settings and mappings and settings for the index', async () => {
        const params = {
            index,
            include_type_name: true,
            local: true,
            ignore_unavailable: true,
            allow_no_indices: true,
            expand_wildcards: 'none' as ExpandWildcards,
            flat_settings: true,
            include_defaults: true,
            master_timeout: '60s' as TimeSpan
        };

        const resp = await wrappedClient.indices.get(params);

        expect(resp).toHaveProperty(index);
        expect(resp[index]).toHaveProperty('settings');
        expect(resp[index]).toHaveProperty('mappings');
    });
});
