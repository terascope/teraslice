import 'jest-extended';
import { QueryAccess } from '../../src/index.js';
import { dataType, records, typeConfig } from '../cases/corpus.js';
import type { QueryCase } from '../cases/interfaces.js';
import { multiStatementCases, negationCases } from '../cases/logic.js';
import {
    dateRangeCases, keywordRangeCases, numericRangeCases
} from '../cases/ranges.js';
import { ipCases, ipRangeCases } from '../cases/ips.js';
import { prefixWildcardCases, termCases } from '../cases/terms.js';
import { makeDuckDBEngine, makeOpenSearchEngine, type ParityEngine } from '../helpers/engines.js';
import {
    edgesDataType, edgesRecords, edgesTypeConfig, dateBoundCases, regexpCases, geoEdgeCases,
    fieldlessEdgeCases, objectCases, scalarEdgeCases
} from '../cases/edges.js';
import {
    datePrecisionCases, escapedWildcardCases, fieldlessCases, listCases,
    valuesDataType, valuesRecords, valuesTypeConfig
} from '../cases/values.js';

/**
 * The same query over the same records in both engines, checked against one expected answer.
 *
 * `test/query/` covers the DSL and `test/sql/` covers the SQL, but neither shows that the two
 * agree. A caller switching from `restrictSearchQuery` to `restrictSQLQuery` expects the same
 * records. Each case runs against a real OpenSearch and a real DuckDB, and both results are
 * compared to the ids the case declares, so two engines agreeing on a wrong answer still fails.
 *
 * Not covered here:
 *
 * - Analyzed text. SQL has no analyzer, so a `text` field is matched whole instead of by
 *   token, so the corpora have no `text` field.
 * - `geo_shape` relations. OpenSearch stores shapes at limited precision and answers
 *   `within`/`contains` differently from OGC semantics for some pairs. That comes from the
 *   storage, not the translation. `test/sql/duckdb-geo-spec.ts` covers the SQL side.
 * - `knn`, which has no SQL equivalent and throws instead of generating SQL.
*/
describe('query parity, opensearch vs duckdb', () => {
    const index = 'query_parity_';
    const table = 'query_parity';

    let engines: ParityEngine[];

    const access = new QueryAccess({
        prevent_prefix_wildcard: true,
        allow_implicit_queries: true,
        allow_empty_queries: true,
        type_config: typeConfig,
        filterNilVariables: true,
        variables: undefined
    });

    beforeAll(async () => {
        engines = await Promise.all([
            makeOpenSearchEngine(index, dataType, records),
            makeDuckDBEngine(table, dataType, records),
        ]);
    });

    afterAll(async () => {
        await Promise.all(engines.map((engine) => engine.close()));
    });

    /**
     * Both answers keyed by engine, compared in one assertion so a failure shows what each
     * engine returned.
    */
    async function answers(
        query: string, using: QueryAccess<any> = access
    ): Promise<Record<string, string[]>> {
        const entries = await Promise.all(
            engines.map(async (engine) => {
                const ids = await engine.search(using, query);
                return [engine.name, ids] as const;
            })
        );

        return Object.fromEntries(entries);
    }

    const groups: [string, QueryCase[]][] = [
        ['a term-level query', [...termCases]],
        ['multiple statements', [...multiStatementCases]],
        ['a negation', [...negationCases]],
        ['a numeric range', [...numericRangeCases]],
        ['a date range', [...dateRangeCases]],
        ['a keyword range', [...keywordRangeCases]],
        ['an ip query', [...ipCases]],
        ['an ip_range query', [...ipRangeCases]],
    ];

    describe.each(groups)('given %s', (_group, cases) => {
        it.each(cases)('answers %s the same way', async (_name, query, ids) => {
            const expected = [...ids].sort();

            await expect(answers(query)).resolves.toEqual({
                opensearch: expected,
                duckdb: expected,
            });
        });
    });

    /**
     * The `QueryAccess` above refuses a leading wildcard, so these cases use one that permits
     * it. The translation must still be right for a deployment that allows them.
    */
    describe('given a leading wildcard', () => {
        const permissive = new QueryAccess({
            allow_implicit_queries: true,
            allow_empty_queries: true,
            type_config: typeConfig,
        });

        it.each([...prefixWildcardCases])('answers %s the same way', async (_name, query, ids) => {
            const expected = [...ids].sort();

            await expect(answers(query, permissive)).resolves.toEqual({
                opensearch: expected,
                duckdb: expected,
            });
        });
    });

    /**
     * The parser, not the translator, rejects a `*` bound on an `ip` field.
     *
     * `parseRange` turns an open end into `Infinity`, and the `ip` field type validates every
     * bound as an address, so `ip:[* TO *]`, `ip:[a TO *]` and `ip:[* TO b]` fail before
     * either translator runs. An `ip_range` field is not validated this way, so
     * `net:[* TO *]` works and only `ip` is pinned here.
     *
     * Use `_exists_:ip` for what the unbounded range would have asked.
    */
    it.each([
        ['both ends open', 'ip:[* TO *]'],
        ['the upper end open', 'ip:["10.0.0.0" TO *]'],
        ['the lower end open', 'ip:[* TO "10.0.0.0"]'],
    ])('refuses an ip range with %s, in both engines', async (_name, query) => {
        await expect(access.restrictSearchQuery(query, { params: { index } })).toReject();
        await expect(access.restrictSQLQuery(query, { params: { table } })).toReject();
    });

    /**
     * Fields whose values decide the match: lists, escaped wildcard characters, dates to less
     * than a millisecond, and a query with no field beside a geo field (see `cases/values.ts`).
    */
    describe('given what a field holds', () => {
        let valueEngines: ParityEngine[];

        const valuesAccess = new QueryAccess({
            allow_implicit_queries: true,
            allow_empty_queries: true,
            type_config: valuesTypeConfig,
            filterNilVariables: true,
        });

        beforeAll(async () => {
            valueEngines = await Promise.all([
                makeOpenSearchEngine(`${index}values_`, valuesDataType, valuesRecords),
                makeDuckDBEngine(`${table}_values`, valuesDataType, valuesRecords),
            ]);
        });

        afterAll(async () => {
            await Promise.all(valueEngines.map((engine) => engine.close()));
        });

        async function valueAnswers(
            query: string, variables?: Record<string, unknown>
        ): Promise<Record<string, string[]>> {
            const entries = await Promise.all(valueEngines.map(async (engine) => (
                [engine.name, await engine.search(valuesAccess, query, variables)] as const
            )));
            return Object.fromEntries(entries);
        }

        describe.each([
            ['a list', listCases],
            ['an escaped wildcard character', escapedWildcardCases],
            ['a date to less than a millisecond', datePrecisionCases],
            ['no field', fieldlessCases],
        ])('given %s', (_group, cases) => {
            it.each([...cases])('answers %s the same way', async (_name, query, ids) => {
                const expected = [...ids].sort();

                await expect(valueAnswers(query)).resolves.toEqual({
                    opensearch: expected,
                    duckdb: expected,
                });
            });
        });

        it.each([
            ['one value', { v: 'Emu' }, ['01', '04']],
            ['a list of values', { v: ['Yak', 'c'] }, ['01', '02', '07']],
        ])('answers a variable with %s for a list the same way', async (_name, variables, ids) => {
            await expect(valueAnswers('tags:$v', variables)).resolves.toEqual({
                opensearch: ids,
                duckdb: ids,
            });
        });
    });

    /** Checks that both engines hold the whole corpus. */
    it('loaded every record into both engines', async () => {
        const expected = records.map(({ id }) => id as string).sort();

        await expect(answers('*')).resolves.toEqual({
            opensearch: expected,
            duckdb: expected,
        });
    });

    /**
     * Where SQL and Elasticsearch read a query differently unless the translator corrects it:
     * rounded date bounds, regexp anchors, polygon edges, booleans and lists of objects in a
     * query with no field, and objects with no values (see `cases/edges.ts`).
    */
    describe('given values at the edges', () => {
        let edgeEngines: ParityEngine[];

        const edgesAccess = new QueryAccess({
            allow_implicit_queries: true,
            allow_empty_queries: true,
            prevent_prefix_wildcard: false,
            type_config: edgesTypeConfig,
        });

        beforeAll(async () => {
            edgeEngines = await Promise.all([
                makeOpenSearchEngine(`${index}edges_`, edgesDataType, edgesRecords),
                makeDuckDBEngine(`${table}_edges`, edgesDataType, edgesRecords),
            ]);
        });

        afterAll(async () => {
            await Promise.all(edgeEngines.map((engine) => engine.close()));
        });

        async function edgeAnswers(query: string): Promise<Record<string, string[]>> {
            const entries = await Promise.all(edgeEngines.map(async (engine) => (
                [engine.name, await engine.search(edgesAccess, query)] as const
            )));
            return Object.fromEntries(entries);
        }

        describe.each([
            ['a date bound', dateBoundCases],
            ['a regexp', regexpCases],
            ['a geo edge', geoEdgeCases],
            ['no field', fieldlessEdgeCases],
            ['an object', objectCases],
            ['a scalar edge', scalarEdgeCases],
        ])('given %s', (_group, cases) => {
            it.each([...cases])('answers %s the same way', async (_name, query, ids) => {
                const expected = [...ids].sort();

                await expect(edgeAnswers(query)).resolves.toEqual({
                    opensearch: expected,
                    duckdb: expected,
                });
            });
        });

        it.each(['ip:10.0.*', 'ip:/10\\.0\\..*/'])('refuses %s, a pattern on an address field, in both', async (query) => {
            for (const engine of edgeEngines) {
                await expect(engine.search(edgesAccess, query))
                    .rejects.toThrow(/Can only use (wildcard|regexp) queries on keyword and text fields/);
            }
        });
    });
});
