import * as opensearch from '@opensearch-project/opensearch';
import * as es6 from 'elasticsearch6';
import Wrapper from '../src/elasticsearch-client/client_wrapper';
import {
    ELASTICSEARCH_HOST,
    OPENSEARCH_HOST
} from './helpers/config';

describe('Client Wrapper', () => {
    it('should return true if can ping client host, es', async () => {
        const client = new es6.Client({ node: ELASTICSEARCH_HOST });

        const wrapper = new Wrapper(client as any);

        const resp = await wrapper.ping();

        expect(resp).toBe(true);
    });

    it('should return true if can ping client host, opensource', async () => {
        const client = new opensearch.Client({ node: OPENSEARCH_HOST });

        const wrapper = new Wrapper(client as any);

        const resp = await wrapper.ping();

        expect(resp).toBe(true);
    });

    it('should return cluster info', async () => {
        const client = new es6.Client({ node: ELASTICSEARCH_HOST });

        const wrapper = new Wrapper(client as any);

        const resp = await wrapper.info();

        console.log(resp);
    });

    it('should return false if index does not exist', async () => {
        const client = new es6.Client({ node: ELASTICSEARCH_HOST });

        const wrapper = new Wrapper(client as any);

        const params = {
            index: 'test-2'
        };

        const resp = await wrapper.indices.exists(params);

        expect(resp).toBe(false);
    });
});
