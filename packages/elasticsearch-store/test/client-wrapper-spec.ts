import { debugLogger, get, toNumber } from '@terascope/utils';
import { WrappedClient, createClient } from '../src';
import {
    ELASTICSEARCH_HOST,
    OPENSEARCH_HOST,
} from './helpers/config';

describe('Client Wrapper', () => {
    const testLogger = debugLogger('client-wrapper-test');
    const config = { node: '' };

    let client: WrappedClient;

    if (process.env.TEST_OPENSEARCH != null) {
        config.node = OPENSEARCH_HOST;
    } else {
        config.node = ELASTICSEARCH_HOST;
    }

    beforeAll(async () => {
        const { client: testClient } = await createClient(config, testLogger);
        const { distribution, version } = get(client, '__meta');
        const parsedVersion = version.split('.').map(toNumber);

        client = new WrappedClient(testClient, distribution, parsedVersion);
    });

    it('should return true if can ping client host, es', async () => {
        const resp = await client.count({ routing: '', q: '', ignore_throttled: true, query: {}});

        expect(resp).toBe(true);
    });

    // it('should return true if can ping client host, opensource', async () => {
    //     const client = new opensearch.Client({ node: OPENSEARCH_HOST });

    //     const wrapper = new Wrapper(client as any);

    //     const resp = await wrapper.ping();

    //     expect(resp).toBe(true);
    // });

    // it('should return cluster info', async () => {
    //     const client = new es6.Client({ node: ELASTICSEARCH_HOST });

    //     const wrapper = new Wrapper(client as any);

    //     const resp = await wrapper.info();

    //     console.log(resp);
    // });

    // it('should return false if index does not exist', async () => {
    //     const client = new es6.Client({ node: ELASTICSEARCH_HOST });

    //     const wrapper = new Wrapper(client as any);

    //     const params = {
    //         index: 'test-2'
    //     };

    //     const resp = await wrapper.indices.exists(params);

    //     expect(resp).toBe(false);
    // });
});
