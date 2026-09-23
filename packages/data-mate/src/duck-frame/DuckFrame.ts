import { DataTypeConfig, SQLDialectName, SQLSearchParams } from '@terascope/types';
import { DataType } from '@terascope/data-types';
import {
    getSQLDialect, groupByClause, quoteIdentifier,
    quoteLiteral, toSQLSort, wholeNumber, type SQLSortInput
} from '@terascope/sql-builder';
import { appendParquet, appendRecords, countQuietly } from './append.js';
import { DuckContext } from './DuckContext.js';
import { getContext } from './database.js';
import { AppendError } from './errors.js';
import { createTable, nextTableName } from './table.js';
import { joinSQL, selectList } from './clauses.js';
import { describeSource, readParquetSource } from './sources.js';
import { buildJsonExpression, JsonExportOptions } from './export-json.js';
import {
    AppendOptions, AppendSource, FrameConfig, FrameOptions,
    FromRecordsOptions, JoinOptions, SelectList, SelectOptions, Source
} from './interfaces.js';

/**
 * The DuckDB dialect, shared with `@terascope/xlucene-translator`.
 *
 * **Identifier quoting, `ORDER BY` and `LIMIT`/`OFFSET` all come from here rather than from
 * this file**, so a sort a frame builds and a sort `QueryAccess.restrictSQLQuery` emits are
 * rendered by the same code. They used to be two implementations, and they disagreed: the
 * translator left null placement to DuckDB's `NULLS LAST` default while this file emitted
 * `DataFrame`'s rule, so the same user query put nulls at opposite ends of an ascending page
 * depending on which one built the statement.
*/
const dialect = getSQLDialect(SQLDialectName.duckdb);

