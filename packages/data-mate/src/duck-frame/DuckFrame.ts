import {
    DuckDBInstance, DuckDBConnection, DuckDBDataChunk, DuckDBScalarFunction,
    DuckDBTimestampValue
} from '@duckdb/node-api';
import { bigIntToJSON, toISO8601 } from '@terascope/core-utils';
import {
    DataTypeConfig, ReadonlyDataTypeConfig, DataTypeFieldConfig, DataTypeFields, FieldType
} from '@terascope/types';
import { getChildDataTypeConfig } from '../core/utils.js';
import { coerceToType } from '../builder/type-coercion.js';
import { makeValueConverter, ValueConverter } from './duck-values.js';
import { createScalarFunction, ScalarFunctionSpec } from './scalar-function.js';
import { DataType } from '@terascope/data-types';
import { quoteIdentifier, quoteLiteral } from './sql.js';
import { buildJsonExpression, JsonExportOptions } from './export-json.js';

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
 * Owns the DuckDB instance and the shared connection.
 *
 * INTERNAL. Not exported and not reachable from a frame: there is exactly ONE database per
 * process - the qpl-api and qpl-worker are separate processes whose frames never meet, and a
 * child hands Parquet to its parent rather than sharing a catalogue. A caller has nothing to
 * pass around, so it is not in the API.
 *
 * The *instance* is shared because tables live in its catalogue and any connection can see
 * them (they are real tables, not TEMP, which would be connection-local). The *connection*
 * is deliberately NOT shared with streams - see `streamRowObjects`.
*/
class DuckContext {
    /**
     * Registered scalar functions, kept so they are not garbage-collected while DuckDB still
     * holds them, and so a name cannot be silently registered twice.
    */
    private readonly functions = new Map<string, DuckDBScalarFunction>();

    private constructor(
        readonly instance: DuckDBInstance,
        readonly connection: DuckDBConnection,
        /** The database path, so a frame can report where it lives. */
        readonly path: string
    ) {}

    /**
     * Registers a scalar function. **Instance-wide, not connection-scoped** - MEASURED: a
     * function registered on one connection is visible to every other connection on the same
     * instance, including the private connection each `rows()` stream opens. That is what
     * makes UDFs and streaming compatible.
    */
    registerFunction(spec: ScalarFunctionSpec): void {
        // Idempotent: `duckFrameAdapter` derives the name from (function, column, args), so
        // the same step registered twice IS the same function and must not error.
        if (this.functions.has(spec.name)) return;

        const fn = createScalarFunction(spec);
        this.connection.registerScalarFunction(fn);
        this.functions.set(spec.name, fn);
    }

    hasFunction(name: string): boolean {
        return this.functions.has(name);
    }

    static async create(
        path = ':memory:',
        settings: DuckDatabaseSettings = {}
    ): Promise<DuckContext> {
        const instance = await DuckDBInstance.create(path);
        const context = new DuckContext(instance, await instance.connect(), path);
        await context.applySettings(settings);
        return context;
    }

    /**
     * Applies the spill and memory settings.
     *
     * `temp_directory` is what makes "load the whole dataset and let DuckDB overflow to disk"
     * work - without it a query that exceeds `memory_limit` fails instead of spilling. Both
     * are runtime `SET`s, so they can be changed on an existing database.
     *
     * `memory_limit` MUST be set below the container's cap. If DuckDB believes it has more
     * than the container allows it never spills and the kernel kills the process - that is
     * exactly what produced the bogus "OOMs and does not spill" finding in docs/HANDOFF.md.
    */
    async applySettings(settings: DuckDatabaseSettings): Promise<void> {
        if (settings.tempDirectory != null) {
            await this.run(`SET temp_directory = ${quoteLiteral(settings.tempDirectory)}`);
        }
        if (settings.maxTempDirectorySize != null) {
            await this.run(
                `SET max_temp_directory_size = ${quoteLiteral(settings.maxTempDirectorySize)}`
            );
        }
        if (settings.memoryLimit != null) {
            await this.run(`SET memory_limit = ${quoteLiteral(settings.memoryLimit)}`);
        }
        if (settings.threads != null) {
            await this.run(`SET threads = ${Math.trunc(settings.threads)}`);
        }
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
     *
     * **Each stream gets its OWN connection and closes it when the stream ends.**
     * MEASURED (`docs/tools/conn-isolation.mjs`): any query run on a connection holding an
     * open streaming result silently truncates that stream - one interleaved query took
     * 500,000 rows down to 100,352, with NO error. DuckDB concurrency itself is fine; the
     * limit is per-connection. On the shared connection, any other frame's `size()` - or
     * this frame's own - could clip a stream in progress and look like a short result.
    */
    /**
     * Streams a single-column result as strings, chunk by chunk.
     *
     * For output formats DuckDB has already rendered - ldjson, CSV - where the only work left
     * in JS is moving bytes. Deliberately does NOT go through `toPlainValue`: the value is
     * already the final text.
    */
    async* streamColumnStrings(sql: string): AsyncIterableIterator<string> {
        const connection = await this.instance.connect();

        try {
            const result = await connection.stream(sql);

            for (;;) {
                const chunk = await result.fetchChunk();
                if (chunk == null || chunk.rowCount === 0) return;

                const values = chunk.getColumnValues(0);
                for (let row = 0; row < chunk.rowCount; row++) {
                    yield String(values[row]);
                }
            }
        } finally {
            connection.disconnectSync();
        }
    }

    async* streamRowObjects(sql: string): AsyncIterableIterator<Record<string, unknown>> {
        const connection = await this.instance.connect();

        try {
            const result = await connection.stream(sql);
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
                        names.map((name, col) => [name, toPlainValue(columns[col][row])])
                    );
                }
            }
        } finally {
            // also runs on an early `break` out of a `for await`, not just on exhaustion
            connection.disconnectSync();
        }
    }

    /**
     * Closes the connection AND the instance.
     *
     * Closing the instance is not optional once a scalar UDF has been registered: MEASURED
     * (isolated in an earlier session; that script is gone), a process that registers one
     * **never exits** on
     * `disconnectSync()` alone, and `DuckDBScalarFunction.destroySync()` makes no difference.
     * `instance.closeSync()` is what releases it. Without a UDF the process exits either way,
     * so this is only visible once UDFs land - which is exactly when it would be hardest to
     * diagnose.
    */
    disconnect(): void {
        this.connection.disconnectSync();
        this.instance.closeSync();
    }
}

