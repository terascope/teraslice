import 'jest-extended';
import { QueryAccess } from '../../src/query-access/index.js';
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
 * **The same query, the same records, both engines, one expected answer.**
 *
 * `test/query/` proves the DSL works and `test/sql/` proves the SQL works, but neither can
 * show that the two AGREE - and agreement is the contract, because a caller swapping
 * `restrictSearchQuery` for `restrictSQLQuery` is not asking for a different answer. So every
 * case here is answered by a real OpenSearch and a real DuckDB and both are compared to the
 * ids the case declares, which is a stronger assertion than comparing them to each other:
 * two engines can agree on the wrong answer, and one of them silently changing to match the
 * other would pass a test that only asked them to match.
 *
 * What is deliberately NOT here, and why:
 *
 * - **Analyzed text.** There is no analyzer in SQL, so a `text` field is matched whole rather
 *   than by token. Every field in the corpus is a `keyword` for that reason.
 * - **`geo_shape` relations.** OpenSearch stores a shape at limited precision and answers
 *   `within`/`contains` differently from OGC semantics for some pairs; that is a property of
 *   the storage, not of the translation. `test/sql/duckdb-geo-spec.ts` covers the SQL side.
 * - **Fieldless queries.** `multi_match` searches every field; SQL compares only the fields
 *   whose type could hold the value, so the two agree on the records but not on the reason.
 * - **`knn`**, which has no SQL equivalent and raises instead of emitting one.
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
     * Both answers keyed by engine, compared in one assertion.
     *
     * Asserting them separately would report the first failure and say nothing about whether
     * the other engine agreed with it, which is the thing worth knowing.
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
     * A leading wildcard is refused by the `QueryAccess` above, so these get one that permits
     * it - the translation still has to be right for a deployment that allows them.
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
     * **An `ip` field cannot take a `*` bound, and that is the PARSER, not the translation.**
     *
     * `parseRange` turns an open end into `Infinity`, and the `ip` field type validates every
     * bound as an address - so `ip:[* TO *]`, `ip:[a TO *]` and `ip:[* TO b]` all fail before
     * either translator is reached, and both engines are equally unable to answer them. An
     * `ip_range` field is not validated the same way and `net:[* TO *]` works, which is why
     * only one of the two is pinned here.
     *
     * `_exists_:ip` is the query that asks what the unbounded range would have asked.
    */
    it.each([
        ['both ends open', 'ip:[* TO *]'],
        ['the upper end open', 'ip:["10.0.0.0" TO *]'],
        ['the lower end open', 'ip:[* TO "10.0.0.0"]'],
    ])('refuses an ip range with %s, in both engines', async (_name, query) => {
        await expect(access.restrictSearchQuery(query, { params: { index } })).toReject();
        await expect(access.restrictSQLQuery(query, { params: { table } })).toReject();
    });

    /** The corpus is only worth anything if both engines actually hold all of it. */
    it('loaded every record into both engines', async () => {
        const expected = records.map(({ id }) => id as string).sort();

        await expect(answers('*')).resolves.toEqual({
            opensearch: expected,
            duckdb: expected,
        });
    });
});
