/**
 * The comparison cases: the same work, run on both engines.
 *
 * - Setup is per engine and never timed. `setupDataFrame` and `setupTealFrame` each build only
 *   their own side's prerequisites, such as a frame or a Parquet file, so the timing covers only
 *   the named operation and one engine's setup failure does not remove the other's result.
 *   `teardownDataFrame` and `teardownTealFrame` are the matching cleanups.
 * - A case returns the row count it produced. The runner compares the two counts and flags a
 *   mismatch, so a faster result cannot come from doing less work.
 * - `TealFrame` is lazy, so every TealFrame case ends in `force(...)`, with the method chosen per
 *   case: `count` for a filter, `table` for anything that must produce a usable frame, `rows`
 *   where the DataFrame side also returns JS values.
 * - Where an engine has no equivalent, the case returns `SKIPPED` instead of being bent into
 *   something comparable.
*/
import fs from 'node:fs';
import { SKIPPED, force } from './harness.js';
import { COLUMNS } from './generate.js';

/**
 * `toJSON` options that omit null keys, matching what `TealFrame`'s export does by default, so
 * both engines produce the same output format.
*/
const TO_JSON_OPTIONS = {
    useNullForUndefined: false,
    skipNilValues: true,
    skipEmptyObjects: true,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};

/** Writes ldjson from JS incrementally, the way a caller flushing to S3 would. */
function writeLdjsonFromJS(file, rows) {
    const fd = fs.openSync(file, 'w');
    let chunk = '';
    let lines = 0;

    try {
        for (const row of rows) {
            chunk += `${JSON.stringify(row)}\n`;
            lines++;
            // batched into 1 MB writes; a syscall per row would mostly measure the kernel
            if (chunk.length > 1 << 20) {
                fs.writeSync(fd, chunk);
                chunk = '';
            }
        }
        if (chunk) fs.writeSync(fd, chunk);
    } finally {
        fs.closeSync(fd);
    }

    return lines;
}

/** Column list for a TealFrame projection: every column passes through unchanged. */
function passthrough(overrides = {}) {
    const select = {};
    for (const name of COLUMNS) select[name] = `"${name}"`;
    return { ...select, ...overrides };
}

/** The output config for such a projection, with one column's config replaced. */
function outputConfig(config, field, replacement) {
    const fields = { ...config.fields };
    if (field) fields[field] = replacement;
    return { version: 1, fields };
}

/**
 * Child rows for the join cases, with `_key` remapped so five children share each parent key.
 * A 1:1 self-join is unrealistic, and joining on a low-cardinality column (5 categories) is
 * effectively a cartesian product. Five children per parent is a realistic fan-out.
*/
function childRecords(records) {
    return records.map((record, i) => ({ ...record, _key: `key-${Math.floor(i / 5)}` }));
}

/**
 * DataFrame setup for a case whose only prerequisite is the frame itself. Each engine has its
 * own setup, so a `DataFrame.fromJSON` that runs out of memory at 5M does not affect TealFrame,
 * and an `ENGINE=tealframe` run never builds a `DataFrame`.
*/
const dfFrame = ({ DataFrame, config, records }) => ({ df: DataFrame.fromJSON(config, records) });

/** The TealFrame half of the same: one table, dropped in teardown. */
const duckTable = async ({ TealFrame, config, records }) => ({
    duck: await TealFrame.fromRecords(config, records, {}),
});

/** Drops a TealFrame half's table. DataFrame frames are garbage-collected instead. */
const destroyDuck = async (ctx, { duck }) => {
    await duck.destroy();
};

/** The five field transforms the composed-pipeline case chains, in order. */
const STEPS = [
    ['toUpperCase', 'category'],
    ['toLowerCase', 'status'],
    ['trim', 'name'],
    ['toUpperCase', 'email'],
    ['trim', 'description'],
];

/** Splits records into the already-typed batches that the append cases combine. */
function batchesOf(records, count = 5) {
    const size = Math.max(1, Math.floor(records.length / count));
    return Array.from({ length: count }, (_, n) => records.slice(n * size, (n + 1) * size));
}

