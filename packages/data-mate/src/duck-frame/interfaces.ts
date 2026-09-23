import { DataTypeConfig, ReadonlyDataTypeConfig } from '@terascope/types';
import { ValueConverter } from './duck-values.js';

/**
 * Everything the DuckDB frame is configured or described BY.
 *
 * The frame's own config type is an alias rather than the union written out, because the
 * union appeared in eight signatures and a caller holding a `ReadonlyDataTypeConfig` should
 * not have to discover that it is accepted.
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

/** Where a frame's rows come from. */
export type Source
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
 * A `SELECT` list, in either of the two shapes a caller holds one.
 *
 * A map is what code composing a projection writes, and its keys become the output names. A
 * STRING is the list verbatim - which is what `QueryAccess.restrictSQLParts` hands back, and
 * it cannot be turned into a map without losing the restriction: the DuckDB dialect rebuilds
 * a partly-readable STRUCT with `struct_pack`, so its projection and its `columns` are
 * deliberately not one-to-one.
*/
export type SelectList = string | Readonly<Record<string, string>>;

/** Options for {@link DuckFrame.select}, gathered so the two optional ones are named. */
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
