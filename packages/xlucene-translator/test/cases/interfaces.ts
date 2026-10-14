/**
 * One query and the records it must return, as a tuple a `describe.each` can name.
 *
 * The ids are the expected answer. Each case runs against both OpenSearch and DuckDB, and
 * each engine is checked against this list, not against the other engine, so two engines
 * agreeing on a wrong answer still fails.
*/
export type QueryCase = readonly [name: string, query: string, ids: readonly string[]];
