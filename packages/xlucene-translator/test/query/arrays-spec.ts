import 'jest-extended';
import {
    xLuceneFieldType, xLuceneTypeConfig,
    type BulkParams, type ClientMetadata, type SearchResponse
} from '@terascope/types';
import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import { QueryAccess } from '../../src/query-access/index.js';
import type { RestrictSearchQueryOptions } from '../../src/query-access/interfaces.js';

type TestCase = [
    testTitle: string,
    query: string,
    options: RestrictSearchQueryOptions,
    results: any[]
];

type TestCaseCollection = Record<
    string, // type/title of tests represented
    [
        TestCase[],
        RestrictSearchQueryOptions?
    ]
>;

const { makeClient, waitForData, cleanupIndex } = ElasticsearchTestHelpers;

function mapResults(results: SearchResponse) {
    return results.hits.hits.map(({ _source }) => _source);
}

// in case future tests add more fields
const defaultOptions: RestrictSearchQueryOptions = {
    params: { _source_includes: ['bar', 'foo'] }
};

const arrayCases: TestCase[] = [
    [
        'should correctly inner join',
        'bar:@bar',
        {
            variables: { '@bar': ['bar2', 'bar4'] }
        },
        [
            { bar: 'bar2', foo: 'foo2' },
            { bar: 'bar2', foo: 'foo3' },
            { bar: 'bar4', foo: null }]
    ],
    [
        'should correctly inner join when using an AND',
        'bar:@bar AND foo:@foo',
        {
            variables: {
                '@bar': ['bar2', 'bar4'],
                '@foo': ['foo3', 'foo2']
            },
        },
        [
            { bar: 'bar2', foo: 'foo2' },
            { bar: 'bar2', foo: 'foo3' }
        ]
    ],
    [
        'should correctly inner join when using an OR',
        'bar:@bar OR foo:@foo',
        {
            variables: {
                '@bar': ['bar1'],
                '@foo': ['foo2', 'foo4']
            }
        },
        [
            { foo: 'foo1', bar: 'bar1' },
            { foo: 'foo2', bar: 'bar2' },
            { foo: 'foo4', bar: 'bar3' }
        ]
    ],
    [
        'should correctly inner join when using parens and OR',
        '(bar:@bar AND foo:@foo) OR bar:@bar2',
        {
            variables: {
                '@bar': ['bar2'],
                '@bar2': ['bar3'],
                '@foo': ['foo2', 'foo4']
            },
        },
        [
            { foo: 'foo2', bar: 'bar2' },
            { foo: 'foo4', bar: 'bar3' }
        ]
    ],
    [
        'should correctly inner join when using parens and AND',
        '(bar:@bar AND foo:@foo) AND bar:@bar2',
        {
            variables: {
                '@bar': ['bar3'],
                '@bar2': ['bar3'],
                '@foo': ['foo2', 'foo4']
            }
        },
        [
            { foo: 'foo4', bar: 'bar3' }
        ]
    ]
];

const emptyArrayCases: TestCase[] = [
    [
        'should correctly inner join',
        'bar:@bar',
        { variables: { '@bar': [] } },
        []
    ],
    [
        'should correctly inner join when using an AND',
        'bar:@bar AND foo:@foo',
        {
            variables: {
                '@bar': [],
                '@foo': ['foo2', 'foo4']
            }
        },
        []
    ],
    [
        'should correctly inner join when using an OR',
        'bar:@bar OR foo:@foo',
        {
            variables: {
                '@bar': [],
                '@foo': ['foo2', 'foo4']
            }
        },
        [
            { foo: 'foo2', bar: 'bar2' },
            { foo: 'foo4', bar: 'bar3' }
        ]
    ],
    [
        'should correctly inner join when using parens and OR',
        '(bar:@bar AND foo:@foo) OR bar:@bar2',
        {
            variables: {
                '@bar': [],
                '@bar2': ['bar3'],
                '@foo': ['foo2', 'foo4']
            }
        },
        [
            { foo: 'foo4', bar: 'bar3' }
        ]
    ],
    [
        'should correctly inner join when using parens and AND',
        '(bar:@bar AND foo:@foo) AND bar:@bar2',
        {
            variables: {
                '@bar': [],
                '@bar2': ['bar3'],
                '@foo': ['foo2', 'foo4']
            }
        },
        []
    ]
];

const arrays: [TestCase[], RestrictSearchQueryOptions?] = [arrayCases, defaultOptions];
const empty_arrays: [TestCase[], RestrictSearchQueryOptions?] = [emptyArrayCases, defaultOptions];

const testsCases: TestCaseCollection = {
    arrays: arrays,
    empty_arrays,
};

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
            type_config: typeConfig,
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

    for (const type in testsCases) {
        const [queries, defaultParams] = testsCases[type];
        describe(`when testing ${type}`, () => {
            describe.each(queries)('given query %s', (title, query, options, expectedResults) => {
                it(`${title}`, async () => {
                    const searchParams = await access.restrictSearchQuery(
                        query,
                        { ...options, ...clientMetadata, ...defaultParams, params: { index } }
                    );

                    const results = await client.search(searchParams);
                    expect(mapResults(results)).toEqual(expectedResults);
                });
            });
        });
    }
});
