import { TSError, isString } from '@terascope/core-utils';
import { SQLDialect, SQLDialectName } from '@terascope/types';
import { DuckDBDialect } from './duckdb.js';
import { PostgresDialect } from './postgres.js';

export * from './base.js';
export * from './duckdb.js';
export * from './postgres.js';

/**
 * One instance per engine, shared.
 *
 * A dialect holds no state - every method is a pure function of its arguments - so there is
 * nothing to isolate between translations and nothing to reset between them.
*/
const DIALECTS: Readonly<Record<SQLDialectName, SQLDialect>> = Object.freeze({
    [SQLDialectName.duckdb]: new DuckDBDialect(),
    [SQLDialectName.postgres]: new PostgresDialect(),
});

/** The engines this knows how to emit for. */
export function getAvailableSQLDialects(): string[] {
    return Object.keys(DIALECTS);
}

/**
 * Resolve the `dialect` option.
 *
 * An object passes straight through, so a caller can hand in a subclass - or an overridden
 * copy of a built-in - without one being registered here first.
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
