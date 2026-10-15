/**
 * TealFrame, a frame whose rows live in DuckDB.
 *
 * `DuckContext` is not exported, so a frame cannot be handed a database it cannot see. Use
 * `configureDuckDatabase`, `registerScalarFunction` and `closeDuckDatabase` to manage the
 * database.
*/
export * from './clauses.js';
export * from './date-value.js';
export * from './deep-select.js';
export * from './database.js';
export * from './TealFrame.js';
export * from './duck-values.js';
export * from './errors.js';
export * from './expand-values.js';
export * from './export-json.js';
export * from './extension-tools.js';
export * from './extensions.js';
export * from './interfaces.js';
export * from './scalar-function.js';
export * from './udf-types.js';
export * from './schema-check.js';
