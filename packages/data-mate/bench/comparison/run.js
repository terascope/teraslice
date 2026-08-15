/**
 * Runs the DataFrame-vs-DuckFrame comparison and writes the report.
 *
 *     cd packages/data-mate && pnpm build
 *     node --max-old-space-size=16384 bench/comparison/run.mjs
 *
 *     SCALES=1000,10000 node bench/comparison/run.mjs       # a quick pass
 *     RUNS=5 node ...                                        # more samples per case
 *     OUT=docs/PERFORMANCE.md node ...                       # where the report goes
 *
 * The heap flag is not optional at the larger scales: `DataFrame` holds every value in JS, and
 * with Node's default heap it will OOM well before `DuckFrame` breaks a sweat. Giving it room is
 * what makes the comparison fair - and where it OOMs anyway, that is reported as a result.
*/
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import {
    measure, line, heading, progress, progressHeader, RUNS, runsFor, heapLimitMB,
} from './lib/harness.js';
import {
    CONFIG, COLUMNS, SCALES, makeRecords, label
} from './lib/generate.js';
import { GROUPS } from './lib/cases.js';
import { lifecycle } from './lifecycle/spaces.js';

const require = createRequire(import.meta.url);
const dist = (rel) => pathToFileURL(require.resolve(`../../dist/src/${rel}`)).href;

const { DataFrame } = await import(dist('index.js'));
const { dataFrameAdapter } = await import(dist('adapters/data-frame-adapter/index.js'));
const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
const { duckFrameAdapter } = await import(dist('adapters/duck-frame-adapter/index.js'));
const { functionConfigRepository } = await import(dist('function-configs/index.js'));

const OUT = process.env.OUT || 'docs/PERFORMANCE.md';
/**
 * Results are appended to this file after EVERY case, and the report is rendered from it.
 *
 * **Because a big enough `DataFrame` case does not throw - it kills the process.** V8 reports
 * `FATAL ERROR: Ineffective mark-compacts near heap limit` and exits, so nothing in-process can
 * catch it, and a whole run's numbers were lost that way. Persisting per case means a death at
 * 5M costs only the cases after it, and running one scale per process (see RESULTS below)
 * contains the damage to that scale.
*/
const RESULTS = process.env.RESULTS || 'bench/comparison/.results.json';

function loadResults() {
    try {
        return JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
    } catch {
        return { rows: [], lifecycleRows: [] };
    }
}

function saveResults(state) {
    fs.mkdirSync(path.dirname(RESULTS), { recursive: true });
    fs.writeFileSync(RESULTS, JSON.stringify(state));
}
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-compare-'));
const written = [];

function tmp(name) {
    const file = path.join(scratch, `${name}.parquet`);
    written.push(file);
    return file;
}

/** Everything measured so far, including previous processes' scales. */
const state = loadResults();
const { rows } = state;

// a re-run of a scale replaces its earlier numbers rather than duplicating them
for (const scale of SCALES) {
    state.rows = state.rows.filter((row) => row.scale !== scale);
    state.lifecycleRows = state.lifecycleRows.filter((row) => row.scale !== scale);
}
rows.length = 0;
rows.push(...state.rows);

heading('DataFrame vs DuckFrame');
line(`${COLUMNS.length} columns, ${Object.keys(CONFIG.fields).length} declared field paths`);
line(`scales: ${SCALES.map(label).join(', ')}   runs per case: ${process.env.RUNS || '3 / 2 / 1 by scale'}`
    + ' (median, after a discarded warm-up)');
line(`node ${process.version} | ${os.cpus().length} cores | ${(os.totalmem() / 1024 ** 3).toFixed(0)} GB RAM`
    + ` | heap limit ${heapLimitMB() ? `${heapLimitMB()} MB` : 'default'}`);

for (const scale of SCALES) {
    heading(`${label(scale)} records`);

    const records = makeRecords(scale);

    // the Parquet payload every "from Parquet" case reads, produced once and not timed
    let parquet;
    try {
        const producer = await DuckFrame.fromRecords(CONFIG, records, {});
        parquet = tmp(`corpus-${scale}`);
        await producer.writeParquet(parquet);
        await producer.destroy();
    } catch (err) {
        line(`  could not build the Parquet corpus: ${err.message}`);
    }

    const ctx = {
        DataFrame,
        DuckFrame,
        dfAdapter: dataFrameAdapter,
        duckAdapter: duckFrameAdapter,
        repo: functionConfigRepository,
        config: CONFIG,
        records,
        parquet,
        scale,
        tmp,
    };

    progressHeader();

    for (const group of GROUPS) {
        for (const testCase of group.cases) {
            let prepared;
            try {
                prepared = testCase.setup ? await testCase.setup(ctx) : undefined;
            } catch (err) {
                line(`  ${label(scale).padEnd(8)}${testCase.name.padEnd(26)}`
                    + `  setup failed: ${String(err.message).slice(0, 60)}`);
                continue;
            }

            const runs = runsFor(scale);
            const df = await measure(() => testCase.dataFrame(ctx, prepared), { runs });
            const duck = await measure(() => testCase.duckFrame(ctx, prepared), { runs });

            if (testCase.teardown) {
                try {
                    await testCase.teardown(ctx, prepared);
                } catch { /* teardown failures must not lose the measurement */ }
            }

            progress(label(scale), testCase.name, df, duck);

            rows.push({
                group: group.title,
                name: testCase.name,
                note: testCase.note,
                scale,
                df,
                duck,
                mismatch: df.rows != null && duck.rows != null && df.rows !== duck.rows
                    ? `${df.rows} vs ${duck.rows}`
                    : null,
            });

            // after EVERY case: the next one may kill the process outright
            state.rows = rows;
            saveResults(state);
        }
    }
}

// ---------------------------------------------------------------- lifecycle
const lifecycleRows = [
    ...state.lifecycleRows,
    ...await lifecycle({
        DataFrame, DuckFrame, config: CONFIG, makeRecords, SCALES, tmp, measure, label, line,
        heading,
    }),
];
state.lifecycleRows = lifecycleRows;
saveResults(state);

// ---------------------------------------------------------------- the report
const { writeReport } = await import('./lib/report.js');
const report = writeReport({
    rows, lifecycleRows, groups: GROUPS, scales: SCALES,
    meta: {
        node: process.version,
        cores: os.cpus().length,
        memory: `${(os.totalmem() / 1024 ** 3).toFixed(0)} GB`,
        heap: heapLimitMB() ? `${heapLimitMB()} MB` : 'default',
        runs: RUNS,
        columns: COLUMNS.length,
        paths: Object.keys(CONFIG.fields).length,
    },
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, report);
line(`\nreport written to ${OUT}`);

for (const file of written) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
}
fs.rmSync(scratch, { recursive: true, force: true });
await closeDuckDatabase();
