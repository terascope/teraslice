/**
 * STEP 3 — the timed query battery.
 *
 * Runs every applicable shape from `lib/queries.mjs` against the Parquet objects
 * in the bucket, reporting the MEDIAN of REPEATS runs after a discarded warmup.
 *
 * **Read the spread, not just the median.** A cell whose max is many times its
 * min is not a measurement, it is a warning that something else was moving —
 * a cold cache, a busy cluster, another tenant on the Ceph node.
 *
 * **The battery total is not a summary.** One shape usually dominates it. The
 * per-shape rows are the finding; the total is there only to be decomposed.
 */
import { s3Glob, config } from '../lib/env.mjs';
import { open, measureQuery } from '../lib/duck.mjs';
import { buildBattery } from '../lib/queries.mjs';
import {
    heading, note, table, ms, num, bytes, save, explain
} from '../lib/report.mjs';

const session = await open();
const glob = s3Glob();
const T = `read_parquet('${glob}')`;

try {
    heading('PROFILING THE CORPUS (to choose the battery columns)');

    /*
     * The battery is built from the corpus, not assumed. Cardinality decides
     * which column is a sane GROUP BY key and which is a punishing one, and it
     * is sampled rather than counted exactly — an exact distinct count on a
     * huge remote column would cost more than the battery it configures.
     */
    const schema = await session.rows(`DESCRIBE SELECT * FROM ${T}`);
    const sampleRows = 100_000;
    const columns = [];

    for (const [name, type] of schema) {
        let approxDistinct = null;
        try {
            approxDistinct = Number(await session.one(
                `SELECT approx_count_distinct("${String(name).replace(/"/g, '""')}")
                 FROM (SELECT * FROM ${T} LIMIT ${sampleRows})`
            ));
        } catch { /* unsupported type for approx counting; leave it unclassified */ }
        columns.push({
            name,
            type,
            approxDistinct,
            lowCardinality: approxDistinct !== null && approxDistinct > 1 && approxDistinct <= 1000,
            highCardinality: approxDistinct !== null && approxDistinct > 10_000,
        });
    }

    const classified = columns.filter((c) => c.approxDistinct !== null);
    table(
        ['column', 'type', `approx distinct (in ${num(sampleRows)})`, 'role'],
        classified.slice(0, 20).map((c) => [
            c.name,
            c.type,
            num(c.approxDistinct),
            c.lowCardinality ? 'group key' : c.highCardinality ? 'high-card key' : '',
        ])
    );
    if (classified.length > 20) note(`… and ${num(classified.length - 20)} more columns`);

    const battery = buildBattery(columns);

    heading(`BATTERY — ${battery.length} shapes, median of ${config.repeats} after a warmup`);
    note(`reading ${glob}`);
    note(`caches: ${Object.entries(config.caches).filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ') || 'ALL OFF'}`);
    note(`memory_limit ${config.memoryLimit}, threads ${config.threads || 'all cores'}`);
    note('');

    const results = [];
    for (const shape of battery) {
        const sql = shape.sql.replaceAll('{{T}}', T);
        try {
            const m = await measureQuery(session, sql, config.repeats);
            results.push({
                key: shape.key,
                label: shape.label,
                median: m.median,
                min: m.min,
                max: m.max,
                bytes: m.coldBytes,
                note: shape.note,
                sql,
            });
        } catch (err) {
            const message = String(err.message).split('\n')[0];
            results.push({
                key: shape.key,
                label: shape.label,
                failed: message,
                note: shape.note,
                sql,
                dangerous: shape.dangerous,
            });
            // A failing wide top-N is the DOCUMENTED cliff, not a broken harness.
            if (shape.dangerous) {
                note(`${shape.label}: FAILED — ${message}`);
                note('   This is the expected memory cliff, not a harness fault. See the summary.');
            }
        }
    }

    const ok = results.filter((r) => !r.failed);
    table(
        ['shape', 'median', 'min', 'max', 'bytes (1st run)'],
        results.map((r) => (r.failed
            ? [r.label, 'FAILED', '', '', '']
            : [r.label, ms(r.median), ms(r.min), ms(r.max), bytes(r.bytes)]))
    );

    heading('WHAT EACH SHAPE MEANS');
    for (const r of results) note(`${r.label}\n     ${r.note}`);

    heading('DISTRIBUTION — the total is not a summary');
    const total = ok.reduce((a, r) => a + r.median, 0);
    const sorted = [...ok].sort((a, b) => b.median - a.median);
    note(`battery total: ${ms(total)} across ${ok.length} shapes`);
    if (sorted.length) {
        const top = sorted[0];
        note(`slowest shape: ${top.label} at ${ms(top.median)} — `
            + `${((top.median / total) * 100).toFixed(0)}% of the total`);
        note('');
        note('If one shape is most of the total, any "battery improved by X%" claim is');
        note('really a claim about that one shape. Decompose before quoting a number.');
    }

    const cliff = results.find((r) => r.dangerous && r.failed);
    if (cliff) {
        heading('THE MEMORY CLIFF WAS HIT');
        note(`${cliff.label} failed: ${cliff.failed}`);
        note('');
        note('This shape needs threads x row_group_size x columns_projected, and it is');
        note('INDEPENDENT of dataset size — the same threshold appears at 10M and 100M rows.');
        note('It fails outright rather than degrading, because a Parquet scan has no');
        note('evictable page cache to give back the way a native table does.');
        note('');
        note('Three fixes, in order of preference:');
        note('  1. Never emit SELECT * — project the columns actually needed.');
        note(`  2. Cap threads (THREADS=4 in ${config.memoryLimit} is usually enough).`);
        note('  3. Budget ~1 GiB per concurrent wide query.');
        note('');
        note('Re-run with:  THREADS=4 ./run.sh battery');
    }

    save('battery', {
        table: T,
        columnsProfiled: columns,
        results,
        batteryTotalMs: total,
    });

    heading('NEXT');
    note('./run.sh caches   — the three httpfs caches ON vs OFF, with bytes moved');
} catch (err) {
    explain(err);
    process.exit(1);
} finally {
    session.close();
}
