import { DataTypeConfig, SQLDialectName, SQLSearchParams } from '@terascope/types';
import { DataType } from '@terascope/data-types';
import {
    getSQLDialect, groupByClause, quoteIdentifier,
    quoteLiteral, toSQLSort, wholeNumber, type SQLSortInput
} from '@terascope/sql-builder';
import { appendInTransaction } from './append.js';
import { DuckContext } from './DuckContext.js';
import { getContext } from './database.js';
import { AppendError } from './errors.js';
import { createTable, nextTableName } from './table.js';
import { joinSQL, selectList } from './clauses.js';
import { readParquetSource } from './sources.js';
import { assertOrderSafe } from './order-safety.js';
import { JsonExportOptions, resolveRules } from './export-json.js';
import * as output from './output.js';
import { makeRowShapers } from './row-shape.js';
import { expandValuesSQL, ExpandValuesOptions } from './expand-values.js';
import { deepSelectSQL, emptySkippedObjects } from './deep-select.js';
import { distinctLines, parseLines, writeLines } from './line-stream.js';
import {
    AppendOptions, AppendSource, FrameConfig, FrameOptions,
    FromRecordsOptions, JoinOptions, SelectList, SelectOptions, Source
} from './interfaces.js';

/**
 * The DuckDB dialect, shared with `@terascope/xlucene-translator`.
 *
 * `ORDER BY` and `LIMIT`/`OFFSET` are rendered by the dialect, so a sort built by a frame and
 * a sort in a statement from `QueryAccess.restrictSQLQuery` place nulls the same way.
*/
const dialect = getSQLDialect(SQLDialectName.duckdb);

/**
 * A frame whose rows live in DuckDB.
 *
 * TealFrame has its own API; it does not wrap or replace `DataFrame`. Its methods fall into
 * three groups:
 *
 * 1. **Compose a statement:** `filter`, `select`, `orderBy`, `limit`, `distinct`, `join`,
 *    `deepSelect`, `pruneEmptyObjects`, `expandValues` and `removeEmptyRows`. Each returns a
 *    new frame over one more SQL step. Nothing runs yet.
 * 2. **Run an existing statement:** `query` (instance) and `fromSQL` (static).
 * 3. **Consume:** `rows`, `size`, `ndjson`, `writeNDJSON`, `writeParquet`, `listValues` and
 *    `countEmptyRows`. These execute the statement and produce output.
 *
 * `filter` and `select` are clause builders, not a search API: `filter` is the `WHERE` clause
 * and `select` is the `SELECT` list, just as `orderBy` is the `ORDER BY`. They exist for
 * callers that build a query one step at a time. For example, `tealFrameAdapter` returns an
 * expression for one function on one column, and a chain of transforms becomes a chain of
 * `select` calls that compose into one statement evaluated in a single pass.
 *
 * If you already have a complete statement, such as one from `QueryAccess`, pass it to
 * `query` whole. Rebuilding a restricted statement from `filter` and `select` can drop a
 * field restriction.
*/
export class TealFrame {
    private constructor(
        private readonly ctx: DuckContext,
        readonly config: FrameConfig,
        /**
         * Not readonly: `append` may promote a relation to a table, because a frame manages
         * its own storage. Every other operation returns a new frame and leaves this one
         * unchanged.
        */
        private source: Source,
        readonly columns: readonly string[]
    ) {}

    /** The in-flight promotion of a relation to a table, shared by concurrent appends. */
    private promotion?: Promise<void>;

    /** True when the rows are in a real table rather than recomputed per reference. */
    get isMaterialized(): boolean {
        return this.source.kind === 'table';
    }

    /**
     * True when this frame's rows come out in a defined order.
     *
     * Set by `orderBy` and kept by the operators that preserve order. Operations that would
     * discard the order check it and throw.
    */
    get isOrdered(): boolean {
        return this.source.kind === 'relation' && this.source.ordered === true;
    }

    /** Refuses an operation that would silently discard an ordering - see `order-safety.ts`. */
    private assertOrderSafe(operation: string, other?: TealFrame): void {
        assertOrderSafe(operation, this.isOrdered || other?.isOrdered === true);
    }

    /** A new relation-backed frame over `sql` on the same database. */
    private derive(
        sql: string,
        { config = this.config, columns = this.columns, ordered }: {
            config?: FrameConfig; columns?: readonly string[]; ordered?: boolean;
        } = {}
    ): TealFrame {
        return new TealFrame(this.ctx, config, { kind: 'relation', sql, ordered }, columns);
    }

