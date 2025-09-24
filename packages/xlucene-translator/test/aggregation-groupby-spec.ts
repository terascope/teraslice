import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import { FieldType, type ClientMetadata } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { get, uniq, isNotNil } from '@terascope/utils';
import { QueryAccess } from '../src/query-access/index.js';

const { makeClient, populateIndex, cleanupIndex } = ElasticsearchTestHelpers;

describe('aggregation like searches', () => {
    const index = 'aggregation_search_';
    let client: Client;
    let clientMetadata: ClientMetadata | undefined;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            foo: { type: FieldType.Keyword },
            num: { type: FieldType.Number },
            bool: { type: FieldType.Boolean },
            restrictedField: { type: FieldType.Keyword }
        }
    });

    const searchData = [
        { num: 5, foo: 'hello', bool: true, restrictedField: 'fizz' },
        { foo: 'world', bool: false },
        { num: 3, foo: 'hello', bool: false, restrictedField: 'fizz' },
        { num: 9 },
        { num: 6, foo: 'baz', restrictedField: 'fizz' },
        { num: 5, foo: 'buz' },
        { foo: 'roger roger', restrictedField: 'fizz' },
        { foo: 'hello', bool: false },
        { num: 2, foo: 'hello', bool: true, restrictedField: 'fizz' },
        { foo: 'fizzbuzz' },
        { num: 8, foo: 'goodbye', restrictedField: 'fizz' },
        { num: 7 },
        { num: 1, foo: 'baz', restrictedField: 'fizz' },
        { num: 3, foo: 'buz', bool: true },
        { foo: 'well hello there', restrictedField: 'fizz' },
        { foo: 'goodbye', bool: true }
    ];

    const access = new QueryAccess(
        {
            prevent_prefix_wildcard: true,
            allow_empty_queries: true,
            type_config: dataType.toXlucene(),
            excludes: ['restrictedField']
        },
        {
            type_config: dataType.toXlucene(),
            filterNilVariables: true,
            variables: undefined,
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

    // TODO add tests restricting aggregations and groupBy fields

    it('should perform standalone sum aggregation searches', async () => {
        const searchParams = await access.restrictSearchQuery(
            '',
            {
                aggregations: [{ field: 'num', aggregation: 'sum' }],
                ...clientMetadata,
            }
        );

        const expectedSumResult = searchData.reduce((prev, curr) => {
            if (curr.num) return prev + curr.num;
            return prev;
        }, 0);

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.value');

        expect(result).toBeDefined();
        expect(result).toEqual(expectedSumResult);
        expect(result).toBeGreaterThan(0);
    });

    it('should perform query filter along with sum aggregation searches', async () => {
        const searchParams = await access.restrictSearchQuery(
            'bool:true',
            {
                aggregations: [{ field: 'num', aggregation: 'sum' }],
                ...clientMetadata,
            }
        );

        const expectedSumResult = searchData.filter((record) => {
            if (record.num !== undefined && record.bool === true) {
                return record;
            }
        }).reduce((prev, curr) => {
            if (curr.num) return prev + curr.num;
            return prev;
        }, 0);

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.value');

        expect(result).toBeDefined();
        expect(result).toEqual(expectedSumResult);
        expect(result).toBeGreaterThan(0);
    });

    it('should perform standalone min aggregation searches', async () => {
        const searchParams = await access.restrictSearchQuery(
            '',
            {
                aggregations: [{ field: 'num', aggregation: 'min' }],
                ...clientMetadata,
            }
        );

        const expectedMinResult = Math.min(
            ...searchData.map((data) => data.num)
                .filter((num) => num !== undefined)
        );

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.value');

        expect(result).toBeDefined();
        expect(result).toEqual(expectedMinResult);
        expect(result).toBeGreaterThan(0);
    });

    it('should perform query filter along with min aggregation searches', async () => {
        const searchParams = await access.restrictSearchQuery(
            'bool:true',
            {
                aggregations: [{ field: 'num', aggregation: 'min' }],
                ...clientMetadata,
            }
        );

        const expectedMinResult = Math.min(
            ...searchData.filter((record) => {
                if (record.num !== undefined && record.bool === true) {
                    return record;
                }
            })
                .map((record) => record.num)
                .filter((num) => num !== undefined)
        );

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.value');

        expect(result).toBeDefined();
        expect(result).toEqual(expectedMinResult);
        expect(result).toBeGreaterThan(0);
    });

    it('should perform standalone max aggregation searches', async () => {
        const searchParams = await access.restrictSearchQuery(
            '',
            {
                aggregations: [{ field: 'num', aggregation: 'max' }],
                ...clientMetadata,
            }
        );

        const expectedMaxResult = Math.max(
            ...searchData.map((data) => data.num)
                .filter((num) => num !== undefined)
        );

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.value');

        expect(result).toBeDefined();
        expect(result).toEqual(expectedMaxResult);
        expect(result).toBeGreaterThan(0);
    });

    it('should perform query filter along with max aggregation searches', async () => {
        const searchParams = await access.restrictSearchQuery(
            'bool:true',
            {
                aggregations: [{ field: 'num', aggregation: 'max' }],
                ...clientMetadata,
            }
        );

        const expectedMaxResult = Math.max(
            ...searchData.filter((record) => {
                if (record.num !== undefined && record.bool === true) {
                    return record;
                }
            })
                .map((record) => record.num)
                .filter((num) => num !== undefined)
        );

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.value');

        expect(result).toBeDefined();
        expect(result).toEqual(expectedMaxResult);
        expect(result).toBeGreaterThan(0);
    });

    it('should perform standalone avg aggregation searches', async () => {
        const searchParams = await access.restrictSearchQuery(
            '',
            {
                aggregations: [{ field: 'num', aggregation: 'avg' }],
                ...clientMetadata,
            }
        );

        const avgArray = searchData.map((data) => data.num)
            .filter((num) => num !== undefined);

        const expectedAvgResult = avgArray.reduce((prev, curr) => prev + curr, 0) / avgArray.length;

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.value');

        expect(result).toBeDefined();
        expect(result).toEqual(expectedAvgResult);
        expect(result).toBeGreaterThan(0);
    });

    it('should perform query filter along with avg aggregation searches', async () => {
        const searchParams = await access.restrictSearchQuery(
            'bool:true',
            {
                aggregations: [{ field: 'num', aggregation: 'avg' }],
                ...clientMetadata,
            }
        );

        const avgArray = searchData.filter((record) => {
            if (record.num !== undefined && record.bool === true) {
                return record;
            }
        })
            .map((record) => record.num)
            .filter((num) => num !== undefined);

        const expectedAvgResult = avgArray.reduce((prev, curr) => prev + curr, 0) / avgArray.length;

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.value');

        expect(result).toBeDefined();
        expect(result).toEqual(expectedAvgResult);
        expect(result).toBeGreaterThan(0);
    });

    // it('should perform standalone count aggregation searches', async () => {
    //     const searchParams = await access.restrictSearchQuery(
    //         '',
    //         {
    //             aggregations: [{ field: 'foo', aggregation: 'count' }],
    //             ...clientMetadata,
    //         }
    //     );

    //     const expectedSumResult = uniq(
    //         searchData.map((data) => data.foo)
    //             .filter((val) => val !== undefined)
    //     ).length;

    //     const response = await client.search(searchParams);
    //     const result = get(response, 'aggregations.aggregation_result.value');

    //     expect(result).toBeDefined();
    //     expect(result).toEqual(expectedSumResult);
    //     expect(result).toBeGreaterThan(0);
    // });

    it('should perform standalone unique aggregation searches', async () => {
        const searchParams = await access.restrictSearchQuery(
            '',
            {
                aggregations: [{ field: 'foo', aggregation: 'unique' }],
                ...clientMetadata,
            }
        );

        const expectedSumResult = uniq(
            searchData.map((data) => data.foo)
                .filter((val) => val !== undefined)
        ).length;

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.value');

        expect(result).toBeDefined();
        expect(result).toEqual(expectedSumResult);
        expect(result).toBeGreaterThan(0);
    });

    it('should perform standalone groupBy queries, this only returns a count', async () => {
        const searchParams = await access.restrictSearchQuery(
            '',
            {
                groupBy: ['bool'],
                ...clientMetadata,
            }
        );

        const trueArray: Record<string, any>[] = [];
        const falseArray: Record<string, any>[] = [];

        searchData.forEach((record) => {
            if (record.bool !== undefined) {
                if (record.bool) {
                    trueArray.push(record);
                } else {
                    falseArray.push(record);
                }
            }
        });

        const response = await client.search(searchParams);
        const result = get(response, 'aggregations.aggregation_result.buckets', []) as Record<string, any>;
        const trueCount = result
            .filter((rec: Record<string, any>) => rec['key_as_string'] === 'true')
            .map((data: Record<string, number>) => data['doc_count'])[0];

        const falseCount = result
            .filter((rec: Record<string, any>) => rec['key_as_string'] === 'false')
            .map((data: Record<string, number>) => data['doc_count'])[0];

        expect(result).toBeDefined();
        expect(trueCount).toEqual(trueArray.length);
        expect(falseCount).toEqual(falseArray.length);
    });

    it('should perform query filter with groupBy queries, this only returns a count', async () => {
        const searchParams = await access.restrictSearchQuery(
            'foo:hello',
            {
                groupBy: ['bool'],
                ...clientMetadata,
            }
        );

        const trueArray: Record<string, any>[] = [];
        const falseArray: Record<string, any>[] = [];

        searchData.forEach((record) => {
            if (record.foo && record.foo === 'hello') {
                if (record.bool !== undefined) {
                    if (record.bool) {
                        trueArray.push(record);
                    } else {
                        falseArray.push(record);
                    }
                }
            }
        });

        const response = await client.search(searchParams);

        const result = get(response, 'aggregations.aggregation_result.buckets', []) as Record<string, any>;
        const trueCount = result
            .filter((rec: Record<string, any>) => rec['key_as_string'] === 'true')
            .map((data: Record<string, number>) => data['doc_count'])[0];

        const falseCount = result
            .filter((rec: Record<string, any>) => rec['key_as_string'] === 'false')
            .map((data: Record<string, number>) => data['doc_count'])[0];

        expect(result).toBeDefined();
        expect(trueCount).toEqual(trueArray.length);
        expect(falseCount).toEqual(falseArray.length);
    });

    it('can groupBy multiple fields', async () => {
        // TODO: need control over size
        const searchParams = await access.restrictSearchQuery(
            '',
            {
                groupBy: ['bool', 'foo'],
                ...clientMetadata,
            }
        );

        const bucket: Record<string, number> = {};

        searchData.forEach((record) => {
            if (isNotNil(record.foo) && isNotNil(record.bool)) {
                const key = `${record.bool}${record.foo}`;
                if (isNotNil(bucket[key])) {
                    bucket[key] += 1;
                } else {
                    bucket[key] = 1;
                }
            }
        });

        const response = await client.search(searchParams);

        const result = get(response, 'aggregations.aggregation_result.buckets', []) as Record<string, any>;

        expect(result.length).toEqual(Object.keys(bucket).length);
        expect(result.length).toBeGreaterThan(1);

        result.forEach((agg: Record<string, any>) => {
            const keyMatch = agg.key.join('');
            expect(bucket[keyMatch]).toBeDefined();
            expect(bucket[keyMatch]).toEqual(agg.doc_count);
        });
    });

    it('can combine groupBy and aggregation together', async () => {
        const searchParams = await access.restrictSearchQuery(
            '',
            {
                groupBy: ['foo'],
                aggregations: [{ field: 'num', aggregation: 'sum' }],
                ...clientMetadata,
            }
        );

        const bucket: Record<string, number> = {};

        searchData.forEach((record) => {
            if (isNotNil(record.foo)) {
                const key = record.foo as string;
                const numValue = isNotNil(record.num) ? record.num as number : 0;

                if (isNotNil(bucket[key])) {
                    bucket[key] += numValue;
                } else {
                    bucket[key] = numValue;
                }
            }
        });

        const response = await client.search(searchParams);

        const result = get(response, 'aggregations.aggregation_result.buckets', []) as Record<string, any>;

        expect(result.length).toEqual(Object.keys(bucket).length);
        expect(result.length).toBeGreaterThan(1);

        result.forEach((agg: Record<string, any>) => {
            expect(bucket[agg.key]).toBeDefined();
            expect(bucket[agg.key]).toEqual(agg['aggregation_result'].value);
        });
    });
});
