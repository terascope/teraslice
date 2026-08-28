/**
 * The side-by-side cases: the same work, asked of both engines.
 *
 * **Each case states what it encapsulates**, because that is the part a benchmark gets wrong.
 * The rules applied throughout:
 *
 * - **Setup is PER ENGINE, and never timed.** `setupDataFrame` and `setupDuckFrame` build only
 *   their own side's prerequisites - a built frame, a written Parquet payload - so the measurement
 *   covers only the operation named, and one engine failing to set up cannot delete the other
 *   engine's number. `teardownDataFrame`/`teardownDuckFrame` are the matching halves.
 * - A case returns the row count it produced. The runner compares the two engines' counts and
 *   flags a mismatch, so "faster" can never mean "did less".
 * - `DuckFrame` is lazy, so every DuckFrame case ends in `force(...)`, and the forcing method is
 *   chosen per case: `count` for a filter (find the rows), `table` for anything that must yield a
 *   usable frame, `rows` where the DataFrame side also hands back materialised JS values.
 * - Where an engine genuinely has no equivalent, the case returns `SKIPPED` rather than being
 *   quietly bent into something comparable.
*/
import fs from 'node:fs';
import { SKIPPED, force } from './harness.js';
import { COLUMNS } from './generate.js';

/**
 * The `toJSON` options spaces really passes (`qpl-engine/src/v3/execute/run.ts:174`).
 *
 * `remove_null_fields` defaults to TRUE (`create-execution-plan.ts:94`, off only via
 * `@preserveNullFields`), so the default output OMITS null keys - which is also what
 * `DuckFrame`'s export does. Using anything else here would compare two different formats.
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
            // batched, not one write per row: a syscall per row would measure the kernel
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

/** Column list for a DuckFrame projection: every column passes through unchanged. */
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
 * Child rows for the join cases: `_key` remapped so **five** children share each parent key.
 *
 * A 1:1 self-join is not a join anyone runs, and joining on a low-cardinality column (5 distinct
 * categories) is a cartesian product - at 100k rows that measured 11.8 seconds of explosion.
 * Five children per parent is the fan-out the QPL join shapes actually have.
*/
function childRecords(records) {
    return records.map((record, i) => ({ ...record, _key: `key-${Math.floor(i / 5)}` }));
}

/**
 * The DataFrame half of a case whose only prerequisite is the frame itself.
 *
 * **Each engine's setup is its OWN.** A shared one hid each engine behind the other's failure: at
 * 5M `DataFrame.fromJSON` can exhaust the heap, and while setup built both frames together that
 * took DuckFrame's number with it - the report then showed a hole where DataFrame's ceiling
 * belonged. It also meant `ENGINE=duckframe` still built a `DataFrame`, spending exactly the heap
 * that the per-engine split exists to protect.
*/
const dfFrame = ({ DataFrame, config, records }) => ({ df: DataFrame.fromJSON(config, records) });

/** The DuckFrame half of the same: one table, dropped in teardown. */
const duckTable = async ({ DuckFrame, config, records }) => ({
    duck: await DuckFrame.fromRecords(config, records, {}),
});

/** Every DuckFrame half that owns a table drops it; DataFrame's frames are just GC'd. */
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

/** The already-typed batches the append cases combine - one per fetch that landed. */
function batchesOf(records, count = 5) {
    const size = Math.max(1, Math.floor(records.length / count));
    return Array.from({ length: count }, (_, n) => records.slice(n * size, (n + 1) * size));
}

