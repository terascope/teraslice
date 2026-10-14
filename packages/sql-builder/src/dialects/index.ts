import { TSError, isString } from '@terascope/core-utils';
import { SQLDialect, SQLDialectName } from '@terascope/types';
import { DuckDBDialect } from './duckdb.js';
import { PostgresDialect } from './postgres.js';

export * from './base.js';
export * from './duckdb.js';
export * from './postgres.js';

/**
 * One shared instance per engine. Dialects hold no state, so sharing them is safe.
*/
const DIALECTS: Readonly<Record<SQLDialectName, SQLDialect>> = Object.freeze({
    [SQLDialectName.duckdb]: new DuckDBDialect(),
    [SQLDialectName.postgres]: new PostgresDialect(),
});

/** The names of the supported SQL dialects. */
export function getAvailableSQLDialects(): string[] {
    return Object.keys(DIALECTS);
}

/**
 * Resolve the `dialect` option to a dialect, defaulting to DuckDB.
 *
 * A dialect object is returned unchanged, so callers can pass their own subclass without
 * registering it.
*/
export function getSQLDialect(input?: SQLDialectName | SQLDialect): SQLDialect {
    if (input == null) return DIALECTS[SQLDialectName.duckdb];
    if (!isString(input)) return input;

    const dialect = DIALECTS[input as SQLDialectName];

    if (dialect == null) {
        throw new TSError(`Unsupported SQL dialect "${input}", expected one of ${getAvailableSQLDialects().join(', ')}`, {
            statusCode: 400,
            context: { safe: true }
        });
    }

    return dialect;
}
