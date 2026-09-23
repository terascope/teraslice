import 'jest-extended';
import {
    SortOrder, SQLDialectName, xLuceneFieldType, xLuceneTypeConfig
} from '@terascope/types';
import { Parser } from 'xlucene-parser';
import { Translator } from '../../src/index.js';
import {
    DuckDBDialect, getSQLDialect, getAvailableSQLDialects,
    translateSQLQuery, buildSQLStatement
} from '../../src/translator/sql/index.js';

/** The dialect renders the sort now, so the tests ask it rather than a free function. */
const duckdb = getSQLDialect();
import { getProjectablePaths } from '../../src/query-access/source-fields.js';
import allTestCases, { typeConfig } from './cases/sql/index.js';

/**
 * What `toSQL` emits, per dialect.
 *
 * The DuckDB cases are also RUN, in `test/sql/` - these lock the text so a change to it is a
 * diff rather than a surprise. The Postgres cases have nothing that runs them, which is why
 * they are hand-verified rather than snapshotted.
*/
describe('Translator->toSQL', () => {
    for (const [dialect, groups] of Object.entries(allTestCases)) {
        describe(`when emitting ${dialect}`, () => {
            for (const [group, testCases] of Object.entries(groups)) {
                describe(`given ${group} queries`, () => {
                    /**
                     * `describe.each` rather than `test.each`, for the same reason
                     * `translator-spec` uses it: a `test.each` callback that declares more
                     * parameters than the shortest row supplies is handed a `done` callback
                     * by jest and then waits 60s for a call that never comes - a case with no
                     * options would hang rather than fail.
                    */
                    describe.each(testCases)('given %s', (query, expected, options) => {
                        it('should translate the query correctly', () => {
                            const translator = new Translator(query, {
                                type_config: typeConfig, ...options
                            });

                            expect(translator.toSQL({ dialect: dialect as SQLDialectName }).query)
                                .toEqual(expected);
                        });
                    });
                });
            }
        });
    }

    describe('the dialect option', () => {
        it('defaults to duckdb', () => {
            const translator = new Translator('bar:/h.*o/', { type_config: typeConfig });

            expect(translator.toSQL().query).toEqual(translator.toSQL({
                dialect: SQLDialectName.duckdb
            }).query);
        });

        it('lists the dialects it knows', () => {
            expect(getAvailableSQLDialects()).toEqual(['duckdb', 'postgres']);
        });

        it('throws on a dialect it does not know', () => {
            expect(() => getSQLDialect('sqlite' as SQLDialectName)).toThrow(/Unsupported SQL dialect/);
        });

        /**
         * A caller with a storage layout that differs from the dialect's assumptions overrides
         * the one method concerned rather than waiting for a dialect to be added here.
        */
        it('takes a dialect object, so a caller can override one method', () => {
            class LowerCaseColumns extends DuckDBDialect {
                fieldRef(field: string): string {
                    return super.fieldRef(field.toLowerCase());
                }
            }

            const translator = new Translator('BAR:hello', {
                type_config: { BAR: xLuceneFieldType.String }
            });

            expect(translator.toSQL({ dialect: new LowerCaseColumns() }).query)
                .toEqual('("bar" = \'hello\')');
        });
    });

    describe('sorting', () => {
        it('has no sort when nothing asked for an order', () => {
            const translator = new Translator('bar:hello', { type_config: typeConfig });

            expect(translator.toSQL().sort).toBeUndefined();
            expect(duckdb.orderBy(undefined)).toBe('');
        });

        it('sorts by distance for a geoDistance query', () => {
            const translator = new Translator(
                'location:geoDistance(point:"20,20" distance:5000m)',
                { type_config: typeConfig }
            );

            const { sort } = translator.toSQL({ geo_sort_order: 'desc' });

            expect(duckdb.orderBy(sort)).toEqual(
                'ST_Distance_Sphere(ST_Point(struct_extract("location", \'lat\'),'
                + ' struct_extract("location", \'lon\')), ST_Point(20, 20)) DESC NULLS LAST'
            );
        });

        it('sorts by the default geo field when a sort point is given', () => {
            const translator = new Translator('bar:hello', {
                type_config: typeConfig,
                default_geo_field: 'location',
            });

            const { sort } = translator.toSQL({ geo_sort_point: { lat: 10, lon: 10 } });

            expect(sort).toHaveLength(1);
            expect(duckdb.orderBy(sort)).toContain('ST_Distance_Sphere');
            expect(duckdb.orderBy(sort)).toEndWith(' ASC NULLS FIRST');
        });
    });

    describe('queries it refuses', () => {
        it('refuses a function with no SQL equivalent', () => {
            const translator = new Translator('vector:knn(vector:[1,2] k:2)', {
                type_config: { vector: xLuceneFieldType.Object }
            });

            expect(() => translator.toSQL()).toThrow(/cannot be translated to SQL/);
        });

        it('refuses a range with no field', () => {
            const translator = new Translator('>=50', { type_config: typeConfig });

            expect(() => translator.toSQL()).toThrow(/must specify a field/);
        });

        it('refuses a fieldless query with no type config', () => {
            const translator = new Translator('hello');

            expect(() => translator.toSQL()).toThrow(/type_config/);
        });

        it('refuses a malformed ip', () => {
            const translator = new Translator('ip:"not-an-ip"', { type_config: typeConfig });

            expect(() => translator.toSQL()).toThrow(/valid IP address or CIDR block/);
        });
    });

    describe('when a query cannot be translated at all', () => {
        it('matches nothing rather than everything', () => {
            const parser = new Parser('');
            // @ts-expect-error an ast shape the walk has no case for
            parser.ast = { type: 'idk', field: 'a', val: true } as any;

            const result = translateSQLQuery(parser, {
                logger: { error() {} } as any,
                type_config: {},
                variables: {},
                dialect: getSQLDialect(),
                geo_sort_order: 'asc',
                geo_sort_unit: 'meters',
            });

            expect(result.query).toEqual('FALSE');
        });
    });

    /**
     * The projection is the only thing in SQL that can withhold a field, so these lock its
     * text - including the Postgres form, which nothing runs.
    */
    describe('the projection', () => {
        const nested = {
            foo: xLuceneFieldType.String,
            nested: xLuceneFieldType.Object,
            'nested.name': xLuceneFieldType.String,
            'nested.secret': xLuceneFieldType.String,
        };

        const cases: [SQLDialectName, string[], string][] = [
            [SQLDialectName.duckdb, ['foo', 'nested.name', 'nested.secret'], '"foo", "nested"'],
            [SQLDialectName.duckdb, ['foo'], '"foo"'],
            [
                SQLDialectName.duckdb,
                ['foo', 'nested.name'],
                '"foo", struct_pack("name" := "nested"."name") AS "nested"'
            ],
            [SQLDialectName.duckdb, [], 'NULL'],
            [SQLDialectName.postgres, ['foo', 'nested.name'], '"foo", "nested.name"'],
            [SQLDialectName.postgres, [], 'NULL'],
        ];

        test.each(cases)('%s projects %j as %s', (dialect, readable, expected) => {
            const all = getProjectablePaths(nested);

            expect(getSQLDialect(dialect).projection(readable, all)).toEqual(expected);
        });

        /** A column is only taken whole when every one of its members survived. */
        it('rebuilds a struct only when part of it was withheld', () => {
            const all = getProjectablePaths(nested);

            expect(duckdb.projection(['nested.name', 'nested.secret'], all)).toEqual('"nested"');
            expect(duckdb.projection(['nested.secret'], all))
                .toEqual('struct_pack("secret" := "nested"."secret") AS "nested"');
        });
    });

    /**
     * The statement builder, which is what keeps a caller from assembling one - and therefore
     * from leaving out the half of it that restricts anything.
    */
    describe('buildSQLStatement', () => {
        const parts = {
            select: '"bar", "num"',
            where: '("bar" = \'hello\')',
            columns: ['bar', 'num'],
        };

        it('assembles every clause in order', () => {
            const sql = buildSQLStatement(
                { ...parts, sort: [{ expression: '"num"', order: 'desc' as const }] },
                { table: 'events', size: 10, from: 5 },
                getSQLDialect()
            );

            expect(sql).toEqual(
                'SELECT "bar", "num" FROM "events" WHERE ("bar" = \'hello\')'
                + ' ORDER BY "num" DESC NULLS LAST LIMIT 10 OFFSET 5'
            );
        });

        it('omits a WHERE that would say nothing', () => {
            const sql = buildSQLStatement(
                { ...parts, where: 'TRUE' }, { table: 'events' }, getSQLDialect()
            );

            expect(sql).toEqual('SELECT "bar", "num" FROM "events"');
        });

        it('uses a relation verbatim', () => {
            const sql = buildSQLStatement(
                parts, { relation: 'read_parquet([\'a.parquet\', \'b.parquet\'])' }, getSQLDialect()
            );

            expect(sql).toStartWith('SELECT "bar", "num" FROM read_parquet([\'a.parquet\', \'b.parquet\'])');
        });

        /**
         * **The direction is the one half of an `ORDER BY` entry that is a value rather than
         * SQL**, and it goes into the statement as a keyword - so it is checked for exactly
         * the reason `size` is. The expression beside it is the caller's own SQL and is not.
        */
        describe('the sort direction', () => {
            it.each([
                ['an unknown direction', 'ascending'],
                ['a direction carrying more SQL', 'asc, (SELECT 1)'],
                ['an empty direction', ''],
                ['no direction at all', undefined],
            ])('refuses %s in the query\'s own sort', (_name, order) => {
                expect(() => buildSQLStatement(
                    { ...parts, sort: [{ expression: '"num"', order: order as SortOrder }] },
                    { table: 'events' },
                    getSQLDialect()
                )).toThrow(/sort order of asc or desc/);
            });

            it('refuses one in the caller\'s sort as well', () => {
                expect(() => buildSQLStatement(
                    parts,
                    {
                        table: 'events',
                        sort: [{ expression: '"num"', order: '1; DROP TABLE users' as SortOrder }]
                    },
                    getSQLDialect()
                )).toThrow(/sort order of asc or desc/);
            });

            it('takes a direction in either case', () => {
                const sql = buildSQLStatement(
                    parts,
                    { table: 'events', sort: [{ expression: '"num"', order: 'DESC' as SortOrder }] },
                    getSQLDialect()
                );

                expect(sql).toEndWith('ORDER BY "num" DESC NULLS LAST');
            });
        });

        it('spells LIMIT the same way in postgres', () => {
            const sql = buildSQLStatement(
                parts, { table: 'events', size: 3 }, getSQLDialect(SQLDialectName.postgres)
            );

            expect(sql).toEndWith('LIMIT 3');
        });
    });

    describe('type config handling', () => {
        /**
         * A field whose type cannot hold the value is left out of an expansion. When none can,
         * the query matches nothing - which is the answer, not an error.
        */
        it('matches nothing when no field could hold the value', () => {
            const numbersOnly: xLuceneTypeConfig = { num: xLuceneFieldType.Integer };
            const translator = new Translator('hello', { type_config: numbersOnly });

            expect(translator.toSQL().query).toEqual('FALSE');
        });

        it('compares a numeric implicit value against a numeric field', () => {
            const numbersOnly: xLuceneTypeConfig = { num: xLuceneFieldType.Integer };
            const translator = new Translator('50', { type_config: numbersOnly });

            expect(translator.toSQL().query).toEqual('("num" = 50)');
        });
    });
});
