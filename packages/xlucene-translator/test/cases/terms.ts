import type { QueryCase } from './interfaces.js';
import { allExcept } from './corpus.js';

/**
 * The term-level nodes, one query each.
 *
 * The two engines answer these by different means: a `wildcard` query versus a `LIKE`
 * pattern, a `regexp` query versus `regexp_full_match`, a `term` versus `=`. Returning the
 * same records is what shows each node is translated correctly.
 *
 * Both engines anchor a regular expression. Elasticsearch's `regexp` query matches the whole
 * value, so `/lph/` does not find `alpha`.
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
    // the alternation stays inside the anchors; `^gamma` or `delta$` would be a different query
    ['a regular expression with an alternation', 'name:/gamma|delta/', ['03', '05']],
    ['exists', '_exists_:name', allExcept('07', '11')],
];

/**
 * The queries `prevent_prefix_wildcard` refuses.
 *
 * A leading `*` or `?` must read every term in the field. These cases run through a
 * `QueryAccess` that permits them, to check the translation when a deployment allows them:
 * a `wildcard` query and a `LIKE '%…'` must select the same records. The refusal itself is
 * tested in `test/sql/duckdb-query-access-spec.ts`.
*/
export const prefixWildcardCases: readonly QueryCase[] = [
    ['a leading *', 'name:*ta', ['02', '05', '06', '10']],
    // `?` is exactly one character, so `beta` matches and the five-letter `delta` does not
    ['a leading ?', 'name:?eta', ['02', '06', '10']],
    ['a * on its own, which asks only that the field have a value', 'name:*', allExcept('07', '11')],
];
