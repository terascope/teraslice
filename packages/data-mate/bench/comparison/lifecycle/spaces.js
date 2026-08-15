/**
 * The spaces query lifecycle, end to end, as it runs today versus on DuckFrame.
 *
 * This is the only section that measures the SYSTEM rather than an operation, and it is the one
 * that answers "what would change if we switched". The flow is docs/HANDOFF.md §0.0:
 *
 *   qpl-search-api   Elasticsearch -> RECORDS -> a frame -> something on the wire
 *   qpl-worker       many payloads -> ONE table -> filter, transform, aggregate, sort -> output
 *
 * **Today** the api-server builds a `DataFrame` and `serialize()`s it to dfjson; the worker
 * `deserialize`s each payload, `appendAll`s them, and runs the query in JS.
 * **On DuckFrame** the api-server writes Parquet+zstd; the worker `append`s the payloads into one
 * table and the whole query is one SQL statement.
 *
 * Both legs do the same five things and are checked against each other's row counts. The fetch
 * itself is not simulated - no network, no Elasticsearch - because that cost is identical either
 * way and would only dilute the comparison.
*/

/** Payloads per query, i.e. how many fetches the worker is assembling. */
const PAYLOADS = Number(process.env.PAYLOADS || 5);

export async function lifecycle(ctx) {
    const {
        DataFrame, DuckFrame, config, makeRecords, SCALES, tmp, measure, label, line, heading,
    } = ctx;

    heading(`Spaces lifecycle: today (DataFrame + dfjson) vs DuckFrame + Parquet`);
    line(`  ${PAYLOADS} payloads per query, assembled then queried\n`);
    line(`  ${'scale'.padEnd(8)}${'stage'.padEnd(30)}${'today'.padStart(12)}${'DuckFrame'.padStart(12)}`);

    const results = [];

    for (const scale of SCALES) {
        const per = Math.max(1, Math.floor(scale / PAYLOADS));
        const batches = Array.from({ length: PAYLOADS }, (_unused, n) => makeRecords(per, n + 1));

        // ---------------------------------------------------- PRODUCER
        // api-server: records -> frame -> wire format. Timed as one stage because that is what
        // one fetch response costs.
        const producerToday = await measure(async () => {
            let bytes = 0;
            for (const batch of batches) {
                bytes += DataFrame.fromJSON(config, batch).serialize().length;
            }
            return bytes;
        });

        let payloads = [];
        const producerDuck = await measure(async () => {
            payloads = [];
            for (const [n, batch] of batches.entries()) {
                const frame = await DuckFrame.fromRecords(config, batch, {});
                const file = tmp(`lc-${scale}-${n}`);
                await frame.writeParquet(file);
                await frame.destroy();
                payloads.push(file);
            }
            return payloads.length;
        });

        // ---------------------------------------------------- WORKER: assemble
        // Today the worker must deserialize every payload and append them; on DuckFrame it
        // inserts Parquet into one table with no coercion at all.
        const wire = batches.map((batch) => DataFrame.fromJSON(config, batch).serialize());

        const assembleToday = await measure(async () => {
            const frames = await Promise.all(wire.map((buf) => DataFrame.deserialize(buf)));
            return DataFrame.fromJSON(config, []).appendAll(frames).size;
        });

        const assembleDuck = await measure(async () => {
            const frame = await DuckFrame.create(config, {});
            await Promise.all(payloads.map((file) => frame.append({ parquet: file })));
            const rows = await frame.size();
            await frame.destroy();
            return rows;
        });

        // ---------------------------------------------------- WORKER: query
        // filter -> aggregate -> sort, then read the answer. On DuckFrame that is ONE statement;
        // on DataFrame it is three passes, each materialising a new frame.
        const assembledToday = await (async () => {
            try {
                const frames = await Promise.all(wire.map((buf) => DataFrame.deserialize(buf)));
                return DataFrame.fromJSON(config, []).appendAll(frames);
            } catch {
                return null;
            }
        })();

        const queryToday = await measure(async () => {
            if (!assembledToday) throw new Error('heap out of memory');
            const out = await assembledToday
                .search('active:true')
                .aggregate()
                .groupBy('category', 'status')
                .sum('count')
                .avg('score')
                .run();
            return out.orderBy('category:asc').size;
        });

        const assembledDuck = await (async () => {
            const frame = await DuckFrame.create(config, {});
            for (const file of payloads) await frame.append({ parquet: file });
            return frame;
        })();

        const queryDuck = await measure(async () => {
            const aggregated = assembledDuck
                .filter('"active" = true')
                .select(
                    {
                        category: '"category"',
                        status: '"status"',
                        total: 'sum("count")',
                        mean: 'avg("score")',
                    },
                    {
                        version: 1,
                        fields: {
                            category: { type: 'Keyword' },
                            status: { type: 'Keyword' },
                            total: { type: 'Long' },
                            mean: { type: 'Double' },
                        },
                    },
                    ['"category"', '"status"']
                )
                .orderBy(['"category"']);

            let seen = 0;

            for await (const _row of aggregated.rows()) seen++;
            return seen;
        });

        await assembledDuck.destroy();

        for (const [stage, today, duck] of [
            ['producer: records -> wire', producerToday, producerDuck],
            ['worker: assemble payloads', assembleToday, assembleDuck],
            ['worker: filter+agg+sort', queryToday, queryDuck],
        ]) {
            const cell = (r) => (r.note ? r.note : `${r.ms == null ? '-' : `${r.ms.toFixed(0)} ms`}`)
                .padStart(12);
            line(`  ${label(scale).padEnd(8)}${stage.padEnd(30)}${cell(today)}${cell(duck)}`);
            results.push({ scale, stage, today, duck });
        }
    }

    return results;
}
