/**
 * The SQL half of the translator.
 *
 * Only the xLucene-specific walk lives here. Everything that renders SQL TEXT - the dialects,
 * quoting, clauses and statement assembly - moved to `@terascope/sql-builder`, so that
 * `data-mate`'s DuckDB frame can emit sorts and projections that agree with a translated
 * statement without either package depending on the other.
 *
 * It is re-exported rather than merely used, because callers reach these through
 * `@terascope/xlucene-translator` today and a translated query is not much use without the
 * dialect that rendered it.
*/
export * from '@terascope/sql-builder';
export * from './interfaces.js';
export * from './translate.js';