    /**
     * SQL naming this frame's rows, usable directly in a `FROM` clause.
     *
     * For a materialized frame this is its quoted table name; for a relation it is a
     * parenthesized subquery, so composed frames reach DuckDB's optimizer as a single
     * statement.
    */
    get from(): string {
        return this.source.kind === 'table'
            ? quoteIdentifier(this.source.table)
            : `(${this.source.sql})`;
    }

    /**
     * Returns a frame over the rows of a complete SQL statement.
     *
     * Use it to run a statement from `QueryAccess.restrictSQLQuery`, which is a finished
     * `SELECT` that already carries the field restrictions:
     *
     * ```ts
     * const sql = await access.restrictSQLQuery(query, { params: frame.searchParams(size) });
     * for await (const row of frame.query(sql).rows()) { ... }
     * ```
     *
     * The statement runs only when rows are requested, and it composes with other operations:
     * `frame.query(sql).limit(10)` is one statement.
     *
     * `config` defaults to this frame's config. Pass the right config when the statement's
     * `SELECT` list produces different fields. If the statement references its source more
     * than once, materialize this frame first; see `searchParams`.
     *
     * @param sql A complete SQL statement.
     * @param config The field types the statement produces. Defaults to this frame's config.
     * @param columns The output column names. Defaults to the top-level fields of `config`.
    */
    query(sql: string, config: FrameConfig = this.config, columns?: readonly string[]): TealFrame {
        if (!sql.trim()) {
            throw new TypeError('query requires a SQL statement');
        }

        return this.derive(sql, { config, columns: columns ?? columnsOf(config) });
    }

    /**
     * Runs SQL and returns positional rows, with values as DuckDB renders them to JSON. This is
     * for inspection, not for reading data; use `query(sql).rows()` to read data.
     *
     * Unlike `query`, it needs no `DataTypeConfig`, so it can run catalog queries such as
     * `DESCRIBE`. It also skips the conversion to output values, so it shows what DuckDB
     * actually stores.
     *
     * @internal
    */
    rawRows(sql: string): Promise<unknown[][]> {
        return this.ctx.rows(sql);
    }

    /**
     * The `SQLSearchParams` that name this frame as the source of a `QueryAccess` statement.
     *
     * A materialized frame reports `table`, which is quoted as an identifier. A relation-backed
     * frame reports `relation`, its SQL used verbatim.
     *
     * Prefer a table when the generated statement may reference its source more than once
     * (a self-join, a correlated subquery, a `UNION`). Each reference to a relation re-runs the
     * whole subquery, while a table is read directly. Call `materialize()` first in that case.
     *
     * @param size The page size, rendered as `LIMIT`.
     * @param from The page start, rendered as `OFFSET`.
    */
    searchParams(size?: number, from?: number): SQLSearchParams {
        const source = this.source.kind === 'table'
            ? { table: this.source.table }
            : { relation: this.from };

        return {
            ...source,
            ...(size != null && { size }),
            ...(from != null && { from }),
        };
    }

    /** The backing table name, when this frame is materialized. */
    get table(): string | undefined {
        return this.source.kind === 'table' ? this.source.table : undefined;
    }

    /**
     * Creates an empty frame backed by a new table. This is the usual way to make a frame;
     * add rows with `append`.
    */
    static async create(
        config: FrameConfig,
        options: FrameOptions = {}
    ): Promise<TealFrame> {
        const context = await getContext(options.database);
        const { table, columns } = await createTable(context, config, options.name);
        return new TealFrame(context, config, { kind: 'table', table }, columns);
    }

    /**
     * Adds rows to this frame, from parsed records or from Parquet files, and returns the
     * number of rows added.
     *
     * Records are coerced to the frame's field types; Parquet is already typed and is not.
     *
     * If the frame is a relation, it is first promoted to a table in place. Frames already
     * derived from it keep the SQL they captured and are unaffected.
     *
     * The append runs in a transaction, so a failed batch leaves the table exactly as it was.
     * When a table is assembled from many batches, a bad one cannot corrupt those already in it.
     *
     * **Finish appending before deriving other frames from this one.** Derived frames read the
     * table by name, so a later append changes their results too.
    */
    async append(source: AppendSource, options: AppendOptions = {}): Promise<number> {
        await this.ensureTable();
        const table = this.source.kind === 'table' ? this.source.table : '';
        // on its own connection and in a transaction; see `appendInTransaction`
        return appendInTransaction(this.ctx.instance, this.config, table, source, options);
    }

