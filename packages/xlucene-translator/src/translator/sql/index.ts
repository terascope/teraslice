/**
 * The SQL translator.
 *
 * Only the xLucene AST walk lives here. The dialects, quoting, clauses and statement
 * assembly live in `@terascope/sql-builder`, which `data-mate` also uses, so both generate
 * the same sorts and projections.
 *
 * `@terascope/sql-builder` is re-exported so callers can get the dialects from this package.
*/
export * from '@terascope/sql-builder';
export * from './interfaces.js';
export * from './translate.js';
