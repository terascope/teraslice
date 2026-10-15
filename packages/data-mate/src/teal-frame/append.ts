import { DuckDBConnection, DuckDBDataChunk, DuckDBInstance } from '@duckdb/node-api';
import { quoteIdentifier } from '@terascope/sql-builder';
import { MAX_CHUNK_ROWS } from './DuckContext.js';
import { AppendError, CoercionFailureError } from './errors.js';
import { describeSource, readParquetSource } from './sources.js';
import { buildPlan } from './table.js';
import {
    AppendOptions, AppendSource, CoercionFailure, FrameConfig
} from './interfaces.js';

/**
 * Loads rows into a frame's table. Used by `TealFrame.append` and `fromRecords`.
 *
 * Records arrive as JS objects, are coerced with `coerceToType` (the same function
 * `DataFrame`'s builder uses) and are appended as typed values, with no JSON round trip.
 * Because the coercion code is shared, field semantics match `DataFrame` exactly.
 *
 * These are free functions because none of them needs the frame. Each takes the append's own
 * connection (see `appendInTransaction`), the table name and the input.
*/

/** Counts a table's rows without throwing. Used while reporting a failure, where a second
 * error would hide the original one. */
export async function countQuietly(
    connection: DuckDBConnection, table: string
): Promise<number | undefined> {
    try {
        const result = await connection.run(
            `SELECT count(*) FROM ${quoteIdentifier(table)}`
        );
        const rows = await result.getRowsJson();
        return Number(rows[0]?.[0] ?? 0);
    } catch {
        return undefined;
    }
}

/**
 * Appends Parquet files with `INSERT ... BY NAME`.
 *
 * Columns are matched by name because a positional `INSERT ... SELECT *` fails when a file's
 * column order differs from the table's, and separately produced files may not agree on order.
 *
 * No coercion is needed: Parquet is typed, and the values were coerced by `fromRecords` when
 * the file was written.
*/
export async function appendParquet(
    connection: DuckDBConnection, table: string, paths: string | readonly string[]
): Promise<number> {
    const result = await connection.run(
        `INSERT INTO ${quoteIdentifier(table)} BY NAME`
        + ` SELECT * FROM ${readParquetSource(paths)}`
    );
    const rows = await result.getRowsJson();
    return Number(rows[0]?.[0] ?? 0);
}

/**
 * Coerces records with `coerceToType` and appends them through a typed DuckDB appender.
 *
 * `strict` (the default) throws on the first bad value, as `DataFrame`'s builder does.
 * `lenient` stores null instead and collects each failing field with a count and an example.
*/
export async function appendRecords(
    connection: DuckDBConnection,
    config: FrameConfig,
    table: string,
    records: readonly Record<string, unknown>[],
    options: AppendOptions
): Promise<number> {
    const plan = buildPlan(config);
    const lenient = (options.mode ?? 'strict') === 'lenient';
    const failures = new Map<string, CoercionFailure>();

    /** Records one failure. In strict mode this throws immediately. */
    const recordFailure = (name: string, fieldType: string, value: unknown): null => {
        const existing = failures.get(name);
        if (existing) {
            existing.failedCount += 1;
        } else {
            failures.set(name, {
                field: name,
                fieldType,
                failedCount: 1,
                exampleValue: String(value),
            });
        }

        if (!lenient) {
            throw new CoercionFailureError(
                `coercion failed for field ${name} (${fieldType}):`
                + ` ${JSON.stringify(String(value))}`,
                [...failures.values()]
            );
        }
        return null;
    };

    const appender = await connection.createAppender(table);
    const chunkTypes = (
        await connection.run(`SELECT * FROM ${quoteIdentifier(table)} LIMIT 0`)
    ).columnTypes();

    try {
        for (let offset = 0; offset < records.length; offset += MAX_CHUNK_ROWS) {
            const window = records.slice(offset, offset + MAX_CHUNK_ROWS);
            const chunk = DuckDBDataChunk.create(chunkTypes, window.length);

            chunk.setColumns(plan.map(({ name, fieldType, coerce, convert }) => (
                window.map((record) => {
                    try {
                        return convert(coerce(record[name]));
                    } catch {
                        return recordFailure(name, fieldType, record[name]);
                    }
                })
            )) as never[][]);

            appender.appendDataChunk(chunk);
        }

        appender.flushSync();
    } finally {
        // close on failure too, so the rollback does not run while the appender is open
        appender.closeSync();
    }

    return records.length;
}

/**
 * Runs one `TealFrame.append` as an atomic transaction on its own connection.
 *
 * **The separate connection is required for correctness.** A DuckDB transaction belongs to a
 * connection, and the shared connection is used by the whole process. If two appends shared it,
 * the second `BEGIN` would throw, its `ROLLBACK` would discard the first append's rows, and every
 * later statement would fail with `Current transaction is aborted`.
 *
 * With one connection per append, concurrent appends to the same table are safe: DuckDB's MVCC
 * lets appends proceed without write conflicts.
*/
export async function appendInTransaction(
    instance: DuckDBInstance,
    config: FrameConfig,
    table: string,
    source: AppendSource,
    options: AppendOptions
): Promise<number> {
    const connection = await instance.connect();

    try {
        await connection.run('BEGIN TRANSACTION');
        try {
            const added = source.records === undefined
                ? await appendParquet(connection, table, source.parquet)
                : await appendRecords(connection, config, table, source.records, options);

            await connection.run('COMMIT');
            return added;
        } catch (err) {
            await connection.run('ROLLBACK');

            throw new AppendError({
                table,
                source: source.records === undefined ? 'parquet' : 'records',
                describedSource: describeSource(source),
                // counted after the rollback, so it reports what is left; a successful
                // append never pays for the count
                rowsRemaining: await countQuietly(connection, table),
            }, err);
        }
    } finally {
        connection.disconnectSync();
    }
}
