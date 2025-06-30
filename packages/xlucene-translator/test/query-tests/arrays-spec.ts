import 'jest-extended';
import { FieldType, SearchResponse } from '@terascope/types';
import { QueryAccess } from 'xlucene-translator';
import {
    Client, ElasticsearchTestHelpers, makeRecordDataType
} from 'elasticsearch-store';

function mapResults(results: SearchResponse) {
    return results.hits.hits.map(({ _source }) => _source);
}

describe('Array Queries', () => {
    const dataType = makeRecordDataType({
        name: 'XluceneTranslatorArrays',
        fields: {
            foo: { type: FieldType.Keyword },
            bar: { type: FieldType.Keyword },
        }
    });

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

    beforeAll(async () => {
        client = await ElasticsearchTestHelpers.makeClient();
        await client.indices.create({ index });

        const bulkParams: any[] = [];
        searchData.forEach(
            (el, _id) => {
                bulkParams.push({ index: { _index: index, _id } });
                bulkParams.push(el);
            }
        );

        await client.bulk({ index, body: bulkParams });
        await client.indices.refresh();
    });

    afterAll(async () => {
        await ElasticsearchTestHelpers.cleanupIndex(client, index);
    });

    describe('when joining on array variables', () => {
        describe('when the array is empty', () => {
            it('should correctly inner join', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'bar:@bar',
                    { variables: { '@bar': [] } }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([]);
            });

            it('should correctly inner join when using an AND', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'bar:@bar AND foo:@foo',
                    {
                        variables: {
                            '@bar': [],
                            '@foo': ['foo2', 'foo4']
                        }
                    }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([]);
            });

            it('should correctly inner join when using an OR', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'bar:@bar OR foo:@foo',
                    {
                        variables: {
                            '@bar': [],
                            '@foo': ['foo2', 'foo4']
                        }
                    }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([
                    { foo: 'foo2', bar: 'bar2' },
                    { foo: 'foo4', bar: 'bar3' }
                ]);
            });

            it('should correctly inner join when using parens and OR', async () => {
                const searchParams = await access.restrictSearchQuery(
                    '(bar:@bar AND foo:@foo) OR bar:@bar2',
                    {
                        variables: {
                            '@bar': [],
                            '@bar2': ['bar3'],
                            '@foo': ['foo2', 'foo4']
                        }
                    }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([
                    { foo: 'foo4', bar: 'bar3' }
                ]);
            });

            it('should correctly inner join when using an parens and AND', async () => {
                const searchParams = await access.restrictSearchQuery(
                    '(bar:@bar AND foo:@foo) AND bar:@bar2',
                    {
                        variables: {
                            '@bar': [],
                            '@bar2': ['bar3'],
                            '@foo': ['foo2', 'foo4']
                        }
                    }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([]);
            });
        });

        describe('when the array has length', () => {
            it('should correctly inner join', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'bar:@bar',
                    { variables: { '@bar': ['bar2', 'bar4'] } }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([
                    { bar: 'bar2', foo: 'foo2' },
                    { bar: 'bar2', foo: 'foo3' },
                    { bar: 'bar4', foo: null }
                ]);
            });

            it('should correctly inner join when using an AND', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'bar:@bar AND foo:@foo',
                    {
                        variables: {
                            '@bar': ['bar2', 'bar4'],
                            '@foo': ['foo3', 'foo2']
                        }
                    }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([
                    { bar: 'bar2', foo: 'foo2' },
                    { bar: 'bar2', foo: 'foo3' }
                ]);
            });

            it('should correctly inner join when using an OR', async () => {
                const searchParams = await access.restrictSearchQuery(
                    'bar:@bar OR foo:@foo',
                    {
                        variables: {
                            '@bar': ['bar1'],
                            '@foo': ['foo2', 'foo4']
                        }
                    }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([
                    { foo: 'foo1', bar: 'bar1' },
                    { foo: 'foo2', bar: 'bar2' },
                    { foo: 'foo4', bar: 'bar3' }
                ]);
            });

            it('should correctly inner join when using parens and OR', async () => {
                const searchParams = await access.restrictSearchQuery(
                    '(bar:@bar AND foo:@foo) OR bar:@bar2',
                    {
                        variables: {
                            '@bar': ['bar2'],
                            '@bar2': ['bar3'],
                            '@foo': ['foo2', 'foo4']
                        }
                    }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([
                    { foo: 'foo2', bar: 'bar2' },
                    { foo: 'foo4', bar: 'bar3' }
                ]);
            });

            it('should correctly inner join when using an parens and AND', async () => {
                const searchParams = await access.restrictSearchQuery(
                    '(bar:@bar AND foo:@foo) AND bar:@bar2',
                    {
                        variables: {
                            '@bar': ['bar3'],
                            '@bar2': ['bar3'],
                            '@foo': ['foo2', 'foo4']
                        }
                    }
                );
                const results = await client.search(searchParams);
                expect(mapResults(results)).toEqual([
                    { foo: 'foo4', bar: 'bar3' }
                ]);
            });
        });
    });
});
