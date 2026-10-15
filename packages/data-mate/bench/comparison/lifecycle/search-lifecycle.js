/**
 * Times a whole search request, end to end, on DataFrame and on TealFrame.
 *
 * Unlike the cases in `lib/cases.js`, which time single operations, this times the pipeline a
 * search runs across two processes:
 *
 *   API process      search results -> records -> a frame -> a wire payload
 *   worker process   many payloads -> one frame -> filter, aggregate, sort -> output
 *
 * With DataFrame, the API process builds a `DataFrame` and `serialize()`s it to dfjson; the worker
 * `deserialize`s each payload, `appendAll`s them, and runs the query in JS. With TealFrame, the
 * API process writes Parquet+zstd; the worker `append`s the payloads into one table and runs the
 * query as one SQL statement.
 *
 * Both legs do the same work and their row counts are compared. The search itself is not
 * simulated: it costs the same either way and would only dilute the comparison.
*/

/** Payloads per query, i.e. how many fetches the worker is assembling. */
const PAYLOADS = Number(process.env.PAYLOADS || 5);

export async function lifecycle(ctx) {
    const {
        DataFrame, TealFrame, config, makeRecords, SCALES, tmp, measure, label, line, heading,
        runsFor,
    } = ctx;

    /**
     * Uses the same per-scale sample count as the cases, so the largest scales take one sample
     * instead of repeatedly serializing a corpus that can exhaust the heap.
    */
    const samples = (scale) => ({ runs: runsFor(scale) });

    heading(`Search lifecycle: DataFrame + dfjson vs TealFrame + Parquet`);
    line(`  ${PAYLOADS} payloads per query, assembled then queried\n`);
    line(`  ${'scale'.padEnd(8)}${'stage'.padEnd(30)}${'DataFrame'.padStart(12)}${'TealFrame'.padStart(12)}`);

    const results = [];

    for (const scale of SCALES) {
        const per = Math.max(1, Math.floor(scale / PAYLOADS));
        const batches = Array.from({ length: PAYLOADS }, (_unused, n) => makeRecords(per, n + 1));

        // ---------------------------------------------------- PRODUCER
        // API process: records -> frame -> wire format. Timed as one stage because together
        // they are the cost of one search response.
        const producerToday = await measure(async () => {
            let bytes = 0;
            for (const batch of batches) {
                bytes += DataFrame.fromJSON(config, batch).serialize().length;
            }
            return bytes;
        }, samples(scale));

        let payloads = [];
        const producerDuck = await measure(async () => {
            payloads = [];
            for (const [n, batch] of batches.entries()) {
                const frame = await TealFrame.fromRecords(config, batch, {});
                const file = tmp(`lc-${scale}-${n}`);
                await frame.writeParquet(file);
                await frame.destroy();
                payloads.push(file);
            }
            return payloads.length;
        }, samples(scale));

        // ---------------------------------------------------- WORKER: assemble
        // DataFrame deserializes every payload and appends them; TealFrame inserts the Parquet
        // payloads into one table with no type coercion.
        const wire = batches.map((batch) => DataFrame.fromJSON(config, batch).serialize());

        const assembleToday = await measure(async () => {
            const frames = await Promise.all(wire.map((buf) => DataFrame.deserialize(buf)));
            return DataFrame.fromJSON(config, []).appendAll(frames).size;
        }, samples(scale));

        const assembleDuck = await measure(async () => {
            const frame = await TealFrame.create(config, {});
            await Promise.all(payloads.map((file) => frame.append({ parquet: file })));
            const rows = await frame.size();
            await frame.destroy();
            return rows;
        }, samples(scale));

        // ---------------------------------------------------- WORKER: query
        // filter -> aggregate -> sort, then read the result. TealFrame runs one statement;
        // DataFrame makes three passes, each building a new frame.
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
        }, samples(scale));

        const assembledDuck = await (async () => {
            const frame = await TealFrame.create(config, {});
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
                        config: {
                            version: 1,
                            fields: {
                                category: { type: 'Keyword' },
                                status: { type: 'Keyword' },
                                total: { type: 'Long' },
                                mean: { type: 'Double' },
                            },
                        },
                        groupBy: ['"category"', '"status"'],
                    }
                )
                .orderBy([{ expression: '"category"' }]);

            let seen = 0;

            for await (const _row of aggregated.rows()) seen++;
            return seen;
        }, samples(scale));

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
