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
 *   token. Every field in the corpus is a `keyword` for that reason.
 * - `geo_shape` relations. OpenSearch stores shapes at limited precision and answers
 *   `within`/`contains` differently from OGC semantics for some pairs. That comes from the
 *   storage, not the translation. `test/sql/duckdb-geo-spec.ts` covers the SQL side.
 * - Fieldless queries. `multi_match` searches every field, while SQL compares only fields
 *   whose type could hold the value, so the records match but the reasons differ.
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

    /** Checks that both engines hold the whole corpus. */
    it('loaded every record into both engines', async () => {
        const expected = records.map(({ id }) => id as string).sort();

        await expect(answers('*')).resolves.toEqual({
            opensearch: expected,
            duckdb: expected,
        });
    });
});
