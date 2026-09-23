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

        /**
         * **The two ends are independent, so all four spellings are different queries.**
         *
         * `[` and `]` include the bound, `{` and `}` exclude it. The bounds below sit exactly
         * on stored values - `num` has records at 50 and at 70, `date` at both ends, `bar` at
         * `baz` and `fizzbuzz` - so each spelling answers with a different set and a `gt`
         * emitted where a `gte` was asked for cannot pass.
        */
        it.each([
            ['[ TO ], both bounds included', 'num:[50 TO 70]', ['1', '2', '3', '4', '5', '9']],
            ['{ TO }, neither bound included', 'num:{50 TO 70}', ['2', '5']],
            ['[ TO }, the upper bound excluded', 'num:[50 TO 70}', ['1', '2', '4', '5', '9']],
            ['{ TO ], the lower bound excluded', 'num:{50 TO 70]', ['2', '3', '5']],
        ])('can handle %s over numbers', async (_name, query, expected) => {
            await expect(search(query)).resolves.toEqual(expected);
        });

        /**
         * The same four over a `keyword`, where the comparison is between strings and nothing
         * in the query says so - the bounds are bare words.
        */
        it.each([
            ['[ TO ], both bounds included', 'bar:[baz TO fizzbuzz]', ['4', '5', '6']],
            ['{ TO }, neither bound included', 'bar:{baz TO fizzbuzz}', ['5']],
            ['[ TO }, the upper bound excluded', 'bar:[baz TO fizzbuzz}', ['4', '5']],
            ['{ TO ], the lower bound excluded', 'bar:{baz TO fizzbuzz]', ['5', '6']],
        ])('can handle %s over keywords', async (_name, query, expected) => {
            await expect(search(query)).resolves.toEqual(expected);
        });

        it('can handle an unbounded range', async () => {
            await expect(search('num:[50 TO *]')).resolves.toEqual(['1', '2', '3', '4', '5', '6', '9']);
        });

        it('can handle a range with no bounds at all, which asks only that the field exist', async () => {
            await expect(search('num:[* TO *]')).resolves.toEqual(
                searchData.filter(({ num }) => num != null).map(({ id }) => id)
            );
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

        /**
         * **A date bound lands on a record's value exactly**, which is the only arrangement
         * that can tell the four spellings apart - every date in the corpus is midnight UTC
         * and both bounds here are stored dates.
        */
        it.each([
            [
                '[ TO ], both bounds included',
                'date:["2020-03-01" TO "2021-06-01"]',
                ['2', '3', '4', '5']
            ],
            [
                '{ TO }, neither bound included',
                'date:{"2020-03-01" TO "2021-06-01"}',
                ['3', '4']
            ],
            [
                '[ TO }, the upper bound excluded',
                'date:["2020-03-01" TO "2021-06-01"}',
                ['2', '3', '4']
            ],
            [
                '{ TO ], the lower bound excluded',
                'date:{"2020-03-01" TO "2021-06-01"]',
                ['3', '4', '5']
            ],
        ])('can handle %s over dates', async (_name, query, expected) => {
            await expect(search(query)).resolves.toEqual(expected);
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

    /**
     * **A variable is a VALUE bound late.** The structure comes from the query text, so
     * `bar:$str` asks exactly what `bar:hello` asks once the variable resolves - which is the
     * whole point of one: the same query, a different value, decided at the last moment.
     *
     * What these cover is the two places that is not the whole story. An array fans out to one
     * comparison per element, so the value decides how many there are and an empty list leaves
     * none. And a variable with no value resolves to an empty one, or, under
     * `filterNilVariables`, drops the node it belongs to and takes its conjunction with it.
     *
     * The SQL is locked in `test/structure/cases/sql/`; what is proved here is that each one
     * returns the records it should when a real engine answers it.
    */
    describe('variables', () => {
        const variables = {
            str: 'hello',
            arr: ['hello', 'fizz'],
            empty: [] as string[],
            n: 50,
            nums: [50, 60],
            flag: false,
            when: '2020-01-01T00:00:00.000Z',
            low: 20,
            high: 70,
        };

        async function searchWith(query: string, overrides = {}): Promise<string[]> {
            const sql = await access.restrictSQLQuery(query, {
                variables: { ...variables, ...overrides },
                params: { table }
            });
            return idsOf(sql);
        }

        it.each([
            ['a string variable', 'bar:$str', ['1', '3', '7']],
            ['a numeric variable', 'num:$n', ['1', '4', '9']],
            ['a boolean variable', 'bool:$flag', ['3', '5']],
            ['a date variable', 'date:$when', ['1']],
            ['a variable as a range bound', 'num:>=$high', ['3', '6']],
            ['variables on both bounds', 'num:[$low TO $high]', ['1', '2', '3', '4', '5', '7', '9']],
        ])('resolves %s', async (_name, query, expected) => {
            await expect(searchWith(query)).resolves.toEqual(expected);
        });

        it('expands an array variable into an OR', async () => {
            await expect(searchWith('bar:$arr')).resolves.toEqual(['1', '3', '5', '7']);
        });

        it('expands a numeric array variable', async () => {
            await expect(searchWith('num:$nums')).resolves.toEqual(['1', '2', '4', '5', '9']);
        });

        it('combines an expanded array with the rest of the query', async () => {
            await expect(searchWith('bar:$arr AND bool:true')).resolves.toEqual(['1', '7']);
            await expect(searchWith('(bar:$arr OR baz:$str) AND bool:true'))
                .resolves.toEqual(['1', '7']);
        });

        /**
         * **The expansion has to stay one group under a `NOT`.**
         *
         * An array variable becomes an `OR` of terms, and a negation that bound to only the
         * first of them would answer for a query nobody wrote. Records 8 and 9 have no `bar`
         * at all and come back for the same reason a plain negation returns them.
        */
        it('negates the whole expansion', async () => {
            await expect(searchWith('NOT bar:$arr'))
                .resolves.toEqual(['2', '4', '6', '8', '9', '10']);
        });

        /**
         * An empty array matches nothing, which is `match_none` on the DSL side - and under an
         * `AND` it takes the whole conjunction with it, while under an `OR` only its own half
         * goes.
        */
        it.each([
            ['on its own', 'bar:$empty', []],
            ['in a conjunction', 'bar:$empty AND baz:$str', []],
            ['in a disjunction', 'bar:$empty OR baz:$str', ['8']],
        ])('matches nothing for an empty array variable %s', async (_name, query, expected) => {
            await expect(searchWith(query)).resolves.toEqual(expected);
        });

        /** A nil variable drops its half of the query, exactly as it does for the DSL. */
        it('drops a conjunction whose variable is missing', async () => {
            const sql = await access.restrictSQLQuery('bar:hello AND baz:$missing', {
                variables: {},
                params: { table }
            });
            await expect(idsOf(sql)).resolves.toEqual(['1', '3', '7']);
        });

        /**
         * Without `filterNilVariables` the node survives with an empty value, which is the
         * answer the DSL gives too - a `match` on `''`.
        */
        it('compares against an empty value when nil variables are not filtered', async () => {
            const keepsNil = new QueryAccess({
                allow_empty_queries: true,
                type_config: dataType.toXlucene(),
            });

            const sql = await keepsNil.restrictSQLQuery('bar:$missing', { params: { table } });

            expect(sql).toEndWith('WHERE ("bar" = \'\')');
            await expect(idsOf(sql)).resolves.toEqual([]);
        });

        describe('where the values come from', () => {
            const configured = new QueryAccess({
                allow_empty_queries: true,
                type_config: dataType.toXlucene(),
                variables: { str: 'hello' },
            });

            it('uses the ones the configuration carries', async () => {
                const sql = await configured.restrictSQLQuery('bar:$str', { params: { table } });
                await expect(idsOf(sql)).resolves.toEqual(['1', '3', '7']);
            });

            it('lets a call add one the configuration does not have', async () => {
                const sql = await configured.restrictSQLQuery('bar:$str AND num:$n', {
                    variables: { n: 50 },
                    params: { table }
                });
                await expect(idsOf(sql)).resolves.toEqual(['1']);
            });

            it('lets a call override one it does', async () => {
                const sql = await configured.restrictSQLQuery('bar:$str', {
                    variables: { str: 'fizz' },
                    params: { table }
                });
                await expect(idsOf(sql)).resolves.toEqual(['5']);
            });

            /**
             * **The same query text with different variables is a different query.**
             *
             * `QueryAccess` caches by query string, and a cache that ignored the variables
             * would answer the second call with the first call's rows - which is a wrong
             * answer rather than a slow one.
            */
            it('does not answer a second call with the first call\'s values', async () => {
                const first = await configured.restrictSQLQuery('bar:$str', {
                    variables: { str: 'hello' },
                    params: { table }
                });
                const second = await configured.restrictSQLQuery('bar:$str', {
                    variables: { str: 'fizz' },
                    params: { table }
                });

                await expect(idsOf(first)).resolves.toEqual(['1', '3', '7']);
                await expect(idsOf(second)).resolves.toEqual(['5']);
            });
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