/** Spill and resource settings for a database. All are runtime `SET`s. */
export interface DuckDatabaseSettings {
    /**
     * Directory DuckDB spills to when a query exceeds `memoryLimit`. **Required for the
     * whole-dataset-plus-file-overflow strategy** - without it, an over-limit query fails
     * rather than overflowing to disk.
    */
    tempDirectory?: string;
    /** Cap on the spill directory, e.g. `'30GB'`. */
    maxTempDirectorySize?: string;
    /** e.g. `'48GB'`. **Set this BELOW the container's cap** - see `applySettings`. */
    memoryLimit?: string;
    threads?: number;
}

export interface DuckDatabaseOptions extends DuckDatabaseSettings {
    /** Path, or `:memory:`. See `FrameOptions.database` for the file-vs-memory trap. */
    database?: string;
}

const contexts = new Map<string, Promise<DuckContext>>();

/**
 * The context for a database path, created on first use and cached per path.
 *
 * `:memory:` is the process-wide default. A distinct path gives a file-backed database, and
 * is also how a test gets an isolated catalogue.
*/
function getContext(database = ':memory:'): Promise<DuckContext> {
    let context = contexts.get(database);
    if (!context) {
        context = DuckContext.create(database);
        contexts.set(database, context);
    }
    return context;
}

/**
 * Opens or reconfigures a database, and returns once the settings are applied.
 *
 * Call once at startup to point spill at a real directory:
 * `configureDuckDatabase({ tempDirectory: '/var/tmp/duck', memoryLimit: '48GB' })`.
 * Settings are runtime `SET`s, so calling it on an already-open database updates it.
*/
export async function configureDuckDatabase(
    options: DuckDatabaseOptions = {}
): Promise<void> {
    const { database, ...settings } = options;
    const existing = contexts.get(database ?? ':memory:');

    if (existing) {
        await (await existing).applySettings(settings);
        return;
    }

    const created = DuckContext.create(database ?? ':memory:', settings);
    contexts.set(database ?? ':memory:', created);
    await created;
}

/**
 * Registers a scalar function so SQL can call a real data-mate primitive.
 *
 * This is the ONLY way to run the 205 QPL functions inside a query: they are JavaScript, and
 * reimplementing their semantics in SQL is what produced 11 divergences last time (DuckDB's
 * own casts differ from the DataType config on 26 of 40 probed inputs). A UDF over the real
 * primitive is parity by construction, the same argument that makes `fromRecords` use
 * `coerceToType`.
 *
 * Registration is instance-wide, so the function is available to every frame and every
 * stream on that database.
*/
export async function registerScalarFunction(
    spec: ScalarFunctionSpec & { database?: string }
): Promise<string> {
    const { database, ...fnSpec } = spec;
    (await getContext(database)).registerFunction(fnSpec);
    return fnSpec.name;
}

/**
 * Closes a cached database and forgets it. For test teardown; a process that simply exits
 * does not need to call it.
*/
export async function closeDuckDatabase(database = ':memory:'): Promise<void> {
    const context = contexts.get(database);
    if (!context) return;
    contexts.delete(database);
    (await context).disconnect();
}

/** Where a frame's rows come from. */
type Source
    = | { kind: 'table'; table: string }
        /**
         * `ordered` means this relation's rows come out in a defined order - it ends in an
         * `ORDER BY`, or derives from one through an operator that preserves it. It exists so
         * `join` and an aggregating `select` can refuse to discard that ordering silently;
         * see `orderBy`. A table is never ordered: row order in a table is not a property
         * anything may rely on.
        */
        | { kind: 'relation'; sql: string; ordered?: boolean };

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
    /**
     * Database path. Defaults to the process-wide `:memory:` database.
     *
     * There is one database per process, so this exists for a file-backed database and for
     * giving a test an isolated catalogue - NOT for callers to route frames around. Frames
     * from different databases cannot see each other's tables and so cannot be joined.
     *
     * **Only the exact string `:memory:` is in-memory.** Anything else is a FILE PATH -
     * measured: both a bare `'my-test'` AND the `:memory:<name>` form each wrote a database
     * file into the working directory. Tests do not need this option at all: jest gives every
     * test file its own module registry, so each already gets its own default context.
    */
    database?: string;
    /** Used for the table or relation name. */
    name?: string;
}

export interface FromRecordsOptions extends FrameOptions {
    /** Defaults to `strict`. */
    mode?: CoercionMode;
}

