/**
 * The side-by-side cases: the same work, asked of both engines.
 *
 * **Each case states what it encapsulates**, because that is the part a benchmark gets wrong.
 * The rules applied throughout:
 *
 * - `setup` is NOT timed. Anything a case needs to already exist - a built frame, a written
 *   Parquet payload - is made there, so the measurement covers only the operation named.
 * - A case returns the row count it produced. The runner compares the two engines' counts and
 *   flags a mismatch, so "faster" can never mean "did less".
 * - `DuckFrame` is lazy, so every DuckFrame case ends in `force(...)`, and the forcing method is
 *   chosen per case: `count` for a filter (find the rows), `table` for anything that must yield a
 *   usable frame, `rows` where the DataFrame side also hands back materialised JS values.
 * - Where an engine genuinely has no equivalent, the case returns `SKIPPED` rather than being
 *   quietly bent into something comparable.
*/
import { SKIPPED, force } from './harness.js';
import { COLUMNS } from './generate.js';

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
                name: 'from Parquet',
                note: '`DataFrame` cannot read Parquet at all. For DuckFrame this is the worker'
                    + ' path: typed, schema-carrying, so **zero coercion**.',
                async dataFrame() {
                    return SKIPPED;
                },
                async duckFrame({ DuckFrame, config, parquet }) {
                    const frame = await DuckFrame.fromParquet(config, parquet);
                    return force(frame, 'table');
                },
            },
            {
                name: 'serialize for the wire',
                note: 'What each engine hands the network: `DataFrame.serialize()` produces'
                    + ' dfjson, `writeParquet` produces Parquet+zstd.',
                async setup({ DataFrame, DuckFrame, config, records }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
                async dataFrame(ctx, { df }) {
                    df.serialize();
                    return df.size;
                },
                async duckFrame({ tmp }, { duck }) {
                    await duck.writeParquet(tmp('serialize'));
                    return duck.size();
                },
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
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
                async setup(ctx) {
                    const {
                        DataFrame, DuckFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.toUpperCase, {
                        field: 'category',
                        inputConfig: { field_config: config.fields.category },
                    });
                    return {
                        df: DataFrame.fromJSON(config, records),
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
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
            },
            {
                name: 'validation (isIP)',
                note: 'A failing value is NULLed and the row kept, on both sides.',
                async setup(ctx) {
                    const {
                        DataFrame, DuckFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const adapted = await duckAdapter(repo.isIP, {
                        field: 'ip',
                        inputConfig: { field_config: config.fields.ip },
                    });
                    return {
                        df: DataFrame.fromJSON(config, records),
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
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
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
                async setup(ctx) {
                    const {
                        DataFrame, DuckFrame, config, records, repo, duckAdapter
                    } = ctx;
                    const steps = [
                        ['toUpperCase', 'category'],
                        ['toLowerCase', 'status'],
                        ['trim', 'name'],
                        ['toUpperCase', 'email'],
                        ['trim', 'description'],
                    ];

                    const expressions = {};
                    const fields = { ...config.fields };
                    for (const [fn, field] of steps) {
                        const adapted = await duckAdapter(repo[fn], {
                            field,
                            inputConfig: { field_config: config.fields[field] },
                        });
                        expressions[field] = adapted.expression;
                        fields[field] = adapted.outputConfig.field_config;
                    }

                    return {
                        steps,
                        expressions,
                        outConfig: { version: 1, fields },
                        df: DataFrame.fromJSON(config, records),
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
                async dataFrame({ repo, dfAdapter }, { df, steps }) {
                    let frame = df;
                    for (const [fn, field] of steps) {
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
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
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
                async setup({ DataFrame, DuckFrame, config, records }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
                async dataFrame(ctx, { df }) {
                    return df.search('category:alpha').size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck.filter('"category" = \'alpha\''), 'count');
                },
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
            },
            {
                name: 'sort (2 keys)',
                note: 'Forced with `materialize()`, never `count(*)` - a count lets the'
                    + ' optimiser drop the ORDER BY and would measure nothing.',
                async setup({ DataFrame, DuckFrame, config, records }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
                async dataFrame(ctx, { df }) {
                    return df.orderBy('category:asc', 'count:desc').size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(
                        duck.orderBy(['"category"', { expression: '"count"', direction: 'desc' }]),
                        'table'
                    );
                },
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
            },
            {
                name: 'dedup (all columns)',
                note: '`DataFrame.unique(every field)` vs `SELECT DISTINCT *`.',
                async setup({ DataFrame, DuckFrame, config, records }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
                async dataFrame(ctx, { df }) {
                    return df.unique(df.fields).size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck.distinct(), 'table');
                },
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
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
                async setup({ DataFrame, DuckFrame, config, records }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
                async dataFrame(ctx, { df }) {
                    return df.limit(1000).size;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck.limit(1000), 'table');
                },
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
            },
            {
                name: 'output all rows to JS',
                note: 'The response path: every row converted back to plain JS objects.',
                async setup({ DataFrame, DuckFrame, config, records }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
                async dataFrame(ctx, { df }) {
                    let seen = 0;

                    for (const _row of df.toJSON()) seen++;
                    return seen;
                },
                async duckFrame(ctx, { duck }) {
                    return force(duck, 'rows');
                },
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
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
                async setup({ DataFrame, DuckFrame, config, records }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
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
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
            },
            {
                name: 'group by 2 keys + 3 aggs',
                note: '20 groups, three aggregate functions at once.',
                async setup({ DataFrame, DuckFrame, config, records }) {
                    return {
                        df: DataFrame.fromJSON(config, records),
                        duck: await DuckFrame.fromRecords(config, records, {}),
                    };
                },
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
                async teardown(ctx, { duck }) {
                    await duck.destroy();
                },
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
                async setup({
                    DataFrame, DuckFrame, config, records, tmp
                }) {
                    const size = Math.max(1, Math.floor(records.length / 5));
                    const batches = [0, 1, 2, 3, 4].map((n) => (
                        records.slice(n * size, (n + 1) * size)
                    ));

                    const frames = batches.map((batch) => DataFrame.fromJSON(config, batch));
                    const payloads = [];
                    for (const [n, batch] of batches.entries()) {
                        const producer = await DuckFrame.fromRecords(config, batch, {});
                        const path = tmp(`batch-${n}`);
                        await producer.writeParquet(path);
                        await producer.destroy();
                        payloads.push(path);
                    }

                    return { frames, payloads };
                },
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
                async setup({ DuckFrame, config, records, tmp }) {
                    const size = Math.max(1, Math.floor(records.length / 5));
                    const payloads = [];
                    for (let n = 0; n < 5; n++) {
                        const batch = records.slice(n * size, (n + 1) * size);
                        const producer = await DuckFrame.fromRecords(config, batch, {});
                        const path = tmp(`cbatch-${n}`);
                        await producer.writeParquet(path);
                        await producer.destroy();
                        payloads.push(path);
                    }
                    return { payloads };
                },
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
                async setup({ DuckFrame, config, records }) {
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
                async teardown(ctx, { parent, child }) {
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
                async setup({ DuckFrame, config, records }) {
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
                async teardown(ctx, { parent, child }) {
                    await parent.destroy();
                    await child.destroy();
                },
            },
        ],
    },
];