/** Each batch as its own Parquet payload: what the api-server hands the worker, once per fetch. */
async function writePayloads({ DuckFrame, config, records, tmp }, prefix) {
    const payloads = [];
    for (const [n, batch] of batchesOf(records).entries()) {
        const producer = await DuckFrame.fromRecords(config, batch, {});
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
        blurb: 'Building a queryable frame from data, coercion included. This is the api-server\'s'
            + ' job for records, and the worker\'s for Parquet.',
        cases: [
            {
                name: 'from records (+coercion)',
                note: 'Both coerce all 30 fields through the same `coerceToType`.',
                async dataFrame({ DataFrame, config, records }) {
                    return DataFrame.fromJSON(config, records).size;
                },
                async duckFrame({ DuckFrame, config, records }) {
                    const frame = await DuckFrame.fromRecords(config, records, {});
                    const rows = await frame.size();
                    await frame.destroy();
                    return rows;
                },
            },
            {
                name: 'read from the wire',
                note: 'The **worker\'s** ingest leg, and the other half of `serialize for the'
                    + ' wire`: `DataFrame.deserialize` of a dfjson payload against `fromParquet`'
                    + ' of a Parquet+zstd one. Each side reads its OWN wire format, because'
                    + ' `DataFrame` cannot read Parquet at all and `DuckFrame` has no dfjson -'
                    + ' which is precisely the choice being compared. Parquet is typed and'
                    + ' schema-carrying, so this leg does **zero coercion**.'
                    + '\n\n**Forced with `materialize()`, and that is not optional.**'
                    + ' `fromParquet` is relation-backed - nothing is read until something asks'
                    + ' for rows - and `size()` on its own is answered from the Parquet footer\'s'
                    + ' row-group counts in under a millisecond, which measures no ingest at all.'
                    + ' An earlier version of this case did exactly that and reported a'
                    + ' meaningless 5,939x.'
                    + '\n\n`serializeIterator`/`deserializeIterator`, **not**'
                    + ' `serialize`/`deserialize`: the latter pair joins every column into ONE'
                    + ' string and its own docstring caps the whole frame at 1 GB, which this'
                    + ' corpus exceeds at 1M rows - the setup died with `Invalid string length`.'
                    + ' The iterator pair caps at 1 GB **per column**, so it is both what a real'
                    + ' implementation would use at this scale and the fairer comparison.',
                async setupDataFrame({ DataFrame, config, records }) {
                    return { wire: [...DataFrame.fromJSON(config, records).serializeIterator()] };
                },
                async dataFrame({ DataFrame }, { wire }) {
                    const frame = await DataFrame.deserializeIterator(wire);
                    return frame.size;
                },
                async duckFrame({ DuckFrame, config, parquet }) {
                    const frame = await DuckFrame.fromParquet(config, parquet);
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
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    let bytes = 0;

                    // consumed, not just created: it is a generator, so leaving it unread would
                    // serialize nothing at all
                    for (const chunk of df.serializeIterator()) bytes += chunk.length;
                    return bytes > 0 ? df.size : 0;
                },
                async duckFrame({ tmp }, { duck }) {
                    await duck.writeParquet(tmp('serialize'));
                    return duck.size();
                },
                teardownDuckFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Transforms and validations',
        blurb: 'The 205 QPL functions. Both engines drive the SAME `FunctionDefinitionConfig`'
            + ' through their own adapter - `dataFrameAdapter` builds a new column, '
            + '`duckFrameAdapter` returns a SQL expression backed by a vectorized UDF.',
        cases: [
            {
                name: 'transform (toUpperCase)',
                note: 'One Keyword column uppercased, all 30 columns projected through. '
                    + '**`DataFrame` shares data structurally.** It is immutable and columnar, so this'
                    + ' returns a new frame REFERENCING the existing column vectors -'
                    + ' almost no data moves, while `DuckFrame` physically'
                    + ' materialises a new result. The two do different amounts of'
                    + ' work: the comparison is of semantics, not equal labour, and'
                    + ' the deferred cost reappears when the data is read.'
                    + ' Here `DataFrame` swaps ONE column and reuses the other 29, while'
                    + ' `DuckFrame` writes all 30 - see the composed pipeline case for'
                    + ' where that stops being an advantage.',
                setupDataFrame: dfFrame,
                async setupDuckFrame(ctx) {
                    const {
                        DuckFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.toUpperCase, {
                        field: 'category',
                        inputConfig: { field_config: config.fields.category },
                    });
                    return {
                        duck: await DuckFrame.fromRecords(config, records, {}),
                        expression: adapted.expression,
                        output: adapted.outputConfig.field_config,
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df }) {
                    return dfAdapter(repo.toUpperCase, { field: 'category' }).frame(df).size;
                },
                async duckFrame({ config }, { duck, expression, output }) {
                    return force(
                        duck.select(
                            passthrough({ category: expression }),
                            outputConfig(config, 'category', output)
                        ),
                        'table'
                    );
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'validation (isIP)',
                note: 'A failing value is NULLed and the row kept, on both sides.',
                setupDataFrame: dfFrame,
                async setupDuckFrame(ctx) {
                    const {
                        DuckFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.isIP, {
                        field: 'ip',
                        inputConfig: { field_config: config.fields.ip },
                    });
                    return {
                        duck: await DuckFrame.fromRecords(config, records, {}),
                        expression: adapted.expression,
                        output: adapted.outputConfig.field_config,
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df }) {
                    return dfAdapter(repo.isIP, { field: 'ip' }).frame(df).size;
                },
                async duckFrame({ config }, { duck, expression, output }) {
                    return force(
                        duck.select(
                            passthrough({ ip: expression }),
                            outputConfig(config, 'ip', output)
                        ),
                        'table'
                    );
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'transform (array column)',
                note: 'The same `toUpperCase`, but over `tags` - a Keyword **array**. Both'
                    + ' adapters take a separate path for `ProcessMode.INDIVIDUAL_VALUES`:'
                    + ' `DataFrame` walks the list inside each row, `duckFrameAdapter` emits'
                    + ' `list_transform(col, x -> udf(x))`. Seven of the 30 columns are arrays'
                    + ' and no other case exercised that path.',
                setupDataFrame: dfFrame,
                async setupDuckFrame(ctx) {
                    const {
                        DuckFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.toUpperCase, {
                        field: 'tags',
                        inputConfig: { field_config: config.fields.tags },
                    });
                    return {
                        duck: await DuckFrame.fromRecords(config, records, {}),
                        expression: adapted.expression,
                        output: adapted.outputConfig.field_config,
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df }) {
                    return dfAdapter(repo.toUpperCase, { field: 'tags' }).frame(df).size;
                },
                async duckFrame({ config }, { duck, expression, output }) {
                    return force(
                        duck.select(
                            passthrough({ tags: expression }),
                            outputConfig(config, 'tags', output)
                        ),
                        'table'
                    );
                },
                teardownDuckFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Composed pipelines',
        blurb: 'The case that separates the two models. A QPL query applies SEVERAL functions and'
            + ' then filters. `DataFrame` makes one materialising pass per function, because each'
            + ' adapter returns a new frame. `DuckFrame` composes them into ONE statement that'
            + ' DuckDB evaluates in a single pass - which is the whole argument for the change.',
        cases: [
            {
                name: '5 transforms + filter',
                note: 'Five field transforms chained, then a filter. `DataFrame`: five passes,'
                    + ' each building a new column, then a search. `DuckFrame`: one `SELECT` with'
                    + ' five expressions and a `WHERE`, evaluated once.',
                setupDataFrame: dfFrame,
                async setupDuckFrame(ctx) {
                    const {
                        DuckFrame, config, records, repo, duckAdapter
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
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df }) {
                    let frame = df;
                    for (const [fn, field] of STEPS) {
                        frame = dfAdapter(repo[fn], { field }).frame(frame);
                    }
                    return frame.search('active:true').size;
                },
                async duckFrame(ctx, { duck, expressions, outConfig }) {
                    return force(
                        duck.select(passthrough(expressions), outConfig)
                            .filter('"active" = true'),
                        'table'
                    );
                },
                teardownDuckFrame: destroyDuck,
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
                    + ' SQL for `DuckFrame`. Forced with `count(*)` - the question is how fast'
                    + ' the rows are found.',
                setupDataFrame: dfFrame,
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.search('category:alpha').size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck.filter('"category" = \'alpha\''), 'count');
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'sort (2 keys)',
                note: 'Forced with `materialize()`, never `count(*)` - a count lets the'
                    + ' optimiser drop the ORDER BY and would measure nothing.',
                setupDataFrame: dfFrame,
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.orderBy('category:asc', 'count:desc').size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(
                        duck.orderBy(['"category"', { expression: '"count"', direction: 'desc' }]),
                        'table'
                    );
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'sort + limit (top 1,000)',
                note: 'The shape a real search request has - `params.sort` plus `size`'
                    + ' (`v3/execute/search/fetch-from-frame.ts`), which neither the sort case'
                    + ' nor the page case measures on its own. `DataFrame` sorts EVERY row and'
                    + ' then slices; DuckDB plans it as `TOP_N` - a heap of 1,000 plus a dynamic'
                    + ' filter that skips row groups - so the gap should widen with scale.'
                    + ' Forced with `materialize()`, never a count.',
                setupDataFrame: dfFrame,
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.orderBy('category:asc', 'count:desc').limit(1000).size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(
                        duck.orderBy(['"category"', { expression: '"count"', direction: 'desc' }])
                            .limit(1000),
                        'table'
                    );
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'dedup (all columns)',
                note: '`DataFrame.unique(every field)` vs `SELECT DISTINCT *`.',
                setupDataFrame: dfFrame,
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.unique(df.fields).size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck.distinct(), 'table');
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'page (limit 1,000)',
                note: '**`DataFrame` shares data structurally.** It is immutable and columnar, so this'
                    + ' returns a new frame REFERENCING the existing column vectors -'
                    + ' almost no data moves, while `DuckFrame` physically'
                    + ' materialises a new result. The two do different amounts of'
                    + ' work: the comparison is of semantics, not equal labour, and'
                    + ' the deferred cost reappears when the data is read.'
                    + ' `DataFrame.limit` is a `slice` view over the same vectors.',
                setupDataFrame: dfFrame,
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    return df.limit(1000).size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck.limit(1000), 'table');
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'output all rows to JS',
                note: 'The response path: every row converted back to plain JS objects.',
                setupDataFrame: dfFrame,
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    let seen = 0;

                    for (const _row of df.toJSON()) seen++;
                    return seen;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck, 'rows');
                },
                teardownDuckFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Output to ldjson',
        blurb: 'What production actually does with a finished result: write **ldjson** to S3, one'
            + ' JSON object per line. `DataFrame` has to build every row as a JS object and'
            + ' `JSON.stringify` it; `DuckFrame` renders each line in C++ inside the query, so'
            + ' the rows never become JS values at all.'
            + '\n\n**The bytes are identical** - all 500 sampled lines of this corpus, checked'
            + ' against `DataFrame` itself. DuckDB\'s native JSON is not `DataFrame`\'s: it'
            + ' writes `2026-01-10 00:00:00` for a Date, a bare number for a `Long` past'
            + ' `MAX_SAFE_INTEGER` that `JSON.parse` rounds, `"f": null` where `DataFrame` omits'
            + ' the key, `5.0` for an integral float, and a bare `Infinity` that is not valid'
            + ' JSON at all. The export projection corrects every one of them in SQL before'
            + ' anything is written, pinned in `test/duck-frame/export-json-spec.ts`. That'
            + ' correction is measured: it costs 7% of the projection.'
            + '\n\nBoth sides use spaces\' own `remove_null_fields: true` default.',
        cases: [
            {
                name: 'ldjson to a file',
                note: 'The whole result to one file. Each side writes it the way it can:'
                    + ' `DataFrame.toJSON` then `JSON.stringify` per row, batched into 1 MB'
                    + ' writes so the measurement is not one syscall per row, against'
                    + ' `writeNDJSON`, which is a single `COPY`. Note that `toJSON` builds an'
                    + ' array of every row first - that materialisation is part of the cost, and'
                    + ' is why this is where `DataFrame` runs out of heap.',
                async setupDataFrame({
                    DataFrame, config, records, tmp
                }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        dfFile: tmp('ldjson-df', 'ldjson'),
                    };
                },
                async setupDuckFrame({
                    DuckFrame, config, records, tmp
                }) {
                    return {
                        duck: await DuckFrame.fromRecords(config, records, {}),
                        duckFile: tmp('ldjson-duck', 'ldjson'),
                    };
                },
                async dataFrame(ctx, { df, dfFile }) {
                    return writeLdjsonFromJS(dfFile, df.toJSON(TO_JSON_OPTIONS));
                },
                async duckFrame(ctx, { duck, duckFile }) {
                    await duck.writeNDJSON(duckFile);
                    return duck.size();
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'ldjson streamed',
                note: 'The same lines, never held all at once - what the worker needs when the'
                    + ' table is already most of its 64 GB. `ndjson()` yields one rendered line'
                    + ' at a time, so JavaScript only moves bytes. Byte-identical to the file'
                    + ' path; the only question is throughput.',
                setupDataFrame: dfFrame,
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    let lines = 0;
                    let bytes = 0;

                    for (const row of df.toJSON(TO_JSON_OPTIONS)) {
                        bytes += JSON.stringify(row).length;
                        lines++;
                    }
                    // `bytes` is what a caller would flush; the row count is what the harness
                    // compares, so returning it only once bytes exist keeps both honest
                    return bytes > 0 ? lines : 0;
                },
                async duckFrame(ctx, { duck }) {
                    let lines = 0;
                    let bytes = 0;

                    for await (const line of duck.ndjson()) {
                        bytes += line.length;
                        lines++;
                    }
                    return bytes > 0 ? lines : 0;
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'transform + filter -> ldjson',
                note: 'The whole response path in one case, which is the argument the other'
                    + ' cases only make in pieces: transform a field, filter, and emit ldjson.'
                    + ' `DataFrame` makes a pass per step and then converts every surviving row'
                    + ' to JS; for `DuckFrame` the transform, the filter and the JSON rendering'
                    + ' are ONE statement, so no intermediate result is ever built.',
                setupDataFrame: dfFrame,
                async setupDuckFrame(ctx) {
                    const {
                        DuckFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.toUpperCase, {
                        field: 'category',
                        inputConfig: { field_config: config.fields.category },
                    });
                    return {
                        duck: await DuckFrame.fromRecords(config, records, {}),
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
                async duckFrame({ config }, { duck, expression, output }) {
                    const projected = duck
                        .select(
                            passthrough({ category: expression }),
                            outputConfig(config, 'category', output)
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
                teardownDuckFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Aggregations',
        blurb: 'Grouped and global aggregation. For `DuckFrame` this is just a projection with a'
            + ' `GROUP BY`, so it composes with everything else in one statement.',
        cases: [
            {
                name: 'group by 1 key + sum',
                note: '5 groups out. Forced with `rows` on both sides, since both produce a small'
                    + ' materialised result.',
                setupDataFrame: dfFrame,
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    const out = await df.aggregate().groupBy('category')
                        .sum('count')
                        .run();
                    return out.size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck.select(
                        { category: '"category"', total: 'sum("count")' },
                        {
                            version: 1,
                            fields: { category: { type: 'Keyword' }, total: { type: 'Long' } },
                        },
                        ['"category"']
                    ), 'rows');
                },
                teardownDuckFrame: destroyDuck,
            },
            {
                name: 'group by 2 keys + 3 aggs',
                note: '20 groups, three aggregate functions at once.',
                setupDataFrame: dfFrame,
                setupDuckFrame: duckTable,
                async dataFrame(ctx, { df }) {
                    const out = await df.aggregate()
                        .groupBy('category', 'status')
                        .sum('count')
                        .avg('score')
                        .max('age')
                        .run();
                    return out.size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck.select(
                        {
                            category: '"category"',
                            status: '"status"',
                            total: 'sum("count")',
                            mean: 'avg("score")',
                            oldest: 'max("age")',
                        },
                        {
                            version: 1,
                            fields: {
                                category: { type: 'Keyword' },
                                status: { type: 'Keyword' },
                                total: { type: 'Long' },
                                mean: { type: 'Double' },
                                oldest: { type: 'Short' },
                            },
                        },
                        ['"category"', '"status"']
                    ), 'rows');
                },
                teardownDuckFrame: destroyDuck,
            },
        ],
    },

    {
        title: 'Appending batches',
        blurb: 'Combining several already-typed batches into ONE frame - what the worker does as'
            + ' its fetches land. Coercion is excluded: the batches are prepared in setup.',
        cases: [
            {
                name: 'combine 5 batches',
                note: '`DataFrame.appendAll` over 5 prebuilt frames vs 5'
                    + ' `append({ parquet })` calls into one table. '
                    + '**`DataFrame` shares data structurally.** It is immutable and columnar, so this'
                    + ' returns a new frame REFERENCING the existing column vectors -'
                    + ' almost no data moves, while `DuckFrame` physically'
                    + ' materialises a new result. The two do different amounts of'
                    + ' work: the comparison is of semantics, not equal labour, and'
                    + ' the deferred cost reappears when the data is read.'
                    + ' `appendAll` only recomputes offsets - its own doc says the cost is'
                    + ' relatively low - whereas `DuckFrame` inserts the rows into a real'
                    + ' table that is queryable with no further cost.',
                async setupDataFrame({ DataFrame, config, records }) {
                    return {
                        frames: batchesOf(records).map((batch) => (
                            DataFrame.fromJSON(config, batch)
                        )),
                    };
                },
                setupDuckFrame: (ctx) => writePayloads(ctx, 'batch'),
                async dataFrame({ DataFrame, config }, { frames }) {
                    return DataFrame.fromJSON(config, []).appendAll(frames).size;
                },
                async duckFrame({ DuckFrame, config }, { payloads }) {
                    const frame = await DuckFrame.create(config, {});
                    for (const path of payloads) await frame.append({ parquet: path });
                    const rows = await frame.size();
                    await frame.destroy();
                    return rows;
                },
            },
            {
                name: 'combine 5 batches, concurrent',
                note: 'DuckFrame only: the fetches land at once. `DataFrame` has no concurrent'
                    + ' append - `appendAll` is one synchronous pass.',
                setupDuckFrame: (ctx) => writePayloads(ctx, 'cbatch'),
                async dataFrame() {
                    return SKIPPED;
                },
                async duckFrame({ DuckFrame, config }, { payloads }) {
                    const frame = await DuckFrame.create(config, {});
                    await Promise.all(payloads.map((path) => frame.append({ parquet: path })));
                    const rows = await frame.size();
                    await frame.destroy();
                    return rows;
                },
            },
            {
                name: 'combine 5 batches, one append',
                note: 'DuckFrame only, and the fastest of the three. `append({ parquet })` takes'
                    + ' a LIST of paths, which `read_parquet` reads as ONE relation - so all five'
                    + ' payloads land in a single `INSERT ... BY NAME` rather than five.'
                    + ' `tools/bench/append-ingest.mjs` measures this at ~4x a sequential loop'
                    + ' over 20 payloads at 1M rows.'
                    + '\n\nThe trade is real rather than free: it needs every payload to have'
                    + ' ARRIVED, so it suits a worker that batches what has landed, while the'
                    + ' concurrent case above suits one ingesting each fetch as it completes.',
                setupDuckFrame: (ctx) => writePayloads(ctx, 'obatch'),
                async dataFrame() {
                    return SKIPPED;
                },
                async duckFrame({ DuckFrame, config }, { payloads }) {
                    const frame = await DuckFrame.create(config, {});
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
        blurb: '**`DataFrame` has no join primitive at all** - which is the reason this project'
            + ' exists. Today spaces emulates one by issuing a child search per parent row,'
            + ' cached in a 10,000-entry LRU that high cardinality defeats. For `DuckFrame` a'
            + ' join is ordinary SQL over two tables.',
        cases: [
            {
                name: 'inner join, 5 children per parent',
                note: 'A child table keyed so each parent matches **5** children - the fan-out'
                    + ' a real join has. Forced with `count(*)`.',
                async setupDuckFrame({ DuckFrame, config, records }) {
                    return {
                        parent: await DuckFrame.fromRecords(config, records, {}),
                        child: await DuckFrame.fromRecords(config, childRecords(records), {}),
                    };
                },
                async dataFrame() {
                    return SKIPPED;
                },
                async duckFrame(ctx, { parent, child }) {
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
                async teardownDuckFrame(ctx, { parent, child }) {
                    await parent.destroy();
                    await child.destroy();
                },
            },
            {
                name: 'join + count per parent',
                note: 'Per-parent counts in ONE statement - the shape the per-row fanout is'
                    + ' faking today. Grouped by the parent key, NOT by a low-cardinality field:'
                    + ' joining two 100k tables on a 5-value column is a 2-billion-row cartesian'
                    + ' product, which measures an explosion rather than a join.',
                async setupDuckFrame({ DuckFrame, config, records }) {
                    return {
                        parent: await DuckFrame.fromRecords(config, records, {}),
                        child: await DuckFrame.fromRecords(config, childRecords(records), {}),
                    };
                },
                async dataFrame() {
                    return SKIPPED;
                },
                async duckFrame(ctx, { parent, child }) {
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
                async teardownDuckFrame(ctx, { parent, child }) {
                    await parent.destroy();
                    await child.destroy();
                },
            },
        ],
    },
];