    /**
     * Promotes a relation to a table in place, so this frame has storage to append to.
     *
     * The promotion is shared, so two concurrent appends do not each create a table and split
     * the rows between them.
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
     * Creates a frame from parsed JS records, such as Elasticsearch documents.
     *
     * Each value is coerced to its field type. In `strict` mode (the default) the first value
     * that does not fit throws a `CoercionFailureError`, as `DataFrame`'s builder does. In
     * `lenient` mode the value is stored as null and each failing field is recorded with a count
     * and an example value.
     *
     * If the records cannot be added, the new table is dropped before the error is thrown.
    */
    static async fromRecords(
        config: FrameConfig,
        records: readonly Record<string, unknown>[],
        options: FromRecordsOptions = {}
    ): Promise<TealFrame> {
        const frame = await TealFrame.create(config, options);

        try {
            await frame.append({ records }, { mode: options.mode });
        } catch (err) {
            // No frame is returned, so no caller could drop the table; drop it here. A plain
            // `append` does not do this, because there the caller holds the frame and the
            // table may hold earlier batches.
            await frame.destroy();

            // Unwrapped: nothing survived, so `AppendError`'s context adds nothing, and this
            // throws what `DataFrame` throws, a `CoercionFailureError`.
            throw err instanceof AppendError ? err.cause : err;
        }

        return frame;
    }

    /**
     * Creates a frame over Parquet files, without coercing their values.
     *
     * Parquet carries its own schema, so column types are already enforced; the values are
     * expected to have been validated when the files were written.
     *
     * @param path One path, a list of paths, or a glob. Several files read as one relation.
    */
    static async fromParquet(
        config: FrameConfig,
        path: string | readonly string[],
        options: FrameOptions = {}
    ): Promise<TealFrame> {
        const context = await getContext(options.database);
        // relation-backed: Parquet is queried in place, so nothing is copied until rows are
        // requested. `materialize()` turns it into one table.
        const sql = `SELECT * FROM ${readParquetSource(path)}`;
        return new TealFrame(context, config, { kind: 'relation', sql }, columnsOf(config));
    }

    /**
     * Creates a frame over a complete SQL statement whose source is named in the SQL itself,
     * such as `read_parquet([...])` or an existing table.
     *
     * Use the instance method `query()` instead when the statement was built against an
     * existing frame.
     *
     * ```ts
     * const sql = await access.restrictSQLQuery(query, {
     *     params: { relation: `read_parquet(${...})`, size: 100 }
     * });
     * const frame = await TealFrame.fromSQL(sql, config);
     * ```
     *
     * Nothing runs until rows are requested. The statement is not validated, so any error
     * comes from DuckDB when it executes.
    */
    static async fromSQL(
        sql: string,
        config: FrameConfig,
        options: FrameOptions = {}
    ): Promise<TealFrame> {
        if (!sql.trim()) {
            throw new TypeError('fromSQL requires a SQL statement');
        }

        const context = await getContext(options.database);

        return new TealFrame(context, config, { kind: 'relation', sql }, columnsOf(config));
    }

    /**
     * Copies this frame's rows into a new table and returns a new frame over it. The original
     * frame is unchanged. A frame that is already a table is returned as is.
     *
     * A relation is recomputed every time it is referenced, so materializing pays off when the
     * relation is expensive and used more than once. For a single use it is slower, and a
     * cheap relation over a table never needs it.
    */
    async materialize(name?: string): Promise<TealFrame> {
        if (this.isMaterialized) return this;
        const table = nextTableName(name ?? 'materialized');
        await this.ctx.run(
            `CREATE OR REPLACE TABLE ${quoteIdentifier(table)} AS SELECT * FROM ${this.from}`
        );
        return new TealFrame(this.ctx, this.config, { kind: 'table', table }, this.columns);
    }

