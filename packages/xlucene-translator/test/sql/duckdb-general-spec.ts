import 'jest-extended';
import { FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess } from '../../src/query-access/index.js';
import { DuckTestDB } from './duckdb-helpers.js';

/**
 * The same queries `test/query/general-spec.ts` runs against OpenSearch, run against DuckDB.
 *
 * They go through `QueryAccess.restrictSQLQuery` rather than `Translator.toSQL` on purpose:
 * `QueryAccess` is what callers actually use, and it is the path where a restriction, a
 * constraint or a variable could change the query before the translator ever sees it.
*/
describe('general searches (duckdb)', () => {
    const table = 'all_search';
    let db: DuckTestDB;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            id: { type: FieldType.Keyword },
            bar: { type: FieldType.Keyword },
            baz: { type: FieldType.Keyword },
            bool: { type: FieldType.Boolean },
            num: { type: FieldType.Integer },
            date: { type: FieldType.Date },
        }
    });

    const searchData = [
        {
            id: '1', bar: 'hello', bool: true, num: 50, date: '2020-01-01T00:00:00.000Z'
        },
        {
            id: '2', bar: 'goodBye', bool: true, num: 60, date: '2020-03-01T00:00:00.000Z'
        },
        {
            id: '3', bar: 'hello', bool: false, num: 70, date: '2020-06-01T00:00:00.000Z'
        },
        {
            id: '4', bar: 'baz', bool: true, num: 50, date: '2021-01-01T00:00:00.000Z'
        },
        {
            id: '5', bar: 'fizz', bool: false, num: 60, date: '2021-06-01T00:00:00.000Z'
        },
        {
            id: '6', bar: 'fizzbuzz', bool: true, num: 80, date: '2022-01-01T00:00:00.000Z'
        },
        {
            id: '7', bar: 'hello', bool: true, num: 40, date: '2022-06-01T00:00:00.000Z'
        },
        { id: '8', baz: 'hello' },
        { id: '9', num: 50 },
        { id: '10', bar: '100%', num: 10 },
    ];

    const access = new QueryAccess({
        prevent_prefix_wildcard: true,
        allow_implicit_queries: true,
        allow_empty_queries: true,
        type_config: dataType.toXlucene(),
        filterNilVariables: true,
        variables: undefined
    });

    /**
     * The whole path: a query in, a statement out, executed verbatim.
     *
     * Nothing here builds SQL - `restrictSQLQuery` returns the complete statement, which is
     * the point of it.
    */
    async function search(query: string): Promise<string[]> {
        const sql = await access.restrictSQLQuery(query, { params: { table } });
        const rows = await db.run(sql);
        return rows.map((row) => row.id as string);
    }

    async function idsOf(sql: string): Promise<string[]> {
        const rows = await db.run(sql);
        return rows.map((row) => row.id as string);
    }

    beforeAll(async () => {
        db = await DuckTestDB.create();
        await db.createTable(table, dataType, searchData);
    });

    afterAll(async () => {
        await db.close();
    });

    describe('term level queries', () => {
        it('can handle * statements', async () => {
            await expect(search('*')).resolves.toEqual(searchData.map(({ id }) => id));
        });

        it('can handle an empty query', async () => {
            await expect(search('')).resolves.toEqual(searchData.map(({ id }) => id));
        });

        it('can handle term statements', async () => {
            await expect(search('bar:hello')).resolves.toEqual(['1', '3', '7']);
        });

        it('can handle boolean statements', async () => {
            await expect(search('bool:false')).resolves.toEqual(['3', '5']);
        });

        it('can handle numeric statements', async () => {
            await expect(search('num:50')).resolves.toEqual(['1', '4', '9']);
        });

        it('can handle wildcard statements', async () => {
            await expect(search('bar:h?llo')).resolves.toEqual(['1', '3', '7']);
            await expect(search('bar:fizz*')).resolves.toEqual(['5', '6']);
        });

        /**
         * `%` is a `LIKE` wildcard and an ordinary character in a value, and the value wins -
         * `bar:100%` is an equality, and it is only ever a wildcard when the query says `*`.
        */
        it('does not treat a value\'s own % as a wildcard', async () => {
            await expect(search('bar:100%')).resolves.toEqual(['10']);
        });

        it('can handle regex statements', async () => {
            await expect(search('bar:/h.*o/')).resolves.toEqual(['1', '3', '7']);
        });

        /** The Elasticsearch `regexp` query is anchored, so the translation has to be too. */
        it('anchors a regex the way elasticsearch does', async () => {
            await expect(search('bar:/izz/')).resolves.toEqual([]);
            await expect(search('bar:/fizz/')).resolves.toEqual(['5']);
        });

        it('can handle _exists_ statements', async () => {
            await expect(search('_exists_:bar')).resolves.toEqual(
                searchData.filter(({ bar }) => bar != null).map(({ id }) => id)
            );
        });

        it('can handle a field wildcard, which matches any value present', async () => {
            // `prevent_prefix_wildcard` rejects a leading wildcard, so this needs its own access
            const permissive = new QueryAccess({
                allow_empty_queries: true,
                type_config: dataType.toXlucene(),
            });

            const sql = await permissive.restrictSQLQuery('baz:*', { params: { table } });
            await expect(idsOf(sql)).resolves.toEqual(['8']);
        });
    });

    describe('range queries', () => {
        it('can handle > statements', async () => {
            await expect(search('num:>50')).resolves.toEqual(['2', '3', '5', '6']);
        });

        it('can handle >= statements', async () => {
            await expect(search('num:>=50')).resolves.toEqual(['1', '2', '3', '4', '5', '6', '9']);
        });

        it('can handle < statements', async () => {
            await expect(search('num:<50')).resolves.toEqual(['7', '10']);
        });

        it('can handle <= statements', async () => {
            await expect(search('num:<=50')).resolves.toEqual(['1', '4', '7', '9', '10']);
        });

        it('can handle [ TO ] statements', async () => {
            await expect(search('num:[50 TO 60]')).resolves.toEqual(['1', '2', '4', '5', '9']);
        });

        it('can handle { TO } statements', async () => {
            await expect(search('num:{50 TO 70}')).resolves.toEqual(['2', '5']);
        });

        it('can handle an unbounded range', async () => {
            await expect(search('num:[50 TO *]')).resolves.toEqual(['1', '2', '3', '4', '5', '6', '9']);
        });

        /**
         * A date literal carries a zone and a `TIMESTAMP` column does not - measured, DuckDB's
         * cast DROPS the offset rather than applying it, so the translation normalises to UTC
         * before emitting. These bounds are chosen to fail if it ever stops.
        */
        it('can handle date ranges', async () => {
            await expect(search('date:["2020-01-01" TO "2020-06-01"]')).resolves.toEqual(['1', '2', '3']);
            await expect(search('date:>="2021-01-01T00:00:00.000Z"')).resolves.toEqual(['4', '5', '6', '7']);
        });
    });

    describe('logical grouping', () => {
        it('can handle AND statements', async () => {
            await expect(search('bar:hello AND num:50')).resolves.toEqual(['1']);
        });

        it('can handle OR statements', async () => {
            await expect(search('bar:hello OR bar:fizz')).resolves.toEqual(['1', '3', '5', '7']);
        });

        it('can handle grouped statements', async () => {
            await expect(search('(bar:hello OR bar:fizz) AND bool:true')).resolves.toEqual(['1', '7']);
        });

        it('can handle field grouped statements', async () => {
            await expect(search('bar:(hello OR fizz)')).resolves.toEqual(['1', '3', '5', '7']);
            await expect(search('num:(>=50 AND <70)')).resolves.toEqual(['1', '2', '4', '5', '9']);
        });
    });

    describe('negation', () => {
        /**
         * **The case that makes a bare `NOT` wrong.**
         *
         * Elasticsearch's `must_not` matches a document whose field is absent; SQL's
         * three-valued logic makes `NOT (bar = 'hello')` unknown when `bar` is `NULL`, and a
         * `WHERE` clause drops an unknown row. Records 8 and 9 have no `bar` at all and both
         * must come back.
        */
        it('matches records missing the field entirely', async () => {
            await expect(search('NOT bar:hello')).resolves.toEqual(['2', '4', '5', '6', '8', '9', '10']);
        });

        it('can negate a group', async () => {
            await expect(search('NOT (bar:hello OR bar:fizz)')).resolves.toEqual(['2', '4', '6', '8', '9', '10']);
        });

        it('can negate inside a conjunction', async () => {
            await expect(search('bool:true AND NOT bar:hello')).resolves.toEqual(['2', '4', '6']);
        });

        /**
         * **A value containing parentheses must not change how the expression groups.**
         *
         * The emitter leaves an expression that is already one parenthesized group alone, and
         * a naive check for that is fooled by a `(` inside a string literal - which would let
         * `NOT` bind to half of a conjunction. These values put unbalanced parentheses on both
         * sides of an `AND` inside a `NOT`, which answers wrongly if the grouping slips.
        */
        it('groups correctly around a value containing parentheses', async () => {
            await expect(search('bar:"a(" OR bar:hello')).resolves.toEqual(['1', '3', '7']);
            await expect(search('NOT (bar:"a(" AND bar:"b)")')).resolves.toEqual(
                searchData.map(({ id }) => id)
            );
            // an OR group followed by an AND, where a slipped grouping changes the answer
            await expect(search('(bar:"a(" OR bar:hello) AND bool:false')).resolves.toEqual(['3']);
        });
    });

    describe('implicit fields', () => {
        /**
         * A query with no field searches every configured field - and the fields whose type
         * could not hold the value are left out rather than compared, because `"num" =
         * 'hello'` is a cast error and not a non-match.
        */
        it('searches every field whose type could hold the value', async () => {
            await expect(search('hello')).resolves.toEqual(['1', '3', '7', '8']);
        });

        it('compares a numeric value against the numeric fields', async () => {
            await expect(search('80')).resolves.toEqual(['6']);
        });

        it('can handle a field pattern', async () => {
            await expect(search('ba*:hello')).resolves.toEqual(['1', '3', '7', '8']);
        });
    });

    describe('variables', () => {
        it('expands an array variable into an OR', async () => {
            const sql = await access.restrictSQLQuery('bar:$values', {
                variables: { values: ['hello', 'fizz'] },
                params: { table }
            });
            await expect(idsOf(sql)).resolves.toEqual(['1', '3', '5', '7']);
        });

        /** A nil variable drops its half of the query, exactly as it does for the DSL. */
        it('drops a conjunction whose variable is missing', async () => {
            const sql = await access.restrictSQLQuery('bar:hello AND baz:$missing', {
                variables: {},
                params: { table }
            });
            await expect(idsOf(sql)).resolves.toEqual(['1', '3', '7']);
        });
    });

    describe('restrictions', () => {
        it('applies a constraint to the SQL as well', async () => {
            const restricted = new QueryAccess({
                constraint: 'bool:true',
                allow_empty_queries: true,
                type_config: dataType.toXlucene(),
            });

            const sql = await restricted.restrictSQLQuery('bar:hello', { params: { table } });
            await expect(idsOf(sql)).resolves.toEqual(['1', '7']);
        });

        /**
         * **The restriction has to be in the STATEMENT, not beside it.**
         *
         * Elasticsearch withholds a field because `_source_excludes` rides inside the request
         * and the server obeys it; the only thing that can do that job in SQL is the
         * projection, so `select` is what a caller interpolates and `SELECT *` is what
         * defeats it.
        */
        it('applies an exclude to the projection', async () => {
            const restricted = new QueryAccess({
                excludes: ['baz'],
                allow_empty_queries: true,
                type_config: dataType.toXlucene(),
            });

            const { select, columns, excludes } = await restricted.restrictSQLParts('bar:hello');

            expect(select).not.toInclude('baz');
            expect(columns).not.toContain('baz');
            expect(excludes).toEqual(['baz']);

            const rows = await db.run(
                await restricted.restrictSQLQuery('bar:hello', { params: { table } })
            );

            expect(rows).toBeArrayOfSize(3);
            for (const row of rows) {
                expect(row).not.toContainKey('baz');
                expect(row).toContainKey('bar');
            }
        });

        it('selects everything when nothing is restricted', async () => {
            const { select } = await access.restrictSQLParts('bar:hello');

            expect(select).toEqual('*');
        });

        it('still refuses a restricted field', async () => {
            const restricted = new QueryAccess({
                excludes: ['baz'],
                allow_empty_queries: true,
                type_config: dataType.toXlucene(),
            });

            await expect(restricted.restrictSQLQuery('baz:hello')).toReject();
        });
    });
});