/** Writes each batch as its own Parquet file, the payload an API process sends a worker. */
async function writePayloads({ TealFrame, config, records, tmp }, prefix) {
    const payloads = [];
    for (const [n, batch] of batchesOf(records).entries()) {
        const producer = await TealFrame.fromRecords(config, batch, {});
        const file = tmp(`${prefix}-${n}`);
        await producer.writeParquet(file);
        await producer.destroy();
        payloads.push(file);
    }
    return { payloads };
}

export const GROUPS = [
    {
        title: 'Frame creation',
        blurb: 'Building a queryable frame from data, type coercion included. An API process'
            + ' does this for records, and a worker does it for Parquet.',
        cases: [
            {
                name: 'from records (+coercion)',
                note: 'Both coerce all 30 fields through the same `coerceToType`.',
                async dataFrame({ DataFrame, config, records }) {
                    return DataFrame.fromJSON(config, records).size;
                },
                async tealFrame({ TealFrame, config, records }) {
                    const frame = await TealFrame.fromRecords(config, records, {});
                    const rows = await frame.size();
                    await frame.destroy();
                    return rows;
                },
            },
            {
                name: 'read from the wire',
                note: 'The worker\'s ingest step, and the reverse of `serialize for the wire`:'
                    + ' `DataFrame.deserializeIterator` of a dfjson payload against `fromParquet`'
                    + ' of a Parquet+zstd one. Each side reads its own wire format, because'
                    + ' `DataFrame` cannot read Parquet and `TealFrame` has no dfjson; that'
                    + ' choice is what is being compared. Parquet is typed and carries its schema,'
                    + ' so this step does no type coercion.'
                    + '\n\nForced with `materialize()`. `fromParquet` reads nothing until rows'
                    + ' are requested, and `size()` alone is answered from the Parquet footer'
                    + ' without reading any values.'
                    + '\n\nUses `serializeIterator`/`deserializeIterator` rather than'
                    + ' `serialize`/`deserialize`, which join every column into one string capped'
                    + ' at 1 GB for the whole frame; this corpus exceeds that at 1M rows. The'
                    + ' iterator pair caps each column at 1 GB instead.',
                async setupDataFrame({ DataFrame, config, records }) {
                    return { wire: [...DataFrame.fromJSON(config, records).serializeIterator()] };
                },
                async dataFrame({ DataFrame }, { wire }) {
                    const frame = await DataFrame.deserializeIterator(wire);
                    return frame.size;
                },
                async tealFrame({ TealFrame, config, parquet }) {
                    const frame = await TealFrame.fromParquet(config, parquet);
                    return force(frame, 'table');
                },
            },
            {
                name: 'serialize for the wire',
                note: 'What each engine hands the network: dfjson against Parquet+zstd.'
                    + '\n\n`serializeIterator()` rather than `serialize()`, which joins the'
                    + ' columns into one string and caps the whole frame at 1 GB - at 1M rows of'
                    + ' this corpus that reports OOM, which measures the convenience method\'s'
                    + ' ceiling rather than the engine. The iterator yields one string per column'
                    + ' (1 GB each) and is fully consumed here, so the same bytes are produced.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    let bytes = 0;

                    // the iterator is a generator, so it must be consumed to serialize anything
                    for (const chunk of df.serializeIterator()) bytes += chunk.length;
                    return bytes > 0 ? df.size : 0;
                },
                async tealFrame({ tmp }, { duck }) {
                    await duck.writeParquet(tmp('serialize'));
                    return duck.size();
                },
                teardownTealFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Transforms and validations',
        blurb: 'The data-mate functions. Both engines run the same `FunctionDefinitionConfig`'
            + ' through their own adapter: `dataFrameAdapter` builds a new column, and'
            + ' `tealFrameAdapter` returns a SQL expression (native SQL, or a vectorized UDF).',
        cases: [
            {
                name: 'transform (toUpperCase)',
                note: 'One Keyword column uppercased, all 30 columns projected through. '
                    + '**`DataFrame` shares data structurally.** It is immutable and columnar, so this'
                    + ' returns a new frame REFERENCING the existing column vectors -'
                    + ' almost no data moves, while `TealFrame` physically'
                    + ' materializes a new result. The two do different amounts of'
                    + ' work: the comparison is of semantics, not equal labor, and'
                    + ' the deferred cost reappears when the data is read.'
                    + ' Here `DataFrame` swaps ONE column and reuses the other 29, while'
                    + ' `TealFrame` writes all 30 - see the composed pipeline case for'
                    + ' where that stops being an advantage.',
                setupDataFrame: dfFrame,
                async setupTealFrame(ctx) {
                    const {
                        TealFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.toUpperCase, {
                        field: 'category',
                        inputConfig: { field_config: config.fields.category },
                    });
                    return {
                        duck: await TealFrame.fromRecords(config, records, {}),
                        expression: adapted.expression,
                        output: adapted.outputConfig.field_config,
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df }) {
                    return dfAdapter(repo.toUpperCase, { field: 'category' }).frame(df).size;
                },
                async tealFrame({ config }, { duck, expression, output }) {
                    return force(
                        duck.select(
                            passthrough({ category: expression }),
                            { config: outputConfig(config, 'category', output) }
                        ),
                        'table'
                    );
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'validation (isIP)',
                note: 'A failing value is NULLed and the row kept, on both sides.',
                setupDataFrame: dfFrame,
                async setupTealFrame(ctx) {
                    const {
                        TealFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.isIP, {
                        field: 'ip',
                        inputConfig: { field_config: config.fields.ip },
                    });
                    return {
                        duck: await TealFrame.fromRecords(config, records, {}),
                        expression: adapted.expression,
                        output: adapted.outputConfig.field_config,
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df }) {
                    return dfAdapter(repo.isIP, { field: 'ip' }).frame(df).size;
                },
                async tealFrame({ config }, { duck, expression, output }) {
                    return force(
                        duck.select(
                            passthrough({ ip: expression }),
                            { config: outputConfig(config, 'ip', output) }
                        ),
                        'table'
                    );
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'transform (array column)',
                note: 'The same `toUpperCase`, but over `tags` - a Keyword **array**. Both'
                    + ' adapters take a separate path for `ProcessMode.INDIVIDUAL_VALUES`:'
                    + ' `DataFrame` walks the list inside each row, `tealFrameAdapter` emits'
                    + ' `list_transform(col, x -> udf(x))`. Seven of the 30 columns are arrays'
                    + ' and no other case exercised that path.',
                setupDataFrame: dfFrame,
                async setupTealFrame(ctx) {
                    const {
                        TealFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.toUpperCase, {
                        field: 'tags',
                        inputConfig: { field_config: config.fields.tags },
                    });
                    return {
                        duck: await TealFrame.fromRecords(config, records, {}),
                        expression: adapted.expression,
                        output: adapted.outputConfig.field_config,
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df }) {
                    return dfAdapter(repo.toUpperCase, { field: 'tags' }).frame(df).size;
                },
                async tealFrame({ config }, { duck, expression, output }) {
                    return force(
                        duck.select(
                            passthrough({ tags: expression }),
                            { config: outputConfig(config, 'tags', output) }
                        ),
                        'table'
                    );
                },
                teardownTealFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Composed pipelines',
        blurb: 'Where the two models differ most. A query often applies several functions and'
            + ' then filters. `DataFrame` makes one pass per function, because each adapter'
            + ' returns a new frame. `TealFrame` composes them into one statement that DuckDB'
            + ' evaluates in a single pass.',
        cases: [
            {
                name: '5 transforms + filter',
                note: 'Five field transforms chained, then a filter. `DataFrame`: five passes,'
                    + ' each building a new column, then a search. `TealFrame`: one `SELECT` with'
                    + ' five expressions and a `WHERE`, evaluated once.',
                setupDataFrame: dfFrame,
                async setupTealFrame(ctx) {
                    const {
                        TealFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const expressions = {};
                    const fields = { ...config.fields };
                    for (const [fn, field] of STEPS) {
                        const adapted = await duckAdapter(repo[fn], {
                            field,
                            inputConfig: { field_config: config.fields[field] },
                        });
                        expressions[field] = adapted.expression;
                        fields[field] = adapted.outputConfig.field_config;
                    }

                    return {
                        expressions,
                        outConfig: { version: 1, fields },
                        duck: await TealFrame.fromRecords(config, records, {}),
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df }) {
                    let frame = df;
                    for (const [fn, field] of STEPS) {
                        frame = dfAdapter(repo[fn], { field }).frame(frame);
                    }
                    return frame.search('active:true').size;
                },
                async tealFrame(ctx, { duck, expressions, outConfig }) {
                    return force(
                        duck.select(passthrough(expressions), { config: outConfig })
                            .filter('"active" = true'),
                        'table'
                    );
                },
                teardownTealFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Query operations',
        blurb: 'Filtering, sorting, paging and dedup - what a search request does after the data'
            + ' is loaded.',
        cases: [
            {
                name: 'filter (1 of 5 matches)',
                note: 'Each engine uses its own predicate language: xLucene for `DataFrame`,'
                    + ' SQL for `TealFrame`. Forced with `count(*)` - the question is how fast'
                    + ' the rows are found.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.search('category:alpha').size;
                },
                async tealFrame(ctx, { duck }) {
                    return force(duck.filter('"category" = \'alpha\''), 'count');
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'sort (2 keys)',
                note: 'Forced with `materialize()`, never `count(*)` - a count lets the'
                    + ' optimizer drop the ORDER BY and would measure nothing.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.orderBy('category:asc', 'count:desc').size;
                },
                async tealFrame(ctx, { duck }) {
                    return force(
                        duck.orderBy([{ expression: '"category"' }, { expression: '"count"', order: 'desc' }]),
                        'table'
                    );
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'sort + limit (top 1,000)',
                note: 'The shape of a typical search request, a sort plus a size, which neither'
                    + ' the sort case nor the page case measures on its own. `DataFrame` sorts'
                    + ' every row and then slices; DuckDB plans it as `TOP_N`, a heap of 1,000'
                    + ' plus a dynamic filter that skips row groups, so the gap should widen with'
                    + ' scale. Forced with `materialize()`, never a count.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.orderBy('category:asc', 'count:desc').limit(1000).size;
                },
                async tealFrame(ctx, { duck }) {
                    return force(
                        duck.orderBy([{ expression: '"category"' }, { expression: '"count"', order: 'desc' }])
                            .limit(1000),
                        'table'
                    );
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'dedup (all columns)',
                note: '`DataFrame.unique(every field)` vs `SELECT DISTINCT *`.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.unique(df.fields).size;
                },
                async tealFrame(ctx, { duck }) {
                    return force(duck.distinct(), 'table');
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'page (limit 1,000)',
                note: '**`DataFrame` shares data structurally.** It is immutable and columnar, so this'
                    + ' returns a new frame REFERENCING the existing column vectors -'
                    + ' almost no data moves, while `TealFrame` physically'
                    + ' materializes a new result. The two do different amounts of'
                    + ' work: the comparison is of semantics, not equal labor, and'
                    + ' the deferred cost reappears when the data is read.'
                    + ' `DataFrame.limit` is a `slice` view over the same vectors.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.limit(1000).size;
                },
                async tealFrame(ctx, { duck }) {
                    return force(duck.limit(1000), 'table');
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'output all rows to JS',
                note: 'The response path: every row converted back to plain JS objects.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    let seen = 0;

                    for (const _row of df.toJSON()) seen++;
                    return seen;
                },
                async tealFrame(ctx, { duck }) {
                    return force(duck, 'rows');
                },
                teardownTealFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Output to ldjson',
        blurb: 'A common way to deliver a finished result: write **ldjson** to S3, one'
            + ' JSON object per line. `DataFrame` has to build every row as a JS object and'
            + ' `JSON.stringify` it; `TealFrame` renders each line in C++ inside the query, so'
            + ' the rows never become JS values at all.'
            + '\n\n**The output bytes are identical** to `DataFrame`\'s. DuckDB\'s native JSON'
            + ' differs from `DataFrame`\'s: it'
            + ' writes `2026-01-10 00:00:00` for a Date, a bare number for a `Long` past'
            + ' `MAX_SAFE_INTEGER` that `JSON.parse` rounds, `"f": null` where `DataFrame` omits'
            + ' the key, `5.0` for an integral float, and a bare `Infinity` that is not valid'
            + ' JSON at all. The export projection corrects every one of them in SQL before'
            + ' anything is written (see `test/teal-frame/export-json-spec.ts`), at a cost of'
            + ' about 7% of the projection.'
            + '\n\nBoth sides omit null fields from the output.',
        cases: [
            {
                name: 'ldjson to a file',
                note: 'The whole result to one file. Each side writes it the way it can:'
                    + ' `DataFrame.toJSON` then `JSON.stringify` per row, batched into 1 MB'
                    + ' writes so the measurement is not one syscall per row, against'
                    + ' `writeNDJSON`, which is a single `COPY`. Note that `toJSON` builds an'
                    + ' array of every row first; building it is part of the cost, and'
                    + ' is why this is where `DataFrame` runs out of heap.',
                async setupDataFrame({
                    DataFrame, config, records, tmp
                }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        dfFile: tmp('ldjson-df', 'ldjson'),
                    };
                },
                async setupTealFrame({
                    TealFrame, config, records, tmp
                }) {
                    return {
                        duck: await TealFrame.fromRecords(config, records, {}),
                        duckFile: tmp('ldjson-duck', 'ldjson'),
                    };
                },
                async dataFrame(ctx, { df, dfFile }) {
                    return writeLdjsonFromJS(dfFile, df.toJSON(TO_JSON_OPTIONS));
                },
                async tealFrame(ctx, { duck, duckFile }) {
                    await duck.writeNDJSON(duckFile);
                    return duck.size();
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'ldjson streamed',
                note: 'The same lines, never held in memory all at once, which a worker needs'
                    + ' when the table already uses most of its memory. `ndjson()` yields one line'
                    + ' at a time, so JavaScript only moves bytes. Byte-identical to the file'
                    + ' path; the only question is throughput.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    let lines = 0;
                    let bytes = 0;

                    for (const row of df.toJSON(TO_JSON_OPTIONS)) {
                        bytes += JSON.stringify(row).length;
                        lines++;
                    }
                    // the harness compares row counts; requiring bytes > 0 ensures the JSON was
                    // actually produced
                    return bytes > 0 ? lines : 0;
                },
                async tealFrame(ctx, { duck }) {
                    let lines = 0;
                    let bytes = 0;

                    for await (const line of duck.ndjson()) {
                        bytes += line.length;
                        lines++;
                    }
                    return bytes > 0 ? lines : 0;
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'transform + filter -> ldjson',
                note: 'The whole response path in one case: transform a field, filter, and emit'
                    + ' ldjson.'
                    + ' `DataFrame` makes a pass per step and then converts every surviving row'
                    + ' to JS; for `TealFrame` the transform, the filter and the JSON rendering'
                    + ' are one statement, so no intermediate result is built.',
                setupDataFrame: dfFrame,
                async setupTealFrame(ctx) {
                    const {
                        TealFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.toUpperCase, {
                        field: 'category',
                        inputConfig: { field_config: config.fields.category },
                    });
                    return {
                        duck: await TealFrame.fromRecords(config, records, {}),
                        expression: adapted.expression,
                        output: adapted.outputConfig.field_config,
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df }) {
                    const transformed = dfAdapter(repo.toUpperCase, { field: 'category' })
                        .frame(df)
                        .search('active:true');

                    let lines = 0;
                    let bytes = 0;

                    for (const row of transformed.toJSON(TO_JSON_OPTIONS)) {
                        bytes += JSON.stringify(row).length;
                        lines++;
                    }
                    return bytes > 0 ? lines : 0;
                },
                async tealFrame({ config }, { duck, expression, output }) {
                    const projected = duck
                        .select(
                            passthrough({ category: expression }),
                            { config: outputConfig(config, 'category', output) }
                        )
                        .filter('"active" = true');

                    let lines = 0;
                    let bytes = 0;

                    for await (const line of projected.ndjson()) {
                        bytes += line.length;
                        lines++;
                    }
                    return bytes > 0 ? lines : 0;
                },
                teardownTealFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Aggregations',
        blurb: 'Grouped and global aggregation. For `TealFrame` this is just a projection with a'
            + ' `GROUP BY`, so it composes with everything else in one statement.',
        cases: [
            {
                name: 'group by 1 key + sum',
                note: '5 groups out. Forced with `rows` on both sides, since both produce a small'
                    + ' materialized result.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    const out = await df.aggregate().groupBy('category')
                        .sum('count')
                        .run();
                    return out.size;
                },
                async tealFrame(ctx, { duck }) {
                    return force(duck.select(
                        { category: '"category"', total: 'sum("count")' },
                        {
                            config: {
                                version: 1,
                                fields: { category: { type: 'Keyword' }, total: { type: 'Long' } },
                            },
                            groupBy: ['"category"'],
                        }
                    ), 'rows');
                },
                teardownTealFrame: destroyDuck,
            },
            {
                name: 'group by 2 keys + 3 aggs',
                note: '20 groups, three aggregate functions at once.',
                setupDataFrame: dfFrame,
                setupTealFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    const out = await df.aggregate()
                        .groupBy('category', 'status')
                        .sum('count')
                        .avg('score')
                        .max('age')
                        .run();
                    return out.size;
                },
                async tealFrame(ctx, { duck }) {
                    return force(duck.select(
                        {
                            category: '"category"',
                            status: '"status"',
                            total: 'sum("count")',
                            mean: 'avg("score")',
                            oldest: 'max("age")',
                        },
                        {
                            config: {
                                version: 1,
                                fields: {
                                    category: { type: 'Keyword' },
                                    status: { type: 'Keyword' },
                                    total: { type: 'Long' },
                                    mean: { type: 'Double' },
                                    oldest: { type: 'Short' },
                                },
                            },
                            groupBy: ['"category"', '"status"'],
                        }
                    ), 'rows');
                },
                teardownTealFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Appending batches',
        blurb: 'Combining several already-typed batches into one frame, as a worker does when'
            + ' payloads arrive. Coercion is excluded because the batches are prepared in setup.',
        cases: [
            {
                name: 'combine 5 batches',
                note: '`DataFrame.appendAll` over 5 prebuilt frames vs 5'
                    + ' `append({ parquet })` calls into one table. '
                    + '**`DataFrame` shares data structurally.** It is immutable and columnar, so this'
                    + ' returns a new frame REFERENCING the existing column vectors -'
                    + ' almost no data moves, while `TealFrame` physically'
                    + ' materializes a new result. The two do different amounts of'
                    + ' work: the comparison is of semantics, not equal labor, and'
                    + ' the deferred cost reappears when the data is read.'
                    + ' `appendAll` only recomputes offsets - its own doc says the cost is'
                    + ' relatively low, whereas `TealFrame` inserts the rows into a real'
                    + ' table that can be queried with no further cost.',
                async setupDataFrame({ DataFrame, config, records }) {
                    return {
                        frames: batchesOf(records).map((batch) => (
                            DataFrame.fromJSON(config, batch)
                        )),
                    };
                },
                setupTealFrame: (ctx) => writePayloads(ctx, 'batch'),
                async dataFrame({ DataFrame, config }, { frames }) {
                    return DataFrame.fromJSON(config, []).appendAll(frames).size;
                },
                async tealFrame({ TealFrame, config }, { payloads }) {
                    const frame = await TealFrame.create(config, {});
                    for (const path of payloads) await frame.append({ parquet: path });
                    const rows = await frame.size();
                    await frame.destroy();
                    return rows;
                },
            },
            {
                name: 'combine 5 batches, concurrent',
                note: 'TealFrame only: all payloads arrive at once. `DataFrame` has no concurrent'
                    + ' append; `appendAll` is one synchronous pass.',
                setupTealFrame: (ctx) => writePayloads(ctx, 'cbatch'),
                async dataFrame() {
                    return SKIPPED;
                },
                async tealFrame({ TealFrame, config }, { payloads }) {
                    const frame = await TealFrame.create(config, {});
                    await Promise.all(payloads.map((path) => frame.append({ parquet: path })));
                    const rows = await frame.size();
                    await frame.destroy();
                    return rows;
                },
            },
            {
                name: 'combine 5 batches, one append',
                note: 'TealFrame only. `append({ parquet })` takes a list of paths, which'
                    + ' `read_parquet` reads as one relation, so all five payloads land in a'
                    + ' single `INSERT ... BY NAME` rather than five.'
                    + '\n\nThe trade-off is that every payload must have arrived first, so it'
                    + ' suits a worker that batches what has arrived, while the concurrent case'
                    + ' above suits one that ingests each payload as it completes.',
                setupTealFrame: (ctx) => writePayloads(ctx, 'obatch'),
                async dataFrame() {
                    return SKIPPED;
                },
                async tealFrame({ TealFrame, config }, { payloads }) {
                    const frame = await TealFrame.create(config, {});
                    await frame.append({ parquet: payloads });
                    const rows = await frame.size();
                    await frame.destroy();
                    return rows;
                },
            },
        ],
    },

    {
        title: 'Join',
        blurb: '**`DataFrame` has no join primitive.** A caller has to emulate one, for example'
            + ' by issuing a child search per parent row. For `TealFrame` a join is ordinary SQL'
            + ' over two tables.',
        cases: [
            {
                name: 'inner join, 5 children per parent',
                note: 'A child table keyed so each parent matches 5 children, a realistic'
                    + ' fan-out. Forced with `count(*)`.',
                async setupTealFrame({ TealFrame, config, records }) {
                    return {
                        parent: await TealFrame.fromRecords(config, records, {}),
                        child: await TealFrame.fromRecords(config, childRecords(records), {}),
                    };
                },
                async dataFrame() {
                    return SKIPPED;
                },
                async tealFrame(ctx, { parent, child }) {
                    return force(parent.join(child, {
                        on: 'a."_key" = b."_key"',
                        select: {
                            _key: 'a."_key"',
                            category: 'a."category"',
                            child_status: 'b."status"',
                        },
                        config: {
                            version: 1,
                            fields: {
                                _key: { type: 'Keyword' },
                                category: { type: 'Keyword' },
                                child_status: { type: 'Keyword' },
                            },
                        },
                    }), 'count');
                },
                async teardownTealFrame(ctx, { parent, child }) {
                    await parent.destroy();
                    await child.destroy();
                },
            },
            {
                name: 'join + count per parent',
                note: 'Per-parent child counts in one statement, which a per-row child search'
                    + ' can only emulate. Grouped by the parent key, not a low-cardinality field:'
                    + ' joining two 100k tables on a 5-value column produces a 2-billion-row'
                    + ' cartesian product rather than a realistic join.',
                async setupTealFrame({ TealFrame, config, records }) {
                    return {
                        parent: await TealFrame.fromRecords(config, records, {}),
                        child: await TealFrame.fromRecords(config, childRecords(records), {}),
                    };
                },
                async dataFrame() {
                    return SKIPPED;
                },
                async tealFrame(ctx, { parent, child }) {
                    return force(parent.join(child, {
                        type: 'left',
                        on: 'a."_key" = b."_key"',
                        select: { key: 'a."_key"', children: 'count(b."_key")' },
                        config: {
                            version: 1,
                            fields: { key: { type: 'Keyword' }, children: { type: 'Long' } },
                        },
                        groupBy: ['a."_key"'],
                    }), 'count');
                },
                async teardownTealFrame(ctx, { parent, child }) {
                    await parent.destroy();
                    await child.destroy();
                },
            },
        ],
    },
];
