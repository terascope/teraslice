import 'jest-extended';
import {
    xLuceneFieldType, xLuceneTypeConfig,
    type BulkParams, type ClientMetadata, type SearchResponse
} from '@terascope/types';
import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import { QueryAccess } from '../src/query-access/index.js';
import allTestCases from './cases/queries/index.js';

const { makeClient, waitForData, cleanupIndex } = ElasticsearchTestHelpers;

function mapResults(results: SearchResponse) {
    return results.hits.hits.map(({ _source }) => _source);
}

describe('Queries', () => {
    const typeConfig: xLuceneTypeConfig = {
        foo: xLuceneFieldType.String,
        bar: xLuceneFieldType.String,
        baz: xLuceneFieldType.Number
    };

    const access = new QueryAccess(
        {
            prevent_prefix_wildcard: true,
            allow_empty_queries: true,
            type_config: typeConfig
        },
        {
            filterNilVariables: true,
            variables: undefined
        }
    );

    const searchData = [
        {
            foo: 'foo1',
            bar: 'bar1'
        },
        {
            foo: 'foo2',
            bar: 'bar2' // same as below
        },
        {
            foo: 'foo3',
            bar: 'bar2'// same as above
        },
        {
            foo: 'foo4',
            bar: 'bar3'
        },
        {
            foo: null,
            bar: 'bar4'
        },
    ];

    let client: Client;
    const index = 'arrays';
    let clientMetadata: ClientMetadata | undefined;

    beforeAll(async () => {
        client = await makeClient();
        clientMetadata = getClientMetadata(client);

        await client.indices.create({ index });

        const bulkParams: BulkParams<unknown, unknown>['body'] = [];
        searchData.forEach(
            (el, _id) => {
                bulkParams.push({ index: { _index: index, _id } });
                bulkParams.push(el);
            }
        );
        await client.bulk({ index, body: bulkParams });
        await waitForData(client, index, searchData.length);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
    });

    it('should have populated the index', async () => {
        const searchParams = await access.restrictSearchQuery('', clientMetadata);
        const results = await client.search(searchParams);
        // console.dir({ searchParams, results }, { depth: 40 })
        expect(mapResults(results)).toEqual(searchData);
    });

    for (const type in allTestCases) {
        const [queries, defaultParams] = allTestCases[type];
        describe(`when testing ${type}`, () => {
            describe.each(queries)('given query %s', (title, query, options, expectedResults) => {
                it(`${title}`, async () => {
                    const searchParams = await access.restrictSearchQuery(
                        query,
                        { ...options, ...clientMetadata, ...defaultParams }
                    );
                    const results = await client.search(searchParams);
                    expect(mapResults(results)).toEqual(expectedResults);
                });
            });
        });
    }
});