    /**
     * Sets the `SELECT` list, returning a new frame.
     *
     * Every column-level operation is a projection: applying a transform or validation,
     * renaming, dropping, or adding a derived column. Chained `select` calls compose into one
     * statement evaluated in a single pass, where `DataFrame` makes a pass per function.
     * Expressions may be native SQL or calls to registered UDFs.
     *
     * To run a complete statement, use `query` instead.
     *
     * @param expressions A map of `{ outputName: sqlExpression }`, or a verbatim `SELECT` list.
     * @param options The result's config and column names, and an optional `groupBy`. Grouping
     * an ordered frame throws, because it would discard the order.
    */
    select(expressions: SelectList, options: SelectOptions = {}): TealFrame {
        const { config = this.config, groupBy } = options;
        const { list, names } = selectList(expressions, options.columns);

        if (groupBy?.length) this.assertOrderSafe('select with groupBy');

        const sql = joinSQL(
            `SELECT ${list} FROM ${this.from}`,
            groupByClause(groupBy)
        );

        return this.derive(sql, { config, columns: names, ordered: this.isOrdered });
    }

    /**
     * Joins another frame, returning a new frame.
     *
     * Either side may be a table or a relation. Both sides are aliased (`a` and `b` by
     * default), because two frames often share column names; write `on` and `select` in terms
     * of those aliases. `groupBy` lets a join and an aggregation run as one statement.
     *
     * Both frames must be in the same database, and neither may be ordered, because a join
     * does not keep row order.
    */
    join(other: TealFrame, options: JoinOptions): TealFrame {
        if (other.ctx !== this.ctx) {
            throw new TypeError(
                'join requires both frames to be in the same database:'
                + ' they are in different databases, so neither can see the other\'s tables'
            );
        }

        this.assertOrderSafe('join', other);

        const { list, names } = selectList(options.select, options.columns);

        const as = options.as ?? 'a';
        const otherAs = options.otherAs ?? 'b';
        const type = (options.type ?? 'inner').toUpperCase();

        const sql = joinSQL(
            `SELECT ${list}`
            + ` FROM ${this.from} AS ${quoteIdentifier(as)}`
            + ` ${type} JOIN ${other.from} AS ${quoteIdentifier(otherAs)}`
            + ` ON ${options.on}`,
            groupByClause(options.groupBy)
        );

        return this.derive(sql, { config: options.config, columns: names });
    }

    /**
     * Adds a `WHERE` clause, returning a new frame.
     *
     * The predicate is raw SQL, so the caller must quote identifiers itself: a field named
     * `group` needs `filter('"group" = \'y\'')`. To run a complete statement, such as one
     * from `QueryAccess`, use `query` instead.
     *
     * A filter keeps row order, so a sorted frame stays sorted.
    */
    filter(predicate: string): TealFrame {
        return this.derive(`SELECT * FROM ${this.from} WHERE ${predicate}`, {
            ordered: this.isOrdered,
        });
    }

    /**
     * Removes duplicate rows, comparing every column (`SELECT DISTINCT *`). Returns a new
     * frame.
     *
     * It works on list and object columns, and treats nulls as equal, so rows that are null in
     * the same column collapse into one.
     *
     * `DISTINCT` does not keep row order, so it throws on an ordered frame and its result is
     * unordered. Remove duplicates first, then sort.
    */
    distinct(): TealFrame {
        this.assertOrderSafe('distinct');

        return this.derive(`SELECT DISTINCT * FROM ${this.from}`);
    }

    /**
     * Adds an `ORDER BY`, returning a new frame.
     *
     * The sort wraps the current relation in a subquery. DuckDB's optimizer flattens the
     * nesting, so `.orderBy(x).limit(10)` runs as a single top-N query. The order of calls
     * means what it says:
     *
     * | chain | means |
     * |---|---|
     * | `.orderBy(x).limit(10)` | the top 10 by x |
     * | `.limit(10).orderBy(x)` | an arbitrary 10, sorted |
     * | `.orderBy(x).filter(p).limit(10)` | the top 10 of the matching rows |
     * | `.orderBy(x).limit(10).filter(p)` | the top 10, then filtered - may yield fewer |
     *
     * `select`, `filter` and `limit` may follow a sort. `join`, `distinct` and a grouping
     * `select` throw on a sorted frame, because they would discard the order. `materialize()`
     * drops the order, because a table has none.
     *
     * Nulls sort as in `DataFrame`: first when ascending, last when descending.
     *
     * **Ties are not ordered deterministically.** DuckDB sorts in parallel and is not stable,
     * so rows with equal sort values can come back in a different order on each run, and
     * paging over them can repeat or skip rows. `DataFrame` sorts with the stable
     * `Array#sort`. A caller that pages must end `sort` with a unique field.
     *
     * @param sort The sort terms, at least one.
    */
    orderBy(sort: readonly SQLSortInput[]): TealFrame {
        if (sort.length === 0) {
            throw new TypeError('orderBy requires at least one sort term');
        }

        const terms = dialect.orderBy(sort.map(toSQLSort));

        return this.derive(`SELECT * FROM ${this.from} ORDER BY ${terms}`, { ordered: true });
    }

