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

        // FIXME types
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
            it('DELETE - just testing setup is correct', async () => {
                const searchParams = await access.restrictSearchQuery('');
                const results = await client.search(searchParams);

                expect(mapResults(results)).toEqual(searchData);
            });

            // it('should correctly inner join', async () => {
            //     const query = 'bar:@bar';

            //     const searchParams = await access.restrictSearchQuery(
            //         '',
            //         {
            //             variables: { bar: ['bar2'] }
            //         }
            //     );
            //     console.log('===searchParams', JSON.stringify(searchParams, null, 4));
            //     const results = await client.search(searchParams);
            //     console.log('===res', JSON.stringify(results, null, 4));

            //     expect(results.hits.hits).toEqual([]);
            // });

            // it('should correctly inner join when using an AND', async () => {
            //     const response = await runRequest(fullRoleClient, `
            //     query {
            //         search_${endpoint} {
            //             fakeBar: _set(value: [])
            //             bar
            //             related: search_${endpoint}(query: "bar:@fakeBar AND foo:@foo") {
            //                 foo
            //             }
            //         }
            //     }
            // `);

            //     expect(response.results).toEqual([
            //         { bar: 'bar1', fakeBar: [], related: [] },
            //         { bar: 'bar2', fakeBar: [], related: [] },
            //         { bar: 'bar2', fakeBar: [], related: [] },
            //         { bar: 'bar3', fakeBar: [], related: [] },
            //         { bar: 'bar4', fakeBar: [], related: [] },
            //     ]);
            // });

            // it('should correctly inner join when using an OR', async () => {
            //     const response = await runRequest(fullRoleClient, `
            //     query {
            //         search_${endpoint} {
            //             fakeBar: _set(value: [])
            //             bar
            //             related: search_${endpoint}(query: "bar:@fakeBar OR foo:@foo") {
            //                 foo
            //             }
            //         }
            //     }
            // `);

            //     expect(response.results).toEqual([
            //         { bar: 'bar1', fakeBar: [], related: [{ foo: 'foo1' }] },
            //         { bar: 'bar2', fakeBar: [], related: [{ foo: 'foo2' }] },
            //         { bar: 'bar2', fakeBar: [], related: [{ foo: 'foo3' }] },
            //         { bar: 'bar3', fakeBar: [], related: [{ foo: 'foo4' }] },
            //         { bar: 'bar4', fakeBar: [], related: [] },
            //     ]);
            // });

            // it('should correctly inner join when using parens and OR', async () => {
            //     const response = await runRequest(fullRoleClient, `
            //     query {
            //         search_${endpoint} {
            //             fakeBar: _set(value: [])
            //             bar
            //             related: search_${endpoint}(query: "(bar:@fakeBar AND foo:@foo) OR bar:@bar") {
            //                 foo
            //             }
            //         }
            //     }
            // `);

            //     expect(response.results).toEqual([
            //         { bar: 'bar1', fakeBar: [], related: [{ foo: 'foo1' }] },
            //         { bar: 'bar2', fakeBar: [], related: [{ foo: 'foo2' }, { foo: 'foo3' }] },
            //         { bar: 'bar2', fakeBar: [], related: [{ foo: 'foo2' }, { foo: 'foo3' }] },
            //         { bar: 'bar3', fakeBar: [], related: [{ foo: 'foo4' }] },
            //         { bar: 'bar4', fakeBar: [], related: [] },
            //     ]);
            // });

            // it('should correctly inner join when using an parens and AND', async () => {
            //     const response = await runRequest(fullRoleClient, `
            //     query {
            //         search_${endpoint} {
            //             fakeBar: _set(value: [])
            //             bar
            //             related: search_${endpoint}(query: "(bar:@fakeBar AND foo:@foo) AND bar:@bar") {
            //                 foo
            //             }
            //         }
            //     }
            // `);

            //     expect(response.results).toEqual([
            //         { bar: 'bar1', fakeBar: [], related: [] },
            //         { bar: 'bar2', fakeBar: [], related: [] },
            //         { bar: 'bar2', fakeBar: [], related: [] },
            //         { bar: 'bar3', fakeBar: [], related: [] },
            //         { bar: 'bar4', fakeBar: [], related: [] },
            //     ]);
            // });
        });

        // describe('when the array has length', () => {
        //     it('should correctly inner join', async () => {
        //         const response = await runRequest(fullRoleClient, `
        //         query {
        //             search_${endpoint} {
        //                 fakeBar: _set(value: ["bar1", "bar3"])
        //                 bar
        //                 related: search_${endpoint}(query: "bar:@fakeBar") {
        //                     foo
        //                 }
        //             }
        //         }
        //     `);

        //         expect(response.results).toEqual([
        //             { bar: 'bar1', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo4' }] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo4' }] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo4' }] },
        //             { bar: 'bar3', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo4' }] },
        //             { bar: 'bar4', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo4' }] },
        //         ]);
        //     });

        //     it('should correctly inner join when using an AND', async () => {
        //         const response = await runRequest(fullRoleClient, `
        //         query {
        //             search_${endpoint} {
        //                 fakeBar: _set(value: ["bar1", "bar3"])
        //                 bar
        //                 related: search_${endpoint}(query: "bar:@fakeBar AND foo:@foo") {
        //                     foo
        //                 }
        //             }
        //         }
        //     `);

        //         expect(response.results).toEqual([
        //             { bar: 'bar1', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [] },
        //             { bar: 'bar3', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo4' }] },
        //             { bar: 'bar4', fakeBar: ['bar1', 'bar3'], related: [] },
        //         ]);
        //     });

        //     it('should correctly inner join when using an OR', async () => {
        //         const response = await runRequest(fullRoleClient, `
        //         query {
        //             search_${endpoint} {
        //                 fakeBar: _set(value: ["bar1", "bar3"])
        //                 bar
        //                 related: search_${endpoint}(query: "bar:@fakeBar OR foo:@foo") {
        //                     foo
        //                 }
        //             }
        //         }
        //     `);

        //         expect(response.results).toEqual([
        //             { bar: 'bar1', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo4' }] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo2' }, { foo: 'foo4' }] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo3' }, { foo: 'foo4' }] },
        //             { bar: 'bar3', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo4' }] },
        //             { bar: 'bar4', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }, { foo: 'foo4' }] },
        //         ]);
        //     });

        //     it('should correctly inner join when using parens and OR', async () => {
        //         const response = await runRequest(fullRoleClient, `
        //         query {
        //             search_${endpoint} {
        //                 fakeBar: _set(value: ["bar1", "bar3"])
        //                 bar
        //                 related: search_${endpoint}(query: "(bar:@fakeBar AND foo:@foo) OR bar:@bar") {
        //                     foo
        //                 }
        //             }
        //         }
        //     `);

        //         expect(response.results).toEqual([
        //             { bar: 'bar1', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo2' }, { foo: 'foo3' }] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo2' }, { foo: 'foo3' }] },
        //             { bar: 'bar3', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo4' }] },
        //             { bar: 'bar4', fakeBar: ['bar1', 'bar3'], related: [] },
        //         ]);
        //     });

        //     it('should correctly inner join when using an parens and AND', async () => {
        //         const response = await runRequest(fullRoleClient, `
        //         query {
        //             search_${endpoint} {
        //                 fakeBar: _set(value: ["bar1", "bar3"])
        //                 bar
        //                 related: search_${endpoint}(query: "(bar:@fakeBar AND foo:@foo) AND bar:@bar") {
        //                     foo
        //                 }
        //             }
        //         }
        //     `);

        //         expect(response.results).toEqual([
        //             { bar: 'bar1', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo1' }] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [] },
        //             { bar: 'bar2', fakeBar: ['bar1', 'bar3'], related: [] },
        //             { bar: 'bar3', fakeBar: ['bar1', 'bar3'], related: [{ foo: 'foo4' }] },
        //             { bar: 'bar4', fakeBar: ['bar1', 'bar3'], related: [] },
        //         ]);
        //     });
        // });
    });
});