/** Everything an append failure can say about itself. */
export interface AppendFailure {
    /** The table the rows were going into. */
    table: string;
    /** Which shape was being appended. */
    source: 'records' | 'parquet';
    /** What was being added, in words: `3 records`, or the paths. */
    describedSource: string;
    /**
     * Rows in the table AFTER the failed append - i.e. what survived. Counted on the failure
     * path only, so a successful append pays nothing for it. Undefined if even that count
     * failed, which means the table itself is in doubt.
    */
    rowsRemaining?: number;
}

/**
 * An `append` that did not happen.
 *
 * The whole point is to say **what survived**: an append runs in a transaction, so a failure
 * leaves the table exactly as it was, and a worker assembling one table from many payloads
 * needs to know that its earlier payloads are intact. The underlying error is kept as `cause`.
 *
 * `fromRecords` deliberately does NOT wrap in this - it is one-shot, so there is no prior table
 * to reassure anyone about, and its contract is to throw what `DataFrame` throws.
*/
export class AppendError extends Error {
    constructor(readonly failure: AppendFailure, cause: unknown) {
        const reason = cause instanceof Error ? cause.message : String(cause);
        const survived = failure.rowsRemaining == null
            ? 'the table could not be counted afterwards, so its contents are in doubt'
            : `the table is unchanged and still has ${failure.rowsRemaining} row(s)`;

        super(
            `appending ${failure.describedSource} to table "${failure.table}" failed`
            + ` - it was rolled back, so ${survived}. Cause: ${reason}`,
            { cause }
        );
        this.name = 'AppendError';
    }
}

/** A frame's own account of itself, for investigating one you were handed. */
export interface FrameInfo {
    /** The backing table's name. Absent for a relation, which has no table. */
    name?: string;
    kind: 'table' | 'relation';
    isMaterialized: boolean;
    /** True when the rows come out in a defined order - see `orderBy`. */
    isOrdered: boolean;
    /** Which database it lives in; frames in different databases cannot see each other. */
    database: string;
    columns: readonly string[];
    /** Row count. This runs `count(*)`, which is why `info()` is async. */
    rows: number;
    /** The SQL this frame resolves to in a FROM clause - a relation's real identity. */
    sql: string;
    /** Ingest bookkeeping: successful appends, and the rows they added. */
    appends: { count: number; rows: number };
}

/**
 * What to add to a frame. Records on the api-server, Parquet on the worker - two shapes of the
 * same act, which is why `append` is one method and not two.
*/
export type AppendSource
    /** Parsed JS objects, as an Elasticsearch response yields them. Coerced on the way in. */
    = | { records: readonly Record<string, unknown>[]; parquet?: never }
    /** One path, a list of paths, or a glob. Already typed and validated, so not re-coerced. */
        | { parquet: string | readonly string[]; records?: never };

export interface AppendOptions {
    /** Defaults to `strict`. Applies to records; Parquet is not coerced. */
    mode?: CoercionMode;
}

