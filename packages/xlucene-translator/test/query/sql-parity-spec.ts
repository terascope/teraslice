import 'jest-extended';
import { type Client, ElasticsearchTestHelpers, getClientMetadata } from '@terascope/opensearch-client';
import { FieldType, type ClientMetadata } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess, QueryAccessConfig } from '../../src/query-access/index.js';
import { DuckTestDB } from '../sql/duckdb-helpers.js';

const { makeClient, populateIndex, cleanupIndex } = ElasticsearchTestHelpers;

/**
 * **Field restrictions, answered by BOTH engines and required to agree.**
 *
 * `restrictSearchQuery` can hand `_source_includes`/`_source_excludes` to OpenSearch and let
 * the server withhold the field. SQL has no equivalent: the projection is the only place a
 * field can be withheld, so `restrictSQLQuery` builds one. Whether those two arrive at the
 * same answer is not something either side can be asked on its own - so this runs the same
 * `QueryAccess` against a real OpenSearch and a real DuckDB and compares the records.
 *
 * The fields here are deliberately plain. A `geo-point` is a string in `_source` and a
 * `STRUCT` in DuckDB, and comparing those would be testing the storage mapping rather than
 * the restriction.
*/
describe('source restrictions, opensearch vs duckdb', () => {
    const index = 'sql_parity_';
    const table = 'sql_parity';
    let client: Client;
    let clientMetadata: ClientMetadata | undefined;
    let db: DuckTestDB;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            id: { type: FieldType.Keyword },
            foo: { type: FieldType.Keyword },
            bar: { type: FieldType.Keyword },
            baz: { type: FieldType.Keyword },
            num: { type: FieldType.Integer },
            nested: { type: FieldType.Object },
            'nested.name': { type: FieldType.Keyword },
            'nested.secret': { type: FieldType.Keyword },
        }
    });

    const searchData = [
        {
            id: '1', foo: 'a', bar: 'keep', baz: 'c', num: 10, nested: { name: 'n1', secret: 's1' }
        },
        {
            id: '2', foo: 'b', bar: 'keep', baz: 'c', num: 20, nested: { name: 'n2', secret: 's2' }
        },
        {
            id: '3', foo: 'c', bar: 'drop', baz: 'c', num: 30, nested: { name: 'n3', secret: 's3' }
        },
    ];

    const typeConfig = dataType.toXlucene();

    beforeAll(async () => {
        client = await makeClient();
        clientMetadata = getClientMetadata(client);

        await populateIndex(client, index, dataType, searchData);

        db = await DuckTestDB.create();
        await db.createTable(table, dataType, searchData);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
        await db.close();
    });

    /** DuckDB returns every projected column; `_source` simply omits what a record lacks. */
    function withoutEmpty(record: Record<string, any>): Record<string, any> {
        return Object.fromEntries(
            Object.entries(record)
                .filter(([, value]) => value != null)
                .map(([key, value]) => [
                    key,
                    typeof value === 'object' && !Array.isArray(value)
                        ? withoutEmpty(value as Record<string, any>)
                        : value
                ])
        );
    }

    async function fromOpenSearch(
        access: QueryAccess<any>, query: string, opts: Record<string, any>
    ): Promise<Record<string, any>[]> {
        const searchParams = await access.restrictSearchQuery(query, {
            ...clientMetadata,
            params: {
                index,
                size: searchData.length,
                _source_includes: opts.includes,
                _source_excludes: opts.excludes,
            }
        });

        const response = await client.search(searchParams);

        return response.hits.hits.map((hit) => withoutEmpty(hit._source as Record<string, any>));
    }

    /**
     * The two calls sit side by side on purpose: each takes a query and a `params`, and each
     * returns something its client executes unchanged. Neither test assembles anything.
    */

    async function fromDuckDB(
        access: QueryAccess<any>, query: string, opts: Record<string, any>
    ): Promise<Record<string, any>[]> {
        const sql = await access.restrictSQLQuery(query, {
            params: {
                table,
                size: searchData.length,
                includes: opts.includes,
                excludes: opts.excludes,
            }
        });

        const rows = await db.run(sql);

        return rows.map(withoutEmpty);
    }

    /**
     * **A configured `includes` restricts what can be QUERIED as well as what is returned**,
     * so every scenario below that sets one keeps `bar` in it - the field the shared query
     * filters on. Leaving it out does not produce a different projection, it produces a
     * rejected query, which would be a different test.
    */
    const scenarios: [string, QueryAccessConfig<any>, Record<string, any>][] = [
        ['no restrictions at all', {}, {}],
        ['a configured exclude', { excludes: ['baz'] }, {}],
        ['a configured include', { includes: ['id', 'foo', 'bar'] }, {}],
        ['a requested exclude', {}, { excludes: ['baz'] }],
        ['a requested include', {}, { includes: ['id', 'foo'] }],
        ['both excludes, which combine', { excludes: ['baz'] }, { excludes: ['num'] }],
        ['both includes, which intersect', { includes: ['id', 'foo', 'bar'] }, { includes: ['foo', 'baz'] }],
        ['a requested include of a field the config forbids', { includes: ['id', 'foo', 'bar'] }, { includes: ['baz'] }],
        ['an excluded object', { excludes: ['nested'] }, {}],
        ['an excluded member of an object', { excludes: ['nested.secret'] }, {}],
    ];

    describe.each(scenarios)('given %s', (_name, config, opts) => {
        const access = new QueryAccess<any>({
            ...config,
            allow_empty_queries: true,
            type_config: typeConfig,
        });

        it('returns the same fields from both engines', async () => {
            const [opensearch, duckdb] = await Promise.all([
                fromOpenSearch(access, 'bar:keep', opts),
                fromDuckDB(access, 'bar:keep', opts),
            ]);

            expect(duckdb).toEqual(opensearch);
        });
    });

    /**
     * The case a caller-side field filter gets backwards.
     *
     * When none of the requested fields are permitted, `restrictSourceFields` answers with
     * `excludes: ['*']` - which is not a field name. Filtering column names against that list
     * removes nothing and returns EVERYTHING, so the most restrictive input would produce the
     * most permissive output. Both engines have to answer with no data.
    */
    it('returns no data when nothing may be read', async () => {
        const access = new QueryAccess<any>({
            includes: ['id', 'foo', 'bar'],
            allow_empty_queries: true,
            type_config: typeConfig,
        });
        const opts = { includes: ['baz'] };

        const opensearch = await fromOpenSearch(access, 'bar:keep', opts);
        const { select, columns } = await access.restrictSQLParts('bar:keep', { params: opts });

        expect(opensearch).toEqual([{}, {}]);
        expect(columns).toEqual([]);
        expect(select).toEqual('NULL');

        const duckdb = await fromDuckDB(access, 'bar:keep', opts);
        expect(duckdb).toEqual([{}, {}]);
    });

    /** The restriction has to survive into the statement, not just into the result object. */
    it('withholds an excluded column from the rows themselves', async () => {
        const access = new QueryAccess<any>({
            excludes: ['baz'],
            allow_empty_queries: true,
            type_config: typeConfig,
        });

        const rows = await db.run(
            await access.restrictSQLQuery('bar:keep', { params: { table } })
        );

        for (const row of rows) {
            expect(row).not.toContainKey('baz');
        }
    });
});
