/**
 * One query and the records it must return, as a tuple a `describe.each` can name.
 *
 * The ids are the ANSWER, not one engine's answer: every case here is run against both
 * OpenSearch and DuckDB and each is compared to this list rather than to the other. Two
 * engines agreeing on a wrong answer is a thing that happens, and asserting them against
 * each other alone would not catch it.
*/
export type QueryCase = readonly [name: string, query: string, ids: readonly string[]];
