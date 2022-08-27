import { debugLogger, DataEntity } from '@terascope/utils';
import { createClient, WrappedClient, Semver, } from '../../src';
import { ExpandWildcards } from '../../src/elasticsearch-client/method-helpers/interfaces';
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

describe('indices.exists', () => {
    let wrappedClient: WrappedClient;
    const index = 'test-indices-exists';
    const anotherIndex = 'test-indices-exists2';
    const docType = '_doc';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);

        const testData = data.slice(0, 1).map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

        await cleanupIndex(client, index);
        await cleanupIndex(client, anotherIndex);

        await upload(client, { index, type: docType }, testData);
        await upload(client, { index: anotherIndex, type: docType }, testData);
        await waitForData(client, index, 1);
    });

    afterAll(async () => {
        await Promise.all([
            cleanupIndex(client, index),
            cleanupIndex(client, anotherIndex)
        ]);
    });

    it('should return true is index exists', async () => {
        const params = {
            index
        };

        const resp = await wrappedClient.indices.exists(params);

        expect(resp).toBeTrue();
    });

    it('should return true if index exists with parameters', async () => {
        const params = {
            index,
            allow_no_indices: false,
            expand_wildcards: 'open' as ExpandWildcards,
            flat_settings: true,
            include_defaults: true,
            ignore_unavailable: true,
            local: true
        };

        const resp = await wrappedClient.indices.exists(params);

        expect(resp).toBeTrue();
    });

    it('should return true if all indices exist', async () => {
        const params = {
            index: [index, anotherIndex],
            allow_no_indices: false,
            expand_wildcards: 'open' as ExpandWildcards,
            flat_settings: true,
            include_defaults: true,
            ignore_unavailable: true,
            local: true
        };

        const resp = await wrappedClient.indices.exists(params);

        expect(resp).toBeTrue();
    });
});