    /**
     * Adds `LIMIT` and `OFFSET`, returning a new frame.
     *
     * Either bound may be given alone; with neither, the frame is returned unchanged, so
     * optional paging values can be passed straight through.
     *
     * Prefer `limit` to stopping early in `rows()`. DuckDB stops reading once an unsorted
     * limit is satisfied, and for a sorted one keeps only the top `count` rows instead of
     * sorting everything. Breaking out of `rows()` stops only the JS consumer.
     *
     * A limit keeps row order. Note that `size()` on a limited frame counts the page, not the
     * total; call `size()` on the frame before the limit to get the total.
     *
     * @param count The maximum number of rows (`LIMIT`).
     * @param offset The number of rows to skip (`OFFSET`).
    */
    limit(count?: number, offset?: number): TealFrame {
        if (count == null && offset == null) return this;

        // validated here so the error names this method's parameters; the dialect's own
        // error would name `size` and `from`
        if (count != null) wholeNumber(count, 'limit\'s count');
        if (offset != null) wholeNumber(offset, 'limit\'s offset');

        return this.derive(
            joinSQL(`SELECT * FROM ${this.from}`, dialect.limitOffset(count, offset)),
            { ordered: this.isOrdered }
        );
    }

    /** Counts the frame's rows. */
    async size(): Promise<number> {
        return Number(await this.ctx.scalar(`SELECT count(*) FROM ${this.from}`) ?? 0);
    }

    /**
     * Writes the frame to a Parquet file compressed with zstd, for moving data between
     * processes.
     *
     * Parquet's built-in zstd compression is much faster than gzipping JSON output and
     * produces a smaller file.
    */
    async writeParquet(path: string): Promise<void> {
        await output.writeParquet(this.ctx, this.from, this.config, path);
    }

    /**
     * Writes the frame to a file as ldjson, one JSON object per line.
     *
     * DuckDB writes the file, so rows never become JS objects and this is much faster than
     * serializing `rows()`.
     *
     * The output is byte-identical to `DataFrame.toJSON` with the same `SerializeOptions`,
     * including ISO 8601 dates and integers past `MAX_SAFE_INTEGER` written as strings. See
     * `export-json.ts`.
     *
     * With no options, null fields and empty objects are omitted (`removeNullFields: true`).
     * Any explicit `SerializeOptions` flag means exactly what it means to `DataFrame`.
     *
     * The promise resolves once the whole file is written. Use `ndjson()` to stream the lines
     * instead, for example to upload them as they are produced.
    */
    async writeNDJSON(path: string, options: JsonExportOptions = {}): Promise<void> {
        // removing duplicate rows keeps the first of each in stream order, which a COPY
        // cannot express, so that option writes through the stream instead
        if (resolveRules(options).skipDuplicateObjects) {
            await writeLines(path, this.ndjson(options));
            return;
        }
        await this.ctx.run(
            `COPY (${output.jsonLinesSQL(this.from, this.config, options)}) TO ${quoteLiteral(path)}`
            + ' (FORMAT CSV, HEADER false, QUOTE \'\', ESCAPE \'\', DELIMITER \'\u0007\')'
        );
    }

    /**
     * Streams the frame as ldjson lines, byte-identical to what `writeNDJSON` writes.
     *
     * DuckDB renders each line, so JavaScript only passes strings along. A caller can upload
     * the lines as they arrive and never hold the whole result in memory.
    */
    ndjson(options: JsonExportOptions = {}): AsyncIterableIterator<string> {
        const lines = this.ctx.streamColumnStrings(
            output.jsonLinesSQL(this.from, this.config, options)
        );
        return resolveRules(options).skipDuplicateObjects ? distinctLines(lines) : lines;
    }

