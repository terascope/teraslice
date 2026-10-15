import { DataTypeConfig, ReadonlyDataTypeConfig } from '@terascope/types';
import { ValueConverter } from './duck-values.js';

/**
 * Option and result types for TealFrame and its database.
*/

/** A DataType configuration, however the caller happens to hold it. */
export type FrameConfig = DataTypeConfig | ReadonlyDataTypeConfig;

/** One field's coercion and its DuckDB value conversion, resolved once per append. */
export interface FieldPlan {
    name: string;
    fieldType: string;
    coerce: (value: unknown) => unknown;
    convert: ValueConverter;
}

/** A freshly created table and the column set its config declared. */
export interface CreatedTable {
    table: string;
    columns: string[];
}

/** Spill and resource settings for a database. All are runtime `SET`s. */
export interface DuckDatabaseSettings {
    /**
     * Directory DuckDB spills to when a query exceeds `memoryLimit`. Without it, a query over
     * the limit fails instead of spilling to disk.
    */
    tempDirectory?: string;
    /** Cap on the spill directory, e.g. `'30GB'`. */
    maxTempDirectorySize?: string;
    /** DuckDB's memory limit, e.g. `'48GB'`. Set it below the container's memory cap. */
    memoryLimit?: string;
    threads?: number;
    /**
     * Where DuckDB looks for extensions. Defaults to `DUCKDB_EXTENSION_DIRECTORY`, then
     * DuckDB's own `~/.duckdb/extensions`. It cannot be changed once the database is open,
     * which is why the environment variable is the usual way to set it (see `extensions.ts`).
    */
    extensionDirectory?: string;
    /**
     * Whether a missing extension may be downloaded. Defaults to
     * `DUCKDB_AUTOINSTALL_EXTENSIONS`, then true. A container image with bundled extensions
     * sets it to false.
    */
    autoinstallExtensions?: boolean;
}

export interface DuckDatabaseOptions extends DuckDatabaseSettings {
    /** A file path, or `:memory:`. See `FrameOptions.database` for how the string is read. */
    database?: string;
}

/** Where a frame's rows come from. */
export type Source
    = | { kind: 'table'; table: string }
        /**
         * `ordered` means the relation's rows come out in a defined order: it ends in an
         * `ORDER BY`, or derives from one through an operator that preserves order. `join` and
         * an aggregating `select` use it to refuse to discard that order silently; see
         * `orderBy`. A table is never ordered, because nothing may rely on a table's row order.
        */
        | { kind: 'relation'; sql: string; ordered?: boolean };

/** One field's coercion failure, with the value that caused it. */
export interface CoercionFailure {
    field: string;
    fieldType: string;
    failedCount: number;
    /** An original value that failed to convert. */
    exampleValue: string;
}

export type CoercionMode
    /** For ingest: a value that fails to convert is an error, and is raised. */
    = | 'strict'
    /** For transforms: a value that fails to convert becomes null. */
        | 'lenient';

export interface FrameOptions {
    /**
     * Database path. Defaults to the process-wide `:memory:` database.
     *
     * Use it for a file-backed database or to give a test an isolated catalog. Frames in
     * different databases cannot see each other's tables, so they cannot be joined.
     *
     * **Only the exact string `:memory:` is in-memory.** Anything else, including a bare name
     * like `'my-test'` or the `:memory:<name>` form, is a file path and writes a database file.
     * Tests rarely need this option: jest gives each test file its own module registry, and
     * so its own default database.
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
     * Rows in the table after the failed append, that is, the rows that survived. Counted only
     * on failure, so a successful append does not pay for it. Undefined if the count itself
     * failed, which means the table's state is unknown.
    */
    rowsRemaining?: number;
}

/**
 * What to add to a frame: parsed records, or Parquet files. Both go through the one `append`
 * method.
*/
export type AppendSource
    /** Parsed JS objects, such as Elasticsearch documents. Coerced on the way in. */
    = | { records: readonly Record<string, unknown>[]; parquet?: never }
    /** One path, a list of paths, or a glob. Already typed and validated, so not re-coerced. */
        | { parquet: string | readonly string[]; records?: never };

export interface AppendOptions {
    /** Defaults to `strict`. Applies to records; Parquet is not coerced. */
    mode?: CoercionMode;
}

/**
 * A `SELECT` list, either as a map or as verbatim SQL.
 *
 * In the map form, `{ outputName: sqlExpression }`, the keys become the output column names.
 * A string is used verbatim, as `QueryAccess.restrictSQLParts` returns it. That string cannot
 * be turned into a map without losing the field restriction: the DuckDB dialect rebuilds a
 * partly readable STRUCT with `struct_pack`, so its expressions and its `columns` do not
 * correspond one to one.
*/
export type SelectList = string | Readonly<Record<string, string>>;

/** Options for {@link TealFrame.select}. */
export interface SelectOptions {
    /** The result's declared field types. Defaults to the frame's own. */
    config?: FrameConfig;
    /** Group the rows, so project-then-aggregate is a single statement. */
    groupBy?: readonly string[];
    /** The result's column names, required when the `SELECT` list is verbatim. */
    columns?: readonly string[];
}

/** How to join two frames. Expressions are raw SQL written against the two aliases. */
export interface JoinOptions {
    /** Join predicate, e.g. `'a.user_id = b.id'`. */
    on: string;
    /**
     * Output expressions, `{ outputName: sqlExpression }`, or a `SELECT` list verbatim.
     *
     * Both sides are aliased, so a verbatim list joining two generated statements reads
     * `'a.*, b."total"'`. The map form is the one to use when the two sides share column
     * names, because a duplicate output name is a column the caller cannot read back.
    */
    select: SelectList;
    /** The result's declared field types. The caller knows what its expressions produce. */
    config: FrameConfig;
    /** The result's column names, required when `select` is a verbatim list. */
    columns?: readonly string[];
    /** Defaults to `inner`. */
    type?: 'inner' | 'left' | 'right' | 'full' | 'cross';
    /** Alias for this frame. Defaults to `a`. */
    as?: string;
    /** Alias for the other frame. Defaults to `b`. */
    otherAs?: string;
    /** Group the joined rows, so join-then-aggregate is a single statement. */
    groupBy?: readonly string[];
}

/** A required extension that could not be loaded, and DuckDB's reason. */
export interface MissingExtension {
    name: string;
    reason: string;
    error: string;
}

/** What `DuckExtensionError` reports: every missing extension, and where it looked. */
export interface ExtensionFailure {
    missing: readonly MissingExtension[];
    version: string;
    platform: string;
    directory: string;
    autoinstall: boolean;
}
