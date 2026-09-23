/**
 * The DuckDB frame.
 *
 * `DuckContext` is deliberately absent: there is exactly one database per process, a caller
 * has nothing to pass around, and exporting it is what previously let a frame be routed
 * between databases it could not see. Reach the database through `configureDuckDatabase`,
 * `registerScalarFunction` and `closeDuckDatabase` instead.
*/
export * from './clauses.js';
export * from './database.js';
export * from './DuckFrame.js';
export * from './duck-values.js';
export * from './errors.js';
export * from './export-json.js';
export * from './interfaces.js';
export * from './scalar-function.js';
export * from './schema-check.js';
