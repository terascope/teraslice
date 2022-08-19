import { debugLogger, DataEntity } from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';
import { createClient, WrappedClient, Semver, } from '../../src';
import { upload, cleanupIndex, waitForData } from '../helpers/elasticsearch';
import {
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_VERSION,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION
} from '../helpers/config';
import { data } from '../helpers/data';

const testLogger = debugLogger('create-client-test');

const config = { node: '' };
let expectedDistribution: ElasticsearchDistribution;
let expectedVersion: string;

if (process.env.TEST_OPENSEARCH != null) {
    config.node = OPENSEARCH_HOST;
    expectedDistribution = ElasticsearchDistribution.opensearch;
    expectedVersion = OPENSEARCH_VERSION;
} else {
    config.node = ELASTICSEARCH_HOST;
    expectedDistribution = ElasticsearchDistribution.elasticsearch;
    expectedVersion = ELASTICSEARCH_VERSION;
}

const semver = expectedVersion.split('.').map((i) => parseInt(i, 10)) as Semver;

describe('exists', () => {
    let wrappedClient: WrappedClient;
    const index = 'test-exists';
    const docType = '_doc';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient(config, testLogger));

        wrappedClient = new WrappedClient(client, expectedDistribution, semver);

        const testData = data.slice(0, 1).map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

        await cleanupIndex(client, index);

        await upload(client, { index, type: docType }, testData);
        await waitForData(client, index, 1);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('should return true if the record exists', async () => {
        const params = {
            id: '1',
            index
        };

        const resp = await wrappedClient.exists(params);

        expect(resp).toBe(true);
    });

    it('should return false if the record does not exist', async () => {
        const params = {
            id: '2',
            index
        };

        const resp = await wrappedClient.exists(params);

        expect(resp).toBe(false);
    });

    it('should return response with complex params', async () => {
        const params = {
            id: '1',
            index,
            type: '_doc',
            preference: '_local',
            realtime: true,
            refresh: false,
            routing: '1'
        };

        const resp = await wrappedClient.exists(params);

        expect(resp).toBe(true);
    });
});
