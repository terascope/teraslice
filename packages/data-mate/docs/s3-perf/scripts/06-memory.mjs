/**
 * STEP 7 — the memory sweep, and the one query shape that FAILS rather than
 * degrading.
 *
 * **The finding this reproduces.** Of fifteen query shapes, exactly one — a
 * wide top-N, `SELECT * ... ORDER BY ... LIMIT n` — needs between 512 MiB and
 * 1 GiB and fails outright below it. The other fourteen are fine down to
 * 128 MiB. The requirement is:
 *
 *     threads x row_group_size x columns_projected
 *
 * and it is INDEPENDENT of dataset size: the same threshold appears at 10M rows
 * and at 100M. A native table survives the same squeeze because it holds an
 * evictable page cache; a Parquet scan caches almost nothing and has nothing to
 * give back.
 *
 * "A Parquet view is fragile under memory pressure" was true and useless.
 * A shape, a threshold and a term it scales with is a capacity line item.
 *
 * **`memory_limit` does NOT bound process RSS.** A Parquet scan was measured at
 * ~5 GB RSS under a 1 GiB limit. This script reports peak RSS alongside, because
 * that is the only honest "will this fit" number.
 */
import { s3Glob, config } from '../lib/env.mjs';
import { open } from '../lib/duck.mjs';
import {
    heading, note, table, ms, num, bytes, save, explain, measure
} from '../lib/report.mjs';

const glob = s3Glob();
const T = `read_parquet('${glob}')`;

const LIMITS = (process.env.LIMITS || '128MiB,256MiB,512MiB,1GiB,2GiB').split(',');
const THREAD_COUNTS = (process.env.THREAD_SWEEP || '').split(',').filter(Boolean)
    .map(Number);

