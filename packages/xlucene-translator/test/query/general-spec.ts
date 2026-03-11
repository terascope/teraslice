import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import { has } from '@terascope/core-utils';
import { FieldType, type ClientMetadata } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess } from '../../src/query-access/index.js';

const { makeClient, populateIndex, cleanupIndex } = ElasticsearchTestHelpers;

describe('general searches', () => {
    const index = 'all_search_';
    let client: Client;
    let clientMetadata: ClientMetadata | undefined;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            bar: { type: FieldType.Keyword },
            baz: { type: FieldType.Keyword },
            bool: { type: FieldType.Boolean },
            num: { type: FieldType.Integer },
            location: { type: FieldType.GeoPoint },
            geoShape: { type: FieldType.GeoJSON }
        }
    });

    const searchData = [
        { bar: 'hello', bool: true, num: 50 },
        { bar: 'goodBye', bool: true, num: 60 },
        { bar: 'hello', bool: false, num: 70 },
        { bar: 'baz', bool: true, num: 50 },
        { bar: 'fizz', bool: false, num: 60 },
        { bar: 'fizzbuzz', bool: true, num: 80 },
        { bar: 'hello', bool: true, num: 40 },
        { baz: 'hello' },
        { num: 50 },
    ];

    const access = new QueryAccess(
        {
            prevent_prefix_wildcard: true,
            allow_implicit_queries: true,
            allow_empty_queries: true,
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

    describe('term grouping', () => {
        it('can handle * statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                '*',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );
            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(searchData.length);
        });

        it('can handle term statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'bar:hello',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(3);
            expect(results).toMatchObject([
                { bar: 'hello', bool: true, num: 50 },
                { bar: 'hello', bool: false, num: 70 },
                { bar: 'hello', bool: true, num: 40 },
            ]);
        });

        it('can handle wildcard statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'bar:h?llo',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(3);
            expect(results).toMatchObject([
                { bar: 'hello', bool: true, num: 50 },
                { bar: 'hello', bool: false, num: 70 },
                { bar: 'hello', bool: true, num: 40 },
            ]);
        });

        it('can handle regex statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'bar:/h.*o/',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(3);
            expect(results).toMatchObject([
                { bar: 'hello', bool: true, num: 50 },
                { bar: 'hello', bool: false, num: 70 },
                { bar: 'hello', bool: true, num: 40 },
            ]);
        });

        it('can handle _exists statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                '_exists_:bar',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);
            const expectedResults = searchData.filter((obj) => has(obj, 'bar')).length;

            expect(results.length).toEqual(expectedResults);
        });

        it('can handle > range statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'num:>50',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results).toEqual([
                { bar: 'goodBye', bool: true, num: 60 },
                { bar: 'hello', bool: false, num: 70 },
                { bar: 'fizz', bool: false, num: 60 },
                { bar: 'fizzbuzz', bool: true, num: 80 },
            ]);
        });

        it('can handle < range statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'num:<50',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results).toEqual([
                { bar: 'hello', bool: true, num: 40 },
            ]);
        });

        it('can handle <= range statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'num:<=50',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);
            // @ts-expect-error
            const expectedResults = searchData.filter((obj) => has(obj, 'num') && obj.num <= 50);

            expect(results).toEqual(expectedResults);
        });

        it('can handle >= range statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'num:>=50',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);
            // @ts-expect-error
            const expectedResults = searchData.filter((obj) => has(obj, 'num') && obj.num >= 50);

            expect(results).toEqual(expectedResults);
        });

        it('can handle [} range statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'num:{50 TO 70]',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);
            // @ts-expect-error
            const expectedResults = searchData.filter((obj) => has(obj, 'num') && obj.num > 50 && obj.num <= 70);

            expect(results).toEqual(expectedResults);
        });

        it('can handle multi field statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'ba*:hello',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results).toEqual([
                { bar: 'hello', bool: true, num: 50 },
                { bar: 'hello', bool: false, num: 70 },
                { bar: 'hello', bool: true, num: 40 },
                { baz: 'hello' }
            ]);
        });
    });

    describe('logical-grouping', () => {
        it('can fetch AND statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'bar:hello AND bool:true',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(2);
            expect(results).toMatchObject([
                { bar: 'hello', bool: true, num: 50 },
                { bar: 'hello', bool: true, num: 40 },
            ]);
        });

        it('can fetch OR statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'bar:fizz OR bool:false',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(2);
            expect(results).toMatchObject([
                { bar: 'hello', bool: false, num: 70 },
                { bar: 'fizz', bool: false, num: 60 },
            ]);
        });

        it('can fetch grouping statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                '(NOT bar:fizz AND num:60) OR num:>70',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(2);
            expect(results).toMatchObject([
                { bar: 'goodBye', bool: true, num: 60 },
                { bar: 'fizzbuzz', bool: true, num: 80 },

            ]);
        });
    });

    describe('field-group', () => {
        it('can fetch field grouped statements', async () => {
            const searchParams = await access.restrictSearchQuery(
                'num:( 10 OR 20 OR 30 OR 70)',
                { ...clientMetadata, params: { index, size: searchData.length } }
            );

            const response = await client.search(searchParams);

            const results = response.hits.hits.map((record) => record._source);

            expect(results.length).toEqual(1);
            expect(results).toMatchObject([
                { bar: 'hello', bool: false, num: 70 },
            ]);
        });
    });
});
