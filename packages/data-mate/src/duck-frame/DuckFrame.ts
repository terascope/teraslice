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
        readonly connection: DuckDBConnection
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
        const context = new DuckContext(instance, await instance.connect());
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
     * (`scratchpad/exit-isolate.mjs`), a process that registers one **never exits** on
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

/** `GROUP BY` clause for a list of raw SQL grouping expressions, or nothing. */
function groupByClause(groupBy?: readonly string[]): string {
    if (!groupBy?.length) return '';
    return ` GROUP BY ${groupBy.join(', ')}`;
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
        const context = await getContext(options.database);
        const plan = buildPlan(config);
        if (plan.length === 0) {
            throw new TypeError('A DataType config must declare at least one field');
        }

        const table = nextTableName(options.name);
        const columnTypes = new DataType(config as DataTypeConfig).toDuckDB();
        const ddl = plan
            .map(({ name }) => `${quoteIdentifier(name)} ${columnTypes[name]}`)
            .join(', ');
        await context.run(`CREATE OR REPLACE TABLE ${quoteIdentifier(table)} (${ddl})`);

        const lenient = (options.mode ?? 'strict') === 'lenient';
        const failures = new Map<string, CoercionFailure>();

        /** Records one failure. In strict mode this throws immediately - see below. */
        const recordFailure = (
            name: string, fieldType: string, value: unknown
        ): null => {
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

            // STRICT FAILS FAST, matching `DataFrame`. Its Builder throws out of `valueFrom`
            // on the first value it cannot convert and nothing catches it, so a bad batch
            // costs one value's work, not the whole batch's. Collecting every failure first
            // gave a richer message for the same outcome, but did a full pass over a doomed
            // ingest to get it. Parity is the contract; lenient mode still collects.
            if (!lenient) {
                throw new CoercionFailureError(
                    `coercion failed for field ${name} (${fieldType}):`
                    + ` ${JSON.stringify(String(value))}`,
                    [...failures.values()]
                );
            }
            return null;
        };

        try {
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
                            return recordFailure(name, fieldType, record[name]);
                        }
                    })
                )) as never[][]);

                appender.appendDataChunk(chunk);
            }

            appender.flushSync();
            appender.closeSync();
        } catch (err) {
            // A failed ingest must leave NOTHING behind. The table is created before the
            // append loop, so throwing out of it used to orphan a fully-populated table that
            // no caller could reach - no frame was returned, so nobody could `destroy()` it.
            // `DataFrame.fromJSON` produces no artifact when it throws.
            await context.run(`DROP TABLE IF EXISTS ${quoteIdentifier(table)}`);
            throw err;
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
        const context = await getContext(options.database);
        // relation-backed: a Parquet file is already a queryable source, so nothing is
        // copied until something asks for the rows
        const sql = `SELECT * FROM read_parquet(${quoteLiteral(path)})`;
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

        const sql = `SELECT ${list} FROM ${this.from}${groupByClause(groupBy)}`;

        return new DuckFrame(this.ctx, config, { kind: 'relation', sql }, names);
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
            `COPY (SELECT * FROM ${this.from}) TO ${quoteLiteral(path)}`
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