/**
 * Turns a value read out of DuckDB into the plain JS shape the response path expects.
 *
 * `rows()` is the OUTPUT path - the QPL engine hands these records straight to the response -
 * so anything DuckDB-shaped leaking through would reach users. Found by the FieldType sweep in
 * `type-sweep-spec.ts`; nothing had covered arrays, structs or dates through `rows()` before,
 * because the older specs read them via `query()` with explicit casts, which bypasses all of
 * this. Three separate leaks:
 *
 * - **LIST** -> `DuckDBListValue`, not an array. Would serialize as `{"items":[...]}`.
 * - **TIMESTAMP** -> `DuckDBTimestampValue`, not a date. Rendered via `toISO8601`, which is
 *   what `DateVector.toJSONCompatibleValue` uses, so the two frames agree.
 * - **BIGINT / HUGEINT** -> a JS `bigint`, and **`JSON.stringify` THROWS on bigint**
 *   ("Do not know how to serialize a BigInt"), so every Integer or Long column broke the
 *   response. Converted with `bigIntToJSON` - the same helper `DataFrame`'s own JSON paths use
 *   (`data-frame/metadata-utils.ts`, `function-configs/json/toJSON.ts`), giving a number when
 *   it fits and a string above `MAX_SAFE_INTEGER`.
 *
 * NOTE `bigIntToJSON` carries the documented `Long`-loses-1 defect above `MAX_SAFE_INTEGER`.
 * Reproducing it here is deliberate: matching `DataFrame` is the contract, and that defect is
 * on the shelved list to be recorded as a known divergence rather than silently fixed on one
 * side only.
*/
function toPlainValue(value: unknown): unknown {
    if (value == null) return value;

    if (typeof value === 'bigint') return bigIntToJSON(value);

    if (typeof value !== 'object') return value;

    if (value instanceof DuckDBTimestampValue) {
        return toISO8601(Number(value.micros / 1000n));
    }

    const items = (value as { items?: unknown }).items;
    if (Array.isArray(items)) return items.map(toPlainValue);

    const entries = (value as { entries?: unknown }).entries;
    if (entries != null && typeof entries === 'object') {
        return Object.fromEntries(
            Object.entries(entries as Record<string, unknown>)
                .map(([key, val]) => [key, toPlainValue(val)])
        );
    }

    return value;
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

/** How to join two frames. Expressions are raw SQL written against the two aliases. */
export interface JoinOptions {
    /** Join predicate, e.g. `'a.user_id = b.id'`. */
    on: string;
    /** Output expressions, `{ outputName: sqlExpression }`, same shape as `select`. */
    select: Readonly<Record<string, string>>;
    /** The result's declared field types. The caller knows what its expressions produce. */
    config: DataTypeConfig | ReadonlyDataTypeConfig;
    /** Defaults to `inner`. */
    type?: 'inner' | 'left' | 'right' | 'full' | 'cross';
    /** Alias for this frame. Defaults to `a`. */
    as?: string;
    /** Alias for the other frame. Defaults to `b`. */
    otherAs?: string;
    /** Group the joined rows, so join-then-aggregate is a single statement. */
    groupBy?: readonly string[];
}

/**
 * `read_parquet(...)` over one path or many.
 *
 * A LIST of files reads as ONE relation - verified - which is what the worker needs: a search
 * result arrives as several Parquet payloads and has to become one table.
*/
function readParquetSource(paths: string | readonly string[]): string {
    if (typeof paths === 'string') return `read_parquet(${quoteLiteral(paths)})`;
    if (paths.length === 0) {
        throw new TypeError('at least one Parquet path is required');
    }
    return `read_parquet([${paths.map(quoteLiteral).join(', ')}])`;
}

/** `GROUP BY` clause for a list of raw SQL grouping expressions, or nothing. */
function groupByClause(groupBy?: readonly string[]): string {
    if (!groupBy?.length) return '';
    return ` GROUP BY ${groupBy.join(', ')}`;
}

/**
 * One `ORDER BY` term. The expression is raw SQL, exactly like `groupBy`'s, so
 * `date_trunc('day', created)` is a valid sort key.
 *
 * A bare string is the common case and supplies the EXPRESSION ONLY - direction and null
 * placement are always emitted by us (see `orderByClause`), so writing `'bytes DESC'` as a
 * string produces invalid SQL rather than a quietly different sort. Use the object form.
*/
export interface OrderBySpec {
    /** Raw SQL - a column name, or any expression. Not a direction; use `direction`. */
    expression: string;
    /** Defaults to `asc`. */
    direction?: 'asc' | 'desc';
    /**
     * Defaults to **`DataFrame`'s rule, not DuckDB's** - `first` ascending, `last`
     * descending. See `orderByClause`.
    */
    nulls?: 'first' | 'last';
}

const DIRECTIONS = new Set(['asc', 'desc']);
const NULL_ORDERS = new Set(['first', 'last']);

/**
 * `ORDER BY` clause for a list of sort terms, or nothing.
 *
 * **Null placement follows `DataFrame`, not DuckDB.** `Vector.compare` sorts a nil as the
 * SMALLEST value - nulls FIRST ascending, LAST descending - while DuckDB's
 * `default_null_order` is `NULLS_LAST` for BOTH directions (both verified). Since QPL's
 * `TableOrderByNode` carries only field names and no null control, an ascending sort would
 * silently move every null from one end of the page to the other. So direction and null
 * placement are ALWAYS emitted explicitly here; nothing is left to a DuckDB default.
 *
 * That is also why a bare string supplies the expression only: appending our keywords to a
 * caller's `'bytes DESC'` yields a parser error, which is loud, rather than a sort that
 * disagrees with the object form.
 *
 * `direction` and `nulls` are checked against a fixed set rather than interpolated. Every
 * other expression here is deliberately raw SQL, but these two are keywords with exactly two
 * legal values each, and a caller arriving from plain JS has no types to stop it.
*/
function orderByClause(specs: readonly (string | OrderBySpec)[]): string {
    if (!specs.length) return '';

    const terms = specs.map((spec) => {
        const { expression, direction = 'asc', nulls } = typeof spec === 'string'
            ? { expression: spec, nulls: undefined } as OrderBySpec
            : spec;

        if (!expression) {
            throw new TypeError('orderBy requires an expression for every sort term');
        }
        if (!DIRECTIONS.has(direction)) {
            throw new TypeError(
                `orderBy direction must be 'asc' or 'desc', received ${direction}`
            );
        }
        if (nulls != null && !NULL_ORDERS.has(nulls)) {
            throw new TypeError(`orderBy nulls must be 'first' or 'last', received ${nulls}`);
        }

        // A nil is the smallest value, which is DataFrame's rule.
        const nullOrder = nulls ?? (direction === 'asc' ? 'first' : 'last');

        return `${expression} ${direction.toUpperCase()} NULLS ${nullOrder.toUpperCase()}`;
    });

    return ` ORDER BY ${terms.join(', ')}`;
}

/**
 * One of `LIMIT` / `OFFSET`, or nothing.
 *
 * The value is interpolated, so it is checked first: a non-negative safe integer is the only
 * thing that can appear in the SQL. `LIMIT 0` is legal and means no rows.
*/
function limitBound(keyword: 'LIMIT' | 'OFFSET', name: 'count' | 'offset', value?: number): string {
    if (value == null) return '';
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new TypeError(
            `limit's ${name} must be a non-negative integer, received ${value}`
        );
    }
    return ` ${keyword} ${value}`;
}

interface CreatedTable {
    table: string;
    columns: string[];
}

/**
 * Creates the table for a config, and reports the column set it declared.
 *
 * Shared by `fromRecords` (which then appends records) and `empty` (which is then filled by
 * `appendParquet`), so one DDL path serves both ingest tiers.
*/
async function createTable(
    context: DuckContext,
    config: DataTypeConfig | ReadonlyDataTypeConfig,
    name?: string
): Promise<CreatedTable> {
    const plan = buildPlan(config);
    if (plan.length === 0) {
        throw new TypeError('A DataType config must declare at least one field');
    }

    const table = nextTableName(name);
    const columnTypes = new DataType(config as DataTypeConfig).toDuckDB();
    const ddl = plan
        .map(({ name: column }) => `${quoteIdentifier(column)} ${columnTypes[column]}`)
        .join(', ');

    await context.run(`CREATE OR REPLACE TABLE ${quoteIdentifier(table)} (${ddl})`);

    return { table, columns: plan.map(({ name: column }) => column) };
}