/**
 * A frame whose rows live in a DuckDB table.
 *
 * Its own thing with its own API - `DataFrame` and the QPL engine are frozen and this
 * neither wraps nor replaces them.
 *
 * ## THE API IS THREE GROUPS, NOT A LIST OF WAYS TO SEARCH
 *
 * **1. Compose a statement** - `filter` `select` `orderBy` `limit` `distinct` `join`.
 * Each appends ONE SQL clause to this frame and returns a new frame. Nothing runs.
 *
 * **2. Be handed a statement** - `query` (instance) and `fromSQL` (static). The statement
 * already exists; the frame runs it. Same instance/static pairing as
 * `append({records})` / `fromRecords`.
 *
 * **3. Consume** - `rows` `size` `ndjson` `writeNDJSON` `writeParquet`. Execute, and
 * produce output.
 *
 * **`filter` and `select` are CLAUSE BUILDERS, not a search API.** `filter` is the `WHERE`
 * and `select` is the `SELECT` list, exactly as `orderBy` is the `ORDER BY` - six methods of
 * one kind, not two special ones. They exist because the 205 field functions arrive ONE AT A
 * TIME: `duckFrameAdapter` returns an expression for a single function on a single column, and
 * a transform chain is `select` -> `select` -> `select`, composing into one statement
 * evaluated in a single pass. There is no finished statement on that path to hand over.
 *
 * **If you already HAVE a statement, do not take it apart - use `query`.** That is the
 * `QueryAccess` path, and rebuilding a restricted statement out of `filter` + `select` is how
 * a field restriction gets dropped.
 *
 * `rawRows` is in none of these groups: it is inspection - a config-free hatch for catalog
 * queries and storage assertions. See its own note.
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
export class DuckFrame {
    private constructor(
        private readonly ctx: DuckContext,
        readonly config: FrameConfig,
        /**
         * NOT readonly: `append` may promote a relation to a table, because a frame is a
         * HANDLE to the data it represents and is in charge of its own storage. Every other
         * operation still returns a NEW frame and leaves this one alone.
        */
        private source: Source,
        readonly columns: readonly string[]
    ) {}

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
     * **Runs a complete SQL statement and returns a frame over its rows.**
     *
     * This is how a statement from `QueryAccess.restrictSQLQuery` is executed. That method
     * returns a finished `SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT`, already carrying
     * the field restrictions, and spaces drives every query and execution plan through it -
     * so the frame's job is to RUN one, not to rebuild it from parts.
     *
     * ```ts
     * const sql = await access.restrictSQLQuery(query, { params: frame.searchParams(size) });
     * for await (const row of frame.query(sql).rows()) { ... }
     * ```
     *
     * Lazy, like every other operator: the statement becomes this frame's relation and runs
     * when something asks for rows. It therefore composes - `frame.query(sql).limit(10)` is
     * one statement - though a statement that already says what it wants rarely needs to.
     *
     * `config` defaults to this frame's, which is right when the statement projects the same
     * fields and wrong when it does not; a statement whose `SELECT` list changes the shape
     * must declare what it produces, exactly as `select` must.
     *
     * **A statement that names its source more than once wants a TABLE, not a subquery** -
     * see `searchParams`.
    */
    query(sql: string, config: FrameConfig = this.config, columns?: readonly string[]): DuckFrame {
        if (!sql.trim()) {
            throw new TypeError('query requires a SQL statement');
        }

        return new DuckFrame(
            this.ctx,
            config,
            { kind: 'relation', sql },
            columns ?? Object.keys(new DataType(config as DataTypeConfig).toDuckDB())
        );
    }

    /**
     * **INSPECTION, not a way to read data.** Runs SQL and returns positional rows, with the
     * values as DuckDB's own JSON rendering rather than as this package's output shape.
     *
     * Two things it can do that `query(sql).rows()` cannot:
     *
     * - **It needs no `DataTypeConfig`.** `query` requires one to build a frame, so a catalog
     *   query like `DESCRIBE` - six columns of DuckDB's own shape, nothing to do with the
     *   frame's fields - would have to invent one. `schema-check.ts` is the only caller in
     *   `src/` and this is why.
     * - **It does not go through `toPlainValue`**, so it reports what DuckDB actually holds.
     *   That matters while DEF-BIGINT is open: `toPlainValue` calls `bigIntToJSON`, which
     *   subtracts 1 from every value above `MAX_SAFE_INTEGER`, so `rows()` currently
     *   misreports a `Long` and `rawRows` does not. **That is a bug to FIX, not a contract**
     *   - see `docs/known-defects.md` - and this method must not become the reason to keep it.
     *
     * **To READ data, use `query(sql).rows()`.** Deliberately narrow otherwise: it hands out
     * neither the connection nor the instance, so it cannot route frames between databases,
     * which is what the removed `get context()` allowed.
     *
     * @internal
    */
    rawRows(sql: string): Promise<unknown[][]> {
        return this.ctx.rows(sql);
    }

    /**
     * **How this frame names itself to `QueryAccess`**, as the source half of a
     * `SQLSearchParams`.
     *
     * A materialized frame reports `table`, which `buildSQLStatement` quotes as an
     * identifier. A relation-backed one reports `relation`, its SQL used verbatim.
     *
     * **Prefer the table, and that is not a style point.** A generated statement may name its
     * source MORE THAN ONCE - a self-join, a correlated subquery, a `UNION` over the same
     * rows - and a relation is textual, so each mention re-executes the whole subquery. A
     * table name is evaluated once however often it appears. `materialize()` first whenever
     * the statement might reference the source twice; a relation referenced four times
     * measured 2.59x against the table.
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
     * A new frame. It owns a table and starts empty - **the normal way to make one.**
     *
     * There is no separate "empty" factory, because a new frame IS empty; `fromRecords` and
     * `fromParquet` are just this plus one `append`.
    */
    static async create(
        config: FrameConfig,
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
                    ? await appendParquet(connection, table, source.parquet)
                    : await appendRecords(
                        connection, this.config, table, source.records, options
                    );

                await connection.run('COMMIT');
                return added;
            } catch (err) {
                await connection.run('ROLLBACK');

                throw new AppendError({
                    table,
                    source: source.records === undefined ? 'parquet' : 'records',
                    describedSource: describeSource(source),
                    // counted AFTER the rollback, so it reports what actually survived - and
                    // only here, so a successful append never pays for it
                    rowsRemaining: await countQuietly(connection, table),
                }, err);
            }
        } finally {
            connection.disconnectSync();
        }
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
        config: FrameConfig,
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
        config: FrameConfig,
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
     * **A frame over a complete SQL statement** - the entry point for a statement that was
     * generated before any frame existed.
     *
     * The instance `query()` is the same thing for a statement built AGAINST a frame, and is
     * the common case, because a generated statement needs a source and the frame is it.
     * This one is for a statement whose source is named in the SQL itself -
     * `read_parquet([...])`, an already-known table, a join of two.
     *
     * ```ts
     * const sql = await access.restrictSQLQuery(query, {
     *     params: { relation: `read_parquet(${...})`, size: 100 }
     * });
     * const frame = await DuckFrame.fromSQL(sql, config);
     * ```
     *
     * Relation-backed, so nothing runs until something asks for rows. **Nothing validates the
     * statement** - it is the caller's own SQL, exactly as `filter`'s predicate and `select`'s
     * expressions are, and the error arrives from DuckDB when it executes.
    */
    static async fromSQL(
        sql: string,
        config: FrameConfig,
        options: FrameOptions = {}
    ): Promise<DuckFrame> {
        if (!sql.trim()) {
            throw new TypeError('fromSQL requires a SQL statement');
        }

        const context = await getContext(options.database);

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
     * The `SELECT` list - **the mechanism for column mutation and validation.**
     *
     * **A clause builder**, the sibling of `filter`; see the class note. Its caller is the
     * directive path: `duckFrameAdapter` hands back one expression for one function on one
     * column, and those accumulate here. A ready-made statement goes to `query` instead.
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
    select(expressions: SelectList, options: SelectOptions = {}): DuckFrame {
        const { config = this.config, groupBy } = options;
        const { list, names } = selectList(expressions, options.columns);

        if (groupBy?.length) this.assertOrderSafe('select with groupBy');

        const sql = joinSQL(
            `SELECT ${list} FROM ${this.from}`,
            groupByClause(groupBy)
        );

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

        return new DuckFrame(this.ctx, options.config, { kind: 'relation', sql }, names);
    }

    /**
     * The `WHERE` clause. Returns a new relation-backed frame.
     *
     * **A clause builder** - one of six, beside `select`, `orderBy`, `limit`, `distinct` and
     * `join`. It builds a statement up a clause at a time, for the path where the query is
     * assembled rather than given. A statement that ALREADY exists - anything from
     * `QueryAccess` - goes to `query`, whole; splitting one into a predicate here loses
     * whatever its `SELECT` list was enforcing.
     *
     * The predicate is raw SQL, so identifiers the caller writes are the caller's to quote:
     * a field named `group` needs `filter('"group" = \'y\'')`.
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
    orderBy(sort: readonly SQLSortInput[]): DuckFrame {
        if (sort.length === 0) {
            throw new TypeError('orderBy requires at least one sort term');
        }

        const terms = dialect.orderBy(sort.map(toSQLSort));

        return new DuckFrame(
            this.ctx,
            this.config,
            {
                kind: 'relation',
                sql: `SELECT * FROM ${this.from} ORDER BY ${terms}`,
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

        // checked HERE, under this method's own parameter names: the dialect renders
        // `LIMIT`/`OFFSET` for a statement whose bounds are called `size` and `from`, and an
        // error naming those would be about arguments this caller never passed
        if (count != null) wholeNumber(count, 'limit\'s count');
        if (offset != null) wholeNumber(offset, 'limit\'s offset');

        return new DuckFrame(
            this.ctx,
            this.config,
            {
                kind: 'relation',
                sql: joinSQL(
                    `SELECT * FROM ${this.from}`,
                    dialect.limitOffset(count, offset)
                ),
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
