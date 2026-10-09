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
 * **The ingest path** - getting rows INTO a frame's table: `TealFrame.append`, and so
 * `fromRecords`.
 *
 * **There is no JSON anywhere in this path.** Records arrive as JS objects (the
 * Elasticsearch client already parsed them), are coerced by `coerceToType` - the SAME
 * function the regular builder uses - and are appended as typed values. Coercion is
 * therefore parity by construction: there is no second implementation of any field
 * semantics to drift from.
 *
 * Measured, 1M rows x 7 fields:
 *
 * | | time |
 * |---|---|
 * | `coerceToType` + appender (this path) | **510 ms** |
 * | `DataFrame.fromJSON` (ends at a DataFrame) | 573 ms |
 * | `COPY TO` parquet zstd | 30 ms |
 * | `read_parquet` on the far side, no coercion | **12 ms** |
 *
 * An earlier design serialized records to ndjson and used `read_json` plus a
 * hand-written SQL coercion layer. It was the same speed, needed ~2,000 lines
 * reimplementing `coerceToType`, and carried 11 documented divergences. It was deleted.
 * See `ingest-findings.md` in datamate-spaces - read the STOP block, not the chronology.
 *
 * Free functions rather than methods because none of them touches the frame: each takes the
 * connection the append owns (its own, for the transaction - see `appendInTransaction`), the
 * table, and what is going in. Separating them keeps `TealFrame.ts` about the frame.
*/

/** Row count that never throws: used while reporting a failure, where throwing again
 * would replace the real error with a worse one. */
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
 * `INSERT ... BY NAME`, **not positional** - measured: a plain `INSERT ... SELECT *` fails
 * outright when a payload's column order differs from the table's (`Could not convert
 * string 'z' to INT32`), and separate api-server responses are not worth trusting to agree
 * on column order.
 *
 * No coercion: Parquet is typed and schema-carrying, and these values were already
 * validated by `fromRecords` on the producer side.
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
 * Coerces with `coerceToType` - the SAME function the regular builder uses, so parity is by
 * construction - and appends the values through a typed DuckDB appender.
 *
 * `strict` (the default) fails on the FIRST bad value, matching `DataFrame`, whose Builder
 * throws out of `valueFrom` with nothing catching it. `lenient` nulls the value and collects
 * every failing field with counts and an example.
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

    /** Records one failure. In strict mode this throws immediately - see above. */
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
        // closed even on the failure path, so the rollback is not racing an open appender
        appender.closeSync();
    }

    return records.length;
}

/**
 * `TealFrame.append`'s transaction: ONE append, atomic, on its own connection.
 *
 * **Its own connection is a correctness requirement, not tuning.** A DuckDB transaction belongs to
 * a CONNECTION, and the shared one is shared process-wide - so on it, a second concurrent append's
 * `BEGIN` throws `cannot start a transaction within a transaction`, its `ROLLBACK` then discards
 * the FIRST append's rows, and every later statement on that connection fails with `Current
 * transaction is aborted`. All three measured. Concurrent fetchers appending to one frame is the
 * normal case, so each append is isolated.
 *
 * Concurrency is then genuinely safe AND fast, measured: 10 concurrent appends into the SAME table
 * from 10 connections all succeeded, no write conflict, 500k rows in 25 ms. DuckDB's MVCC handles
 * append-vs-append; there are no row conflicts to lose.
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
                // counted AFTER the rollback, so it reports what actually survived - and only
                // here, so a successful append never pays for it
                rowsRemaining: await countQuietly(connection, table),
            }, err);
        }
    } finally {
        connection.disconnectSync();
    }
}