/** Names what was being appended, for an error message. */
function describeSource(source: AppendSource): string {
    if (source.records !== undefined) return `${source.records.length} record(s)`;
    const { parquet } = source;
    if (typeof parquet === 'string') return `Parquet "${parquet}"`;
    return `${parquet.length} Parquet path(s)`;
}

export class DuckFrame {
    private constructor(
        private readonly ctx: DuckContext,
        readonly config: DataTypeConfig | ReadonlyDataTypeConfig,
        /**
         * NOT readonly: `append` may promote a relation to a table, because a frame is a
         * HANDLE to the data it represents and is in charge of its own storage. Every other
         * operation still returns a NEW frame and leaves this one alone.
        */
        private source: Source,
        readonly columns: readonly string[]
    ) {}

    /** Successful appends, and the rows they added. Reported by `info()`. */
    private appendCount = 0;
    private appendedRows = 0;

    /** In-flight relation->table promotion, so concurrent appends share one. */
    private promotion?: Promise<void>;

    /** True when the rows are in a real table rather than recomputed per reference. */
    get isMaterialized(): boolean {
        return this.source.kind === 'table';
    }

    /**
     * True when this frame's rows come out in a defined order.
     *
     * Set by `orderBy` and carried through the operators that preserve order. Read by
     * `assertOrderSafe`, which is the whole reason it is tracked.
    */
    get isOrdered(): boolean {
        return this.source.kind === 'relation' && this.source.ordered === true;
    }

