import { DuckDBInstance, DuckDBConnection, DuckDBDataChunk } from '@duckdb/node-api';
import {
    DataTypeConfig, ReadonlyDataTypeConfig, DataTypeFieldConfig, DataTypeFields, FieldType
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';
import { coerceToType } from '../builder/type-coercion.js';
import { buildColumnTypes, quoteIdentifier } from './type-map.js';
import { makeValueConverter, ValueConverter } from './duck-values.js';

/**
 * A frame whose rows live in a DuckDB table.
 *
 * Its own thing with its own API - `DataFrame` and the QPL engine are frozen and this
 * neither wraps nor replaces them.
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
 * See `docs/ingest-findings.md` - read the STOP block, not the chronology.
*/

/** DuckDB's hard per-chunk row limit. Appending more in one chunk throws. */
const MAX_CHUNK_ROWS = 2048;

/**
 * Owns the DuckDB instance and connection.
 *
 * Separate from the frame because DuckDB is embedded and process-wide: the worker holds
 * ONE database with many tables, so an instance per frame would be wasteful and would
 * break cross-frame joins, which need a shared catalogue.
*/
export class DuckContext {
    private constructor(
        readonly instance: DuckDBInstance,
        readonly connection: DuckDBConnection
    ) {}

    static async create(path = ':memory:'): Promise<DuckContext> {
        const instance = await DuckDBInstance.create(path);
        return new DuckContext(instance, await instance.connect());
    }

    async run(sql: string): Promise<void> {
        await this.connection.run(sql);
    }

    async scalar(sql: string): Promise<unknown> {
        const rows = await (await this.connection.run(sql)).getRowsJson();
        return rows.length === 0 ? undefined : rows[0][0];
    }

    async rows(sql: string): Promise<unknown[][]> {
        return (await (await this.connection.run(sql)).getRowsJson()) as unknown[][];
    }

    /**
     * Streams a query's rows as objects, a DuckDB chunk at a time.
     *
     * Uses `stream()` + `fetchChunk()` rather than a materializing read, so a large
     * result never lands in JS all at once. The QPL engine's output path is
     * `frame.rows(...)` returning an `Iterable`, not an array (`run.ts:188`), so streaming
     * is the shape that path already expects.
    */
    async* streamRowObjects(sql: string): AsyncIterableIterator<Record<string, unknown>> {
        const result = await this.connection.stream(sql);
        const names = result.columnNames();

        for (;;) {
            const chunk = await result.fetchChunk();
            // MEASURED: fetchChunk never returns null - at the end it returns an EMPTY
            // chunk, forever. So rowCount === 0 IS the terminator. Skipping empties and
            // waiting for null (which is what the docs' shape suggests) is an infinite
            // loop; the null check stays only as a guard, not as the exit condition.
            if (chunk == null || chunk.rowCount === 0) return;

            const columns = names.map((_name, i) => chunk.getColumnValues(i));
            for (let row = 0; row < chunk.rowCount; row++) {
                yield Object.fromEntries(
                    names.map((name, col) => [name, columns[col][row]])
                );
            }
        }
    }

    disconnect(): void {
        this.connection.disconnectSync();
    }
}

let defaultContext: Promise<DuckContext> | undefined;

/**
 * The process-wide context, created on first use.
 *
 * There is exactly ONE database per process: the qpl-api and qpl-worker are separate
 * processes whose frames never meet, and a child process hands Parquet to its parent
 * rather than sharing a catalogue. So callers never pass a context around. It stays
 * injectable for tests and for a file-backed database.
*/
export function getDefaultContext(): Promise<DuckContext> {
    defaultContext ??= DuckContext.create();
    return defaultContext;
}

/** Resets the process-wide context. Tests only. */
export function resetDefaultContext(): void {
    defaultContext = undefined;
}

/** Where a frame's rows come from. */
type Source
    = | { kind: 'table'; table: string }
        | { kind: 'relation'; sql: string };

/** One field's coercion failure, with the value that caused it. */
export interface CoercionFailure {
    field: string;
    fieldType: string;
    failedCount: number;
    /** The original value, which is the only useful thing to report. */
    exampleValue: string;
}

/** Raised by strict mode when a value does not fit its declared field type. */
export class CoercionFailureError extends Error {
    constructor(message: string, readonly failures: readonly CoercionFailure[]) {
        super(message);
        this.name = 'CoercionFailureError';
    }
}

export type CoercionMode
    /** ingest: a value that fails to convert is corruption, and is raised */
    = | 'strict'
    /** QPL pipeline: a value that fails to convert is the answer, and is nulled */
        | 'lenient';

export interface FrameOptions {
    /** Defaults to the process-wide context. */
    context?: DuckContext;
    /** Used for the table or relation name. */
    name?: string;
}

export interface FromRecordsOptions extends FrameOptions {
    /** Defaults to `strict`. */
    mode?: CoercionMode;
}

let tableCounter = 0;

/** Table names come from us, never from user data, so a counter suffices. */
function nextTableName(name?: string): string {
    tableCounter += 1;
    const base = (name ?? 'duck_frame').replace(/[^A-Za-z0-9_]/g, '_');
    return `${base}_${tableCounter}`;
}

interface FieldPlan {
    name: string;
    fieldType: string;
    coerce: (value: unknown) => unknown;
    convert: ValueConverter;
}

/**
 * Resolves each top-level field to its coercion and its DuckDB value conversion.
 *
 * Dot-notation children are folded into their parent, so the plan matches the table's
 * real column set.
*/
function buildPlan(config: DataTypeConfig | ReadonlyDataTypeConfig): FieldPlan[] {
    const fields = config.fields ?? {};
    return Object.entries(fields)
        .filter(([name]) => !name.includes('.'))
        .map(([name, fieldConfig]) => {
            const children = getChildDataTypeConfig(
                fields, name, fieldConfig.type as FieldType
            ) as DataTypeFields | undefined;
            return {
                name,
                fieldType: String(fieldConfig.type),
                coerce: coerceToType(fieldConfig as DataTypeFieldConfig, children),
                convert: makeValueConverter(fieldConfig as DataTypeFieldConfig, children),
            };
        });
}

export class DuckFrame {
    private constructor(
        private readonly ctx: DuckContext,
        readonly config: DataTypeConfig | ReadonlyDataTypeConfig,
        private readonly source: Source,
        readonly columns: readonly string[]
    ) {}

    /** True when the rows are in a real table rather than recomputed per reference. */
    get isMaterialized(): boolean {
        return this.source.kind === 'table';
    }

    /**
     * SQL naming this frame's rows, usable directly in a FROM clause.
     *
     * A materialized frame is its table name; a relation is a parenthesised subquery, so
     * composing frames is textual and the optimiser sees a single statement.
    */
    get from(): string {
        return this.source.kind === 'table'
            ? quoteIdentifier(this.source.table)
            : `(${this.source.sql})`;
    }

    /** For callers running their own SQL against this frame. */
    get context(): DuckContext {
        return this.ctx;
    }

    /** The backing table name, when this frame is materialized. */
    get table(): string | undefined {
        return this.source.kind === 'table' ? this.source.table : undefined;
    }

    /**
     * Builds a frame from JS records - the shape callers actually hold, since the
     * Elasticsearch client returns parsed objects.
     *
     * `coerceToType` throws on a value that does not fit its field type. Rather than
     * aborting on the first one (which is what `DataFrame.fromJSON` does, losing a whole
     * slice to one bad record), every failure is collected and the value nulled. In
     * `strict` mode the collected set is then raised as a `CoercionFailureError` naming
     * each field and an offending value; in `lenient` mode the nulls simply stand.
     *
     * That flag-and-continue contract is a decision Jared took provisionally and wants
     * revisited - possibly making whole-batch rejection configurable. See the DEFERRED
     * section of docs/ingest-findings.md.
    */
    static async fromRecords(
        config: DataTypeConfig | ReadonlyDataTypeConfig,
        records: readonly Record<string, unknown>[],
        options: FromRecordsOptions = {}
    ): Promise<DuckFrame> {
        const context = options.context ?? await getDefaultContext();
        const plan = buildPlan(config);
        if (plan.length === 0) {
            throw new TypeError('A DataType config must declare at least one field');
        }

        const table = nextTableName(options.name);
        const columnTypes = buildColumnTypes(config);
        const ddl = plan
            .map(({ name }) => `${quoteIdentifier(name)} ${columnTypes[name]}`)
            .join(', ');
        await context.run(`CREATE OR REPLACE TABLE ${quoteIdentifier(table)} (${ddl})`);

        const failures = new Map<string, CoercionFailure>();
        const appender = await context.connection.createAppender(table);
        const chunkTypes = (
            await context.connection.run(`SELECT * FROM ${quoteIdentifier(table)} LIMIT 0`)
        ).columnTypes();

        for (let offset = 0; offset < records.length; offset += MAX_CHUNK_ROWS) {
            const window = records.slice(offset, offset + MAX_CHUNK_ROWS);
            const chunk = DuckDBDataChunk.create(chunkTypes, window.length);

            chunk.setColumns(plan.map(({ name, fieldType, coerce, convert }) => (
                window.map((record) => {
                    try {
                        return convert(coerce(record[name]));
                    } catch {
                        const existing = failures.get(name);
                        if (existing) {
                            existing.failedCount += 1;
                        } else {
                            failures.set(name, {
                                field: name,
                                fieldType,
                                failedCount: 1,
                                exampleValue: String(record[name]),
                            });
                        }
                        return null;
                    }
                })
            )) as never[][]);

            appender.appendDataChunk(chunk);
        }

        appender.flushSync();
        appender.closeSync();

        if ((options.mode ?? 'strict') === 'strict' && failures.size > 0) {
            const detail = [...failures.values()]
                .map((f) => `${f.field} (${f.fieldType}): ${f.failedCount} failed, `
                    + `e.g. ${JSON.stringify(f.exampleValue)}`)
                .join('; ');
            throw new CoercionFailureError(
                `coercion failed for ${failures.size} field(s) - ${detail}`,
                [...failures.values()]
            );
        }

        return new DuckFrame(
            context, config, { kind: 'table', table }, plan.map(({ name }) => name)
        );
    }

    /**
     * Reads a Parquet file whose values were validated upstream, doing NO coercion.
     *
     * A separately named constructor rather than `fromRecords(..., {validate: false})`: a
     * boolean flag is what silently flips to the wrong default in a refactor.
     *
     * Safe because Parquet is typed and schema-carrying, so column types are enforced by
     * the format; only semantic validity relies on the upstream pass.
    */
    static async fromParquet(
        config: DataTypeConfig | ReadonlyDataTypeConfig,
        path: string,
        options: FrameOptions = {}
    ): Promise<DuckFrame> {
        const context = options.context ?? await getDefaultContext();
        // relation-backed: a Parquet file is already a queryable source, so nothing is
        // copied until something asks for the rows
        const sql = `SELECT * FROM read_parquet('${path.replace(/'/g, '\'\'')}')`;
        return new DuckFrame(
            context, config, { kind: 'relation', sql }, Object.keys(buildColumnTypes(config))
        );
    }

    /**
     * Promotes this frame to a real table, returning a NEW frame. The original stays valid
     * and unchanged.
     *
     * Worth doing when this frame's own computation is expensive AND it is referenced more
     * than once: a relation is recomputed at every reference (measured 2.59x for a sort
     * referenced four times). NOT worth it for a single use (1.36x slower), nor for a cheap
     * relation over a base table however often that is referenced - a join target that
     * never mutates the original needs no copy. The whole plan is known before execution,
     * so this is decidable statically rather than by counting references at runtime.
    */
    async materialize(name?: string): Promise<DuckFrame> {
        if (this.isMaterialized) return this;
        const table = nextTableName(name ?? 'materialized');
        await this.ctx.run(
            `CREATE OR REPLACE TABLE ${quoteIdentifier(table)} AS SELECT * FROM ${this.from}`
        );
        return new DuckFrame(this.ctx, this.config, { kind: 'table', table }, this.columns);
    }

    /**
     * Projection - **the mechanism for column mutation and validation.**
     *
     * Every column-level operation is a projection: applying a transform, validating,
     * renaming, dropping, adding a derived column. `SELECT expr AS name` covers all of
     * them. Because projections compose into the relation, a chain of transforms becomes
     * ONE statement evaluated in a single pass, where data-mate makes a separate pass per
     * function.
     *
     * The expression may be native SQL or a call to a UDF over the real primitive; that
     * choice is per function, and per-value JS measured ~0.89x of complex SQL but ~10x of a
     * trivial cast.
     *
     * Returns a new relation-backed frame; the original is untouched.
    */
    select(
        expressions: Readonly<Record<string, string>>,
        config: DataTypeConfig | ReadonlyDataTypeConfig = this.config
    ): DuckFrame {
        const names = Object.keys(expressions);
        if (names.length === 0) {
            throw new TypeError('select requires at least one expression');
        }
        const list = names
            .map((name) => `${expressions[name]} AS ${quoteIdentifier(name)}`)
            .join(', ');
        return new DuckFrame(
            this.ctx, config, { kind: 'relation', sql: `SELECT ${list} FROM ${this.from}` }, names
        );
    }

    /** Row filter. Returns a new relation-backed frame. */
    filter(predicate: string): DuckFrame {
        return new DuckFrame(
            this.ctx,
            this.config,
            { kind: 'relation', sql: `SELECT * FROM ${this.from} WHERE ${predicate}` },
            this.columns
        );
    }

    async size(): Promise<number> {
        return Number(await this.ctx.scalar(`SELECT count(*) FROM ${this.from}`) ?? 0);
    }

    /**
     * Writes Parquet with zstd, for transport.
     *
     * zstd, never gzip: measured, Parquet's internal compression costs ~30 ms at 1M rows
     * and produces a SMALLER payload than gzipping ndjson or dfjson, which cost ~1.4-1.9 s.
    */
    async writeParquet(path: string): Promise<void> {
        await this.ctx.run(
            `COPY (SELECT * FROM ${this.from}) TO '${path.replace(/'/g, '\'\'')}'`
            + ' (FORMAT parquet, COMPRESSION zstd)'
        );
    }

    /**
     * Streams the frame's rows as objects. **The real output path.**
     *
     * `DataFrame.rows()` is what the QPL engine calls to produce records for the response
     * (`run.ts:188`) and it returns an `Iterable`, so this is lazy for the same reason:
     * the result may be far larger than the response.
     *
     * Deliberately NOT a `toArray()`. `DataFrame` has one and spaces never calls it -
     * zero uses across the spaces sources - and the one first written here also carried a
     * BIGINT-renders-as-string bug tracked as debt for three increments before anyone
     * asked what used it.
     *
     * ALSO deliberately not a `getColumn()`. All 7 engine uses extract a resident JS
     * `.vector`, or index a single row by position; that is exactly the model that cannot
     * port, because the data lives in DuckDB. Those belong in SQL as projections.
    */
    rows(): AsyncIterableIterator<Record<string, unknown>> {
        return this.ctx.streamRowObjects(`SELECT * FROM ${this.from}`);
    }

    /**
     * Drops the backing table, if this frame owns one. A relation has nothing to drop.
     *
     * Only safe once nothing derives from this frame: a relation built over it reads the
     * table by name.
    */
    async destroy(): Promise<void> {
        if (this.source.kind === 'table') {
            await this.ctx.run(`DROP TABLE IF EXISTS ${quoteIdentifier(this.source.table)}`);
        }
    }
}