try {
    const probe = await open();
    const schema = await probe.rows(`DESCRIBE SELECT * FROM ${T}`);
    const totalRows = Number(await probe.one(`SELECT count(*) FROM ${T}`));
    const groups = Number(await probe.one(
        `SELECT sum(num_row_groups) FROM parquet_file_metadata('${glob}')`
    ));
    const defaultThreads = Number(await probe.one(`SELECT current_setting('threads')`));
    probe.close();

    const sortKey = schema[0][0];
    const q = (name) => `"${String(name).replace(/"/g, '""')}"`;

    heading('THE CORPUS AND THE PREDICTION');
    const meanGroup = totalRows / Math.max(groups, 1);
    table(
        ['term', 'value'],
        [
            ['columns', num(schema.length)],
            ['rows', num(totalRows)],
            ['row groups', num(groups)],
            ['mean rows per group', num(meanGroup)],
            ['threads (default)', num(defaultThreads)],
        ]
    );
    note('');
    note('The law is threads x row_group x columns projected. For a wide SELECT * here:');
    note(`   ${num(defaultThreads)} threads x ${num(meanGroup)} rows x ${num(schema.length)} columns`);
    note('That product, not the dataset size, is what has to fit.');

    const SHAPES = [
        ['count(*)', `SELECT count(*) FROM ${T}`, false],
        ['aggregate', `SELECT count(*), max(${q(sortKey)}) FROM ${T}`, false],
        [`top 100, 1 column`, `SELECT ${q(sortKey)} FROM ${T} ORDER BY ${q(sortKey)} DESC LIMIT 100`, false],
        ['top 100, SELECT * (the cliff)', `SELECT * FROM ${T} ORDER BY ${q(sortKey)} DESC LIMIT 100`, true],
    ];

    heading(`MEMORY LIMIT SWEEP — ${LIMITS.join(', ')}`);
    note('Each cell is one query at one limit. FAILED means it did not complete.');
    note('');

    const grid = [];
    for (const limit of LIMITS) {
        const row = { limit, cells: [] };
        for (const [label, sql, dangerous] of SHAPES) {
            const session = await open({ memoryLimit: limit });
            const before = process.memoryUsage().rss;
            try {
                const m = await measure(async () => {
                    await session.connection.run(sql);
                }, 1);
                row.cells.push({
                    label, dangerous, ok: true, median: m.median,
                    rssDelta: Math.max(0, process.memoryUsage().rss - before),
                });
            } catch (err) {
                row.cells.push({ label, dangerous, ok: false, error: String(err.message).split('\n')[0] });
            } finally {
                session.close();
            }
        }
        grid.push(row);
        note(`${limit.padEnd(8)} ${row.cells.map((c) => (c.ok ? ms(c.median).padStart(11) : '     FAILED')).join('  ')}`);
    }

    heading('THE GRID');
    table(
        ['memory_limit', ...SHAPES.map(([l]) => l)],
        grid.map((r) => [r.limit, ...r.cells.map((c) => (c.ok ? ms(c.median) : 'FAILED'))])
    );

    heading('WHERE THE CLIFF IS');
    const wide = grid.map((r) => ({ limit: r.limit, cell: r.cells.find((c) => c.dangerous) }));
    const failed = wide.filter((w) => !w.cell.ok).map((w) => w.limit);
    const passed = wide.filter((w) => w.cell.ok).map((w) => w.limit);

    if (failed.length && passed.length) {
        note(`The wide SELECT * FAILED at: ${failed.join(', ')}`);
        note(`and SUCCEEDED at:            ${passed.join(', ')}`);
        note('');
        note(`So the threshold for THIS corpus is between ${failed[failed.length - 1]} and ${passed[0]}.`);
        note('That is a capacity line item: budget it per concurrent wide query.');
    } else if (!failed.length) {
        note('The wide SELECT * succeeded at every limit tested.');
        note(`With ${num(schema.length)} columns and ${num(meanGroup)}-row groups the product is small.`);
        note(`To find the cliff on this corpus, sweep lower:  LIMITS=32MiB,64MiB ./run.sh memory`);
    } else {
        note('The wide SELECT * failed at EVERY limit tested.');
        note(`Sweep higher:  LIMITS=2GiB,4GiB,8GiB ./run.sh memory`);
    }

    const narrowFailures = grid.flatMap((r) => r.cells.filter((c) => !c.dangerous && !c.ok));
    note('');
    if (!narrowFailures.length) {
        note('No NARROW shape failed at any limit — consistent with the recorded finding');
        note('that 14 of 15 shapes are fine down to 128 MiB. The cliff is one shape.');
    } else {
        note(`${narrowFailures.length} narrow shape(s) also failed. That is NOT the recorded`);
        note('behaviour and is worth investigating before trusting the rest of these numbers.');
    }

    if (THREAD_COUNTS.length) {
        heading('THREAD AXIS — the documented mitigation');
        const lowest = LIMITS[0];
        const rows = [];
        for (const threads of THREAD_COUNTS) {
            const session = await open({ memoryLimit: lowest, threads });
            const [, wideSql] = SHAPES[SHAPES.length - 1];
            try {
                const m = await measure(async () => {
                    await session.connection.run(wideSql);
                }, 1);
                rows.push([num(threads), ms(m.median)]);
            } catch (err) {
                rows.push([num(threads), `FAILED: ${String(err.message).split('\n')[0].slice(0, 40)}`]);
            } finally {
                session.close();
            }
        }
        table([`threads (at ${lowest})`, 'wide SELECT *'], rows);
        note('');
        note('Capping threads lowers the requirement proportionally. It is the second-best');
        note('fix; the best is not to project every column in the first place.');
    } else {
        note('');
        note('To test the threads mitigation:  THREAD_SWEEP=1,2,4,8 ./run.sh memory');
    }

    heading('PEAK PROCESS RSS');
    note(`peak RSS of this process: ${bytes(process.memoryUsage().rss)}`);
    note('');
    note('memory_limit does NOT bound process RSS — a Parquet scan was measured at');
    note('~5 GB RSS under a 1 GiB limit. Size the container from RSS, never from');
    note('memory_limit and never from duckdb_memory(), which tracks the database');
    note('FILE SIZE whenever the limit is generous.');

    save('memory', {
        table: T,
        columns: schema.length,
        rows: totalRows,
        rowGroups: groups,
        meanRowsPerGroup: meanGroup,
        defaultThreads,
        limits: LIMITS,
        grid,
        peakRssBytes: process.memoryUsage().rss,
    });

    heading('DONE');
    note('That is the full sequence. Result JSON is in ' + config.resultsDir);
    note('Pull it off the box with:   scp -r <host>:' + config.resultsDir + ' .');
} catch (err) {
    explain(err);
    process.exit(1);
}
