import type { QueryCase } from './interfaces.js';
import { allExcept } from './corpus.js';

/**
 * The term-level nodes, one query each.
 *
 * These are the cases where the two engines do the same thing by completely different means -
 * a `wildcard` query against a `LIKE` pattern, a `regexp` query against `regexp_full_match`,
 * a `term` against `=` - so agreeing on the records is the only thing that shows the
 * translation of each node is right.
 *
 * **Both engines anchor a regular expression**, which is the one that surprises people:
 * Elasticsearch's `regexp` query matches the whole value, so `/lph/` does not find `alpha`.
*/
export const termCases: readonly QueryCase[] = [
    ['a term', 'name:alpha', ['01', '04', '09', '12']],
    ['a quoted term', 'name:"alpha"', ['01', '04', '09', '12']],
    ['a term on a boolean', 'active:false', ['02', '04', '07', '10']],
    ['a term on an integer', 'count:30', ['03', '09']],
    ['a term on a date', 'created:"2020-01-01"', ['01', '12']],
    ['a term that matches nothing', 'name:nobody', []],
    ['a trailing wildcard', 'name:al*', ['01', '04', '09', '12']],
    ['a wildcard in the middle', 'name:al?ha', ['01', '04', '09', '12']],
    ['an anchored regular expression', 'name:/al.*/', ['01', '04', '09', '12']],
    // anchored, so a substring of a value is not a match
    ['a regular expression that is only a substring', 'name:/lph/', []],
    // the alternation must not escape the anchors - `^gamma` or `delta$` is a different query
    ['a regular expression with an alternation', 'name:/gamma|delta/', ['03', '05']],
    ['exists', '_exists_:name', allExcept('07', '11')],
];

/**
 * The queries `prevent_prefix_wildcard` exists to refuse.
 *
 * A leading `*` or `?` has to read every term in the field, which is the whole index dressed
 * as a filter - so they are run through a `QueryAccess` that permits them, and the refusal
 * itself is checked in `test/sql/duckdb-query-access-spec.ts`. What they prove here is that
 * the translation is right when a deployment does allow them: a `wildcard` query and a
 * `LIKE '%…'` have to select the same records.
*/
export const prefixWildcardCases: readonly QueryCase[] = [
    ['a leading *', 'name:*ta', ['02', '05', '06', '10']],
    // `?` is exactly one character, so a five-letter `delta` is not a match and `beta` is
    ['a leading ?', 'name:?eta', ['02', '06', '10']],
    ['a * on its own, which asks only that the field have a value', 'name:*', allExcept('07', '11')],
];