    /**
     * Streams the frame's rows as JS objects.
     *
     * With `options`, it yields what `DataFrame.rows(true, options)` yields, by parsing the
     * lines `ndjson(options)` produces. Without options, it yields every column, with a nil
     * value as `null`.
     *
     * There is no `toArray()` or `getColumn()`: the data lives in DuckDB, so column-level work
     * belongs in SQL, and a result may be too large to hold as an array.
    */
    rows(options?: JsonExportOptions): AsyncIterableIterator<Record<string, unknown>> {
        if (options != null) return parseLines(this.ndjson(options));
        return this.ctx.streamRowObjects(`SELECT * FROM ${this.from}`, makeRowShapers(this.config));
    }

    /**
     * Streams the elements of a list column in the first row, as
     * `ListVector.getRowIterator(0, true, options)` yields them.
     *
     * Useful for a one-row frame whose single list column holds the real result. Each element
     * is rendered by the same rules as `ndjson(options)`. A nil element is yielded as `null`
     * under `useNullForUndefined`, as `undefined` otherwise, and skipped under
     * `skipNilListValues` (or `skipNilObjectValues` for object elements). As in `DataFrame`,
     * nothing is yielded under `skipEmptyArrays` when the column is empty, and
     * `skipDuplicateObjects` is not supported.
    */
    listValues(column: string, options: JsonExportOptions = {}): AsyncIterableIterator<unknown> {
        return output.listValues(this.ctx, this.from, this.config, column, options);
    }

    /**
     * Keeps only the selected fields, as `DataFrame.deepSelect` does. Dotted paths select
     * fields inside nested objects, and names that do not exist are ignored. See
     * `deep-select.ts`.
    */
    deepSelect(fields: readonly string[]): TealFrame {
        const { sql, config, columns } = deepSelectSQL(
            this.from, this.columns, this.config, fields
        );
        return this.derive(sql, { config, columns, ordered: this.isOrdered });
    }

    /**
     * Drops every Object column marked `_skip_if_empty` that has no declared child fields left,
     * typically after `deepSelect`. Decided from the config alone; no rows are read.
    */
    pruneEmptyObjects(): TealFrame {
        const dropped = new Set(emptySkippedObjects(this.config));
        if (dropped.size === 0) return this;

        const columns = this.columns.filter((column) => !dropped.has(column));
        const fields = Object.fromEntries(Object.entries(this.config.fields ?? {})
            .filter(([name]) => !dropped.has(name.split('.', 1)[0])));
        const config = { ...this.config, fields };
        const sql = columns.length
            ? `SELECT ${columns.map(quoteIdentifier).join(', ')} FROM ${this.from}`
            : `SELECT * FROM ${this.from} LIMIT 0`;

        return this.derive(sql, { config, columns, ordered: this.isOrdered });
    }

    /**
     * Expands array fields into one row per element, as the `@expandValues` directive does.
     * See `expand-values.ts` for the two modes. Row order is kept, and so is a row with nothing
     * to expand. The expanded fields become `array: false`.
    */
    expandValues(fields: readonly string[], options: ExpandValuesOptions): TealFrame {
        const { sql, config } = expandValuesSQL(
            this.from, this.columns, this.config, fields, options
        );
        return this.derive(sql, { config, ordered: this.isOrdered });
    }

    /**
     * Counts the rows where every column is null, as `DataFrame.countEmptyRows` does. A row
     * holding `{}` or `[]` is not empty, because the stored value is tested, not its JSON form.
    */
    async countEmptyRows(): Promise<number> {
        return Number(
            await this.ctx.scalar(`SELECT count(*) FROM ${this.from} WHERE ${this.emptyRow()}`) ?? 0
        );
    }

    /** Keeps the rows that are not empty, in order, as `DataFrame.removeEmptyRows` does. */
    removeEmptyRows(): TealFrame {
        return this.filter(`NOT (${this.emptyRow()})`);
    }

    private emptyRow(): string {
        return this.columns.map((column) => `${quoteIdentifier(column)} IS NULL`).join(' AND ');
    }

    /**
     * Drops the backing table, if this frame has one. A relation has nothing to drop.
     *
     * Call it only once no frame derived from this one is still in use, because derived
     * frames read the table by name.
    */
    async destroy(): Promise<void> {
        if (this.source.kind === 'table') {
            await this.ctx.run(`DROP TABLE IF EXISTS ${quoteIdentifier(this.source.table)}`);
        }
    }
}

/** A config's top-level columns, as `toDuckDB` lays them out. */
function columnsOf(config: FrameConfig): string[] {
    return Object.keys(new DataType(config as DataTypeConfig).toDuckDB());
}
