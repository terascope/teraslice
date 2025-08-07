import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import { FieldType, type ClientMetadata } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess } from '../src/query-access/index.js';

const { makeClient, populateIndex, cleanupIndex } = ElasticsearchTestHelpers;

describe('vector searches', () => {
    const index = 'vector_search_';
    let client: Client;
    let clientMetadata: ClientMetadata | undefined;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            foo: { type: FieldType.Keyword },
            someVector: {
                type: FieldType.Vector,
                array: true,
                space_type: 'l2',
                dimension: 2,
                name: 'hnsw'
            },
            bool: { type: FieldType.Boolean }
        }
    });

    const searchData = [
        { someVector: [5.2, 4.4], foo: 'hello', bool: true },
        { foo: 'world', bool: false },
        { someVector: [5.2, 3.9], foo: 'hello', bool: false },
        { someVector: [4.9, 3.4] },
        { someVector: [4.2, 4.6], foo: 'baz' },
        { someVector: [3.3, 4.5], foo: 'buz' },
        { foo: 'roger roger' },
        { foo: 'hello', bool: false },
        { someVector: [9.2, 5.4], foo: 'hello', bool: true },
        { foo: 'fizzbuzz' },
        { someVector: [5.2, 3.8], foo: 'goodbye' },
        { someVector: [6.9, 7.4] },
        { someVector: [4.8, 4.1], foo: 'baz' },
        { someVector: [1.3, 2.5], foo: 'buz', bool: true },
        { foo: 'well hello there' },
        { foo: 'goodbye', bool: true }
    ];

    const access = new QueryAccess(
        {
            prevent_prefix_wildcard: true,
            allow_empty_queries: true,
            type_config: dataType.toXlucene()
        },
        {
            type_config: dataType.toXlucene(),
            filterNilVariables: true,
            variables: undefined
        }
    );

    beforeAll(async () => {
        client = await makeClient();
        clientMetadata = getClientMetadata(client);

        await populateIndex(client, index, dataType, searchData);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('should perform standalone vector searches preserving order', async () => {
        const searchParams = await access.restrictSearchQuery(
            'someVector:knn(vector:$vector k:3)',
            {
                variables: { vector: [5, 4] },
                ...clientMetadata,
            }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(3);
        expect(results).toMatchObject([
            { someVector: [5.2, 3.9], foo: 'hello', bool: false },
            { someVector: [4.8, 4.1], foo: 'baz' },
            { someVector: [5.2, 3.8], foo: 'goodbye' }
        ]);
    });

    it('should perform vector searches with AND filter criteria and preserve order', async () => {
        const searchParams = await access.restrictSearchQuery(
            'foo:"hello" AND someVector:knn(vector:$vector k:3)',
            {
                variables: { vector: [5, 4] },
                ...clientMetadata
            }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(3);
        expect(results).toMatchObject([
            { someVector: [5.2, 3.9], foo: 'hello', bool: false },
            { someVector: [5.2, 4.4], foo: 'hello', bool: true },
            { someVector: [9.2, 5.4], foo: 'hello', bool: true }
        ]);
    });

    it('should perform vector searches with OR filter criteria and NOT preserve order', async () => {
        const searchParams = await access.restrictSearchQuery(
            'foo:"hello" OR someVector:knn(vector:$vector k:3)',
            {
                variables: { vector: [5, 4] },
                ...clientMetadata
            }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(6);
        expect(results).toMatchObject([
            { someVector: [5.2, 4.4], foo: 'hello', bool: true }, // should match on foo, not knn, its diff is .6
            { someVector: [5.2, 3.9], foo: 'hello', bool: false }, // should match the knn as its a diff of .3
            { foo: 'hello', bool: false }, // should match on foo
            { someVector: [9.2, 5.4], foo: 'hello', bool: true }, // should match on foo, not knn
            { someVector: [5.2, 3.8], foo: 'goodbye' }, // should match the knn as its a diff of .4
            { someVector: [4.8, 4.1], foo: 'baz' } // should match the knn as its a diff of .3
        ]);
    });

    it('should work with multiple deep AND statements', async () => {
        const searchParams = await access.restrictSearchQuery(
            'foo:"hello" AND (bool:true AND someVector:knn(vector:$vector k:3))',
            {
                variables: { vector: [5, 4] },
                ...clientMetadata
            }
        );

        const response = await client.search(searchParams);

        const results = response.hits.hits.map((record) => record._source);

        expect(results.length).toEqual(2);
        expect(results).toMatchObject([
            { someVector: [5.2, 4.4], foo: 'hello', bool: true },
            { someVector: [9.2, 5.4], foo: 'hello', bool: true }
        ]);
    });
});