    /**
     * Refuses an operation that would silently discard an ordering.
     *
     * **Measured at 5M rows / 14 threads** (`docs/tools/probe/order-preservation.mjs`), counting
     * out-of-order rows in the streamed output of a subquery that ends in `ORDER BY x`:
     *
     * | outer operator | out of order |
     * |---|---|
     * | projection, `WHERE`, `LIMIT`, `OFFSET` | **0** - order preserved |
     * | `JOIN` | 303 |
     * | `GROUP BY` | 2,104 |
     *
     * SQL promises nothing about a subquery's `ORDER BY`, and DuckDB's hash join and hash
     * aggregate both reorder. **The same two queries come out perfectly ordered at 20 rows**,
     * so this is a bug that appears only once the data is large enough to be parallelised -
     * exactly the kind that reaches production. Hence a throw rather than a silent drop.
     *
     * Sorting last is the real shape anyway: QPL emits `orderBy` as a POST-aggregate node.
     *
     * **What this cannot catch:** a global aggregate written into `select`'s expressions with
     * no `groupBy` (`{ total: 'sum(x)' }`) also reorders, but the expressions are raw SQL, so
     * there is nothing to inspect. Its result is one row, which makes the ordering moot.
    */
    private assertOrderSafe(operation: string, other?: DuckFrame): void {
        if (!this.isOrdered && other?.isOrdered !== true) return;

        throw new TypeError(
            `${operation} reorders rows, so this frame's ORDER BY would be silently discarded`
            + ' - measured: a subquery ORDER BY survives a projection or a filter, but comes'
            + ' out of a join or a GROUP BY scrambled, and only once the data is big enough to'
            + ' be parallelised. Sort the RESULT instead.'
        );
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

    /**
     * Runs SQL against this frame's database and returns raw rows.
     *
     * For data-mate's own tooling (schema checks) and tests, which need to assert on the
     * STORAGE representation - `total::VARCHAR`, `loc.lat`, `DESCRIBE` - that `rows()`
     * cannot express. Deliberately narrow: it hands out neither the connection nor the
     * instance, so it cannot be used to route frames between databases, which is what the
     * removed `get context()` allowed.
     *
     * **Values are JSON-rendered, not native:** a BIGINT comes back as the string `'2'`, not
     * `2n`. `rows()` is the path that yields native values. That difference is why this is
     * for tooling and assertions rather than for reading data.
    */
    query(sql: string): Promise<unknown[][]> {
        return this.ctx.rows(sql);
    }

    /** The backing table name, when this frame is materialized. */
    get table(): string | undefined {
        return this.source.kind === 'table' ? this.source.table : undefined;
    }

    /**
     * A new frame. It owns a table and starts empty - **the normal way to make one.**
     *
     * There is no separate "empty" factory, because a new frame IS empty; `fromRecords` and
     * `fromParquet` are just this plus one `append`.
    */
    static async create(
        config: DataTypeConfig | ReadonlyDataTypeConfig,
        options: FrameOptions = {}
    ): Promise<DuckFrame> {
        const context = await getContext(options.database);
        const { table, columns } = await createTable(context, config, options.name);
        return new DuckFrame(context, config, { kind: 'table', table }, columns);
    }

    /**
     * **Adds data to this frame. One method, whatever the source.** Returns the rows added.
     *
     * Records and Parquet are two shapes of the same act, so they are not two methods:
     * `append({ records })` on the api-server, where an Elasticsearch response is parsed JS
     * objects, and `append({ parquet })` on the worker, where each fetch returns a payload and
     * the whole search result is one table.
     *
     * **The frame is in charge of its own storage.** If it is a relation, appending promotes it
     * to a table first - a caller should not have to know which it is holding, or call
     * `materialize()` to earn the right to add data. That promotion mutates THIS frame; frames
     * already derived from it keep the SQL they captured and are unaffected.
     *
     * **Atomic.** The append runs in a transaction, so a batch that fails leaves the table
     * exactly as it was rather than half-written - verified: a rolled-back appender's flushed
     * rows do disappear. That matters when a table is assembled from many payloads, since a bad
     * one must not corrupt the good ones already in it.
     *
     * **The one place a frame's table legitimately grows.** The rule against mutating a table
     * holds everywhere else: relations read it by name, so appending after something derives
     * from this frame would silently change that derived frame too. Append while assembling,
     * derive afterwards.
    */
    async append(source: AppendSource, options: AppendOptions = {}): Promise<number> {
        await this.ensureTable();
        const table = this.source.kind === 'table' ? this.source.table : '';

        // ITS OWN CONNECTION, and this is a correctness requirement, not tuning. A DuckDB
        // transaction belongs to a CONNECTION, and the shared one is shared process-wide -
        // so on it, a second concurrent append's `BEGIN` throws `cannot start a transaction
        // within a transaction`, its `ROLLBACK` then discards the FIRST append's rows, and
        // every later statement on that connection fails with `Current transaction is
        // aborted`. All three measured. Concurrent fetchers appending to one frame is the
        // normal case, so each append is isolated.
        //
        // Concurrency is then genuinely safe AND fast, measured: 10 concurrent appends into
        // the SAME table from 10 connections all succeeded, no write conflict, 500k rows in
        // 25 ms. DuckDB's MVCC handles append-vs-append; there are no row conflicts to lose.
        const connection = await this.ctx.instance.connect();

        try {
            await connection.run('BEGIN TRANSACTION');
            try {
                const added = source.records === undefined
                    ? await this.appendParquet(connection, table, source.parquet)
                    : await this.appendRecords(connection, table, source.records, options);

                await connection.run('COMMIT');
                this.appendCount += 1;
                this.appendedRows += added;
                return added;
            } catch (err) {
                await connection.run('ROLLBACK');

                throw new AppendError({
                    table,
                    source: source.records === undefined ? 'parquet' : 'records',
                    describedSource: describeSource(source),
                    // counted AFTER the rollback, so it reports what actually survived - and
                    // only here, so a successful append never pays for it
                    rowsRemaining: await this.countQuietly(connection, table),
                }, err);
            }
        } finally {
            connection.disconnectSync();
        }
    }

    /** Row count that never throws: used while reporting a failure, where throwing again
     * would replace the real error with a worse one. */
    private async countQuietly(
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
     * **What this frame is and what state it is in.** For investigating a frame you were
     * handed: which table (or relation SQL) it is responsible for, where it lives, how big it
     * is, and what has been appended to it.
     *
     * For the STORAGE types DuckDB actually gave each column, use `describeColumns(frame)` /
     * `diffSchema(frame)` in `schema-check.ts` - that is a different question, and it is
     * answered against DuckDB rather than against the declared config.
    */
    async info(): Promise<FrameInfo> {
        return {
            ...(this.source.kind === 'table' ? { name: this.source.table } : {}),
            kind: this.source.kind,
            isMaterialized: this.isMaterialized,
            isOrdered: this.isOrdered,
            database: this.ctx.path,
            columns: this.columns,
            rows: await this.size(),
            sql: this.from,
            appends: { count: this.appendCount, rows: this.appendedRows },
        };
    }

    /**
     * Promotes a relation to a table in place, so this frame has storage to append to.
     *
     * Memoised, because concurrent appends race here: without it, two appends to a
     * relation-backed frame would each create their own table, one would be orphaned, and the
     * rows would split between them.
    */
    private async ensureTable(): Promise<void> {
        if (this.source.kind === 'table') return;
        this.promotion ??= this.promoteToTable();
        await this.promotion;
    }

    private async promoteToTable(): Promise<void> {
        const table = nextTableName('appendable');
        await this.ctx.run(
            `CREATE OR REPLACE TABLE ${quoteIdentifier(table)} AS SELECT * FROM ${this.from}`
        );
        this.source = { kind: 'table', table };
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
    private async appendParquet(
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
    private async appendRecords(
        connection: DuckDBConnection,
        table: string,
        records: readonly Record<string, unknown>[],
        options: AppendOptions
    ): Promise<number> {
        const plan = buildPlan(this.config);
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
        const frame = await DuckFrame.create(config, options);

        try {
            await frame.append({ records }, { mode: options.mode });
        } catch (err) {
            // A failed ingest must leave NOTHING behind. The table is created before the
            // append, so throwing used to orphan a table no caller could reach - no frame was
            // returned, so nobody could `destroy()` it. `DataFrame.fromJSON` leaves no artifact.
            // `append` on its own does NOT do this: there the caller holds the frame, and
            // dropping a table assembled from earlier payloads would be far worse.
            await frame.destroy();

            // Unwrapped: this is one-shot, so `AppendError`'s "what survived" context is
            // meaningless (nothing did), and the contract here is to throw what `DataFrame`
            // throws - a `CoercionFailureError`.
            throw err instanceof AppendError ? err.cause : err;
        }

        return frame;
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
        path: string | readonly string[],
        options: FrameOptions = {}
    ): Promise<DuckFrame> {
        const context = await getContext(options.database);
        // relation-backed: a Parquet file is already a queryable source, so nothing is
        // copied until something asks for the rows. A LIST of paths, or a glob in one path,
        // reads as ONE relation - `materialize()` then makes it one table.
        const sql = `SELECT * FROM ${readParquetSource(path)}`;
        return new DuckFrame(
            context,
            config,
            { kind: 'relation', sql },
            Object.keys(new DataType(config as DataTypeConfig).toDuckDB())
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
        config: DataTypeConfig | ReadonlyDataTypeConfig = this.config,
        groupBy?: readonly string[]
    ): DuckFrame {
        const names = Object.keys(expressions);
        if (names.length === 0) {
            throw new TypeError('select requires at least one expression');
        }
        const list = names
            .map((name) => `${expressions[name]} AS ${quoteIdentifier(name)}`)
            .join(', ');

        if (groupBy?.length) this.assertOrderSafe('select with groupBy');

        const sql = `SELECT ${list} FROM ${this.from}${groupByClause(groupBy)}`;

        return new DuckFrame(
            this.ctx, config, { kind: 'relation', sql, ordered: this.isOrdered }, names
        );
    }

    /**
     * Join another frame. Returns a relation, like every other operation.
     *
     * There is nothing special here - a join is `FROM <a> JOIN <b> ON <pred>`, and `from`
     * already yields either a table name or a parenthesised subquery, so either side may be
     * a table or a relation. This method exists to gather the two sides' SQL, alias them, and
     * declare the result config; it is a SQL builder, not a new execution concept.
     *
     * Both sides are aliased (`a` and `b` by default) because two frames routinely share
     * column names, and a subquery in a FROM clause needs a name to be referenced by. Write
     * `on` and `select` in terms of those aliases.
     *
     * `groupBy` is here too, so "join then aggregate" is one statement rather than two - that
     * is where per-parent counts and picks land.
    */
    join(other: DuckFrame, options: JoinOptions): DuckFrame {
        if (other.ctx !== this.ctx) {
            throw new TypeError(
                'join requires both frames to be in the same database:'
                + ' they are in different databases, so neither can see the other\'s tables'
            );
        }

        this.assertOrderSafe('join', other);

        const names = Object.keys(options.select);
        if (names.length === 0) {
            throw new TypeError('join requires at least one expression to select');
        }

        const as = options.as ?? 'a';
        const otherAs = options.otherAs ?? 'b';
        const type = (options.type ?? 'inner').toUpperCase();

        const list = names
            .map((name) => `${options.select[name]} AS ${quoteIdentifier(name)}`)
            .join(', ');

        const sql = `SELECT ${list}`
            + ` FROM ${this.from} AS ${quoteIdentifier(as)}`
            + ` ${type} JOIN ${other.from} AS ${quoteIdentifier(otherAs)}`
            + ` ON ${options.on}`
            + groupByClause(options.groupBy);

        return new DuckFrame(this.ctx, options.config, { kind: 'relation', sql }, names);
    }

    /**
     * Row filter. Returns a new relation-backed frame.
     *
     * A filter preserves ordering (measured: 0 of 1.6M rows out of order), so a sorted frame
     * stays sorted through it.
    */
    filter(predicate: string): DuckFrame {
        return new DuckFrame(
            this.ctx,
            this.config,
            {
                kind: 'relation',
                sql: `SELECT * FROM ${this.from} WHERE ${predicate}`,
                ordered: this.isOrdered,
            },
            this.columns
        );
    }

    /**
     * `SELECT DISTINCT` over every column - QPL's `DEDUP`.
     *
     * **Takes no field list, because that IS the whole behaviour.** `TableDedupNode` carries no
     * fields at all and the old engine calls `frame.unique(scope.frame.fields)` - every field.
     * A `DISTINCT ON` / key-subset variant is deliberately not added on spec.
     *
     * Verified: DISTINCT works over LIST and STRUCT columns (arrays and objects are ordinary in
     * these configs, and a naive dedup could have failed on them), and it treats NULLs as
     * EQUAL, so rows null in the same column collapse into one.
     *
     * **It reorders rows** - measured, 373 of 1M out of order over an ordered subquery - so it
     * is refused on an ordered frame and its own result is not ordered. Dedup first, sort after.
    */
    distinct(): DuckFrame {
        this.assertOrderSafe('distinct');

        return new DuckFrame(
            this.ctx,
            this.config,
            { kind: 'relation', sql: `SELECT DISTINCT * FROM ${this.from}` },
            this.columns
        );
    }

    /**
     * `ORDER BY`. Returns a new relation-backed frame, like every other operation.
     *
     * **Sorting is a relation, not trailing state on the frame**, because DuckDB's optimiser
     * FLATTENS the subquery: `SELECT * FROM (SELECT * FROM t ORDER BY x) LIMIT 10` and
     * `SELECT * FROM t ORDER BY x LIMIT 10` produce the IDENTICAL physical plan - one `TOP_N`
     * with a dynamic filter pushed into the scan. Measured at 5M rows: 1-5 ms either way,
     * against 754 ms for the same sort with no limit. So the nesting costs nothing, and the
     * composition semantics come from SQL for free:
     *
     * | chain | means |
     * |---|---|
     * | `.orderBy(x).limit(10)` | the top 10 by x |
     * | `.limit(10).orderBy(x)` | an arbitrary 10, sorted |
     * | `.orderBy(x).filter(p).limit(10)` | the top 10 of the matching rows |
     * | `.orderBy(x).limit(10).filter(p)` | the top 10, then filtered - may yield fewer |
     *
     * Each is what a caller writing those calls in that order asked for.
     *
     * `select`, `filter` and `limit` may follow a sort. **`join` and an aggregating `select`
     * may not** - they reorder rows, so they throw instead of discarding the ordering; see
     * `assertOrderSafe`. `materialize()` also does not carry it, because a table has no
     * ordering to carry.
     *
     * **Nulls follow `DataFrame`, not DuckDB** - first ascending, last descending. See
     * `orderByClause`.
     *
     * **A TIE-HEAVY SORT IS NOT DETERMINISTIC, AND PAGING OVER ONE LOSES ROWS.** Measured
     * (`docs/tools/probe/tie-stability.mjs`, 2M rows / 14 threads, 20 distinct sort values):
     * the same `ORDER BY bucket LIMIT 10` returned **2 different pages** across 20 runs, and
     * across 10 runs `LIMIT 1000` yielded 4,410 distinct ids where 1,000 were expected while
     * **1,305 rows appeared in BOTH page 1 and page 2**. Appending a unique tiebreaker
     * (`ORDER BY bucket, id`) collapsed it to exactly one result over 20 runs.
     *
     * `DataFrame` does not have this problem: its sort is `Array#sort`, which is stable, so
     * ties keep their input order. **A caller that pages MUST append a unique field to
     * `specs`.** This cannot add one, because it cannot know which field is unique.
    */
    orderBy(specs: readonly (string | OrderBySpec)[]): DuckFrame {
        if (specs.length === 0) {
            throw new TypeError('orderBy requires at least one sort term');
        }

        return new DuckFrame(
            this.ctx,
            this.config,
            {
                kind: 'relation',
                sql: `SELECT * FROM ${this.from}${orderByClause(specs)}`,
                ordered: true,
            },
            this.columns
        );
    }

    /**
     * `LIMIT` / `OFFSET`. Returns a new relation-backed frame.
     *
     * Either bound may stand alone - `OFFSET` with no `LIMIT` is valid in DuckDB (verified),
     * which is what an unbounded page from a start position needs. With both absent this
     * returns the frame unchanged, so a plan's optional `size`/`start` can be passed straight
     * through without a conditional.
     *
     * **Push the limit into SQL; never emulate it by breaking out of `rows()`.** Measured:
     * an unsorted `LIMIT` plans as `STREAMING_LIMIT`, so the pipeline stops pulling as soon as
     * it is satisfied (5M-row scan: 1 ms to the first chunk against 68 ms to drain). A sorted
     * one plans as `TOP_N`, which cannot exit early - the top ten are unknown until every row
     * is seen - but holds a heap of `count` rather than the whole sort, and plants a dynamic
     * filter in the scan so later row groups are skipped by their zone maps. Breaking out of
     * `rows()` stops only the JS consumer and earns neither.
     *
     * A limit preserves ordering (measured: 0 of 1M rows out of order), so a sorted frame
     * stays sorted through it.
     *
     * **`size()` on a limited frame counts the PAGE, not the total.** A response envelope that
     * needs the total must call `size()` on the frame from BEFORE the limit was applied.
    */
    limit(count?: number, offset?: number): DuckFrame {
        if (count == null && offset == null) return this;

        const bounds = limitBound('LIMIT', 'count', count)
            + limitBound('OFFSET', 'offset', offset);

        return new DuckFrame(
            this.ctx,
            this.config,
            {
                kind: 'relation',
                sql: `SELECT * FROM ${this.from}${bounds}`,
                ordered: this.isOrdered,
            },
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
            `COPY (SELECT * FROM ${this.from}) TO ${quoteLiteral(path)}`
            + ' (FORMAT parquet, COMPRESSION zstd)'
        );
    }

    /**
     * Writes the frame as **ldjson**, one JSON object per line - the format a finished result
     * goes to S3 as.
     *
     * **DuckDB writes it, not JavaScript.** The rows never become JS objects, so this is not
     * bounded by single-threaded value conversion the way `rows()` is.
     *
     * **The output is byte-identical to `DataFrame`'s**, because the projection corrects the
     * three things DuckDB renders differently - ISO8601 dates, big integers as strings past
     * `MAX_SAFE_INTEGER`, and omitted null keys. See `export-json.ts`; the parity is pinned by
     * `test/duck-frame/export-json-spec.ts` against `DataFrame.toJSON` itself.
     *
     * `removeNullFields` defaults to **true**, matching spaces' own default; `@preserveNullFields`
     * is what turns it off.
     *
     * Whole-file: it does not return until the file is complete. Use `ndjson()` when the result
     * is too large to want that, or when it should be uploaded as it is produced.
    */
    async writeNDJSON(path: string, options: JsonExportOptions = {}): Promise<void> {
        const expression = buildJsonExpression(this.config, options);
        await this.ctx.run(
            `COPY (SELECT ${expression} AS json FROM ${this.from}) TO ${quoteLiteral(path)}`
            + ' (FORMAT CSV, HEADER false, QUOTE \'\', ESCAPE \'\', DELIMITER \'\u0007\')'
        );
    }

    /**
     * The same ldjson, **streamed** - one line at a time, as DuckDB produces them.
     *
     * Each line is rendered to a string in C++; JavaScript only concatenates bytes, so this
     * keeps almost all of `writeNDJSON`'s advantage while letting a caller flush to S3 as it
     * goes and never hold the whole result. That is the trade the worker needs when a table is
     * already most of its memory.
     *
     * Byte-identical to `writeNDJSON` - both are the same projection.
    */
    ndjson(options: JsonExportOptions = {}): AsyncIterableIterator<string> {
        const expression = buildJsonExpression(this.config, options);
        return this.ctx.streamColumnStrings(
            `SELECT ${expression} AS json FROM ${this.from}`
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
