/**
 * Renders the report from `.results.json`, whatever is in it.
 *
 * Separate from `run.js` because a large enough `DataFrame` case kills the process outright
 * (V8's `Ineffective mark-compacts` is not catchable), so rendering must not depend on a run
 * having finished. Run each scale in its own process, then render once:
 *
 *     for s in 1000 5000 10000 50000 100000 500000 1000000 3000000 5000000; do
 *         SCALES=$s node --max-old-space-size=24576 bench/comparison/run.js || true
 *     done
 *     node bench/comparison/render.js
*/
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { GROUPS } from './lib/cases.js';
import { CONFIG, COLUMNS, SCALES } from './lib/generate.js';
import { writeReport } from './lib/report.js';

const RESULTS = process.env.RESULTS || 'bench/comparison/.results.json';
const OUT = process.env.OUT || 'docs/PERFORMANCE.md';

const state = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
const scales = [...new Set(state.rows.map((row) => row.scale))].sort((a, b) => a - b);

const report = writeReport({
    rows: state.rows,
    lifecycleRows: state.lifecycleRows,
    groups: GROUPS,
    scales: scales.length ? scales : SCALES,
    meta: {
        node: process.version,
        cores: os.cpus().length,
        memory: `${(os.totalmem() / 1024 ** 3).toFixed(0)} GB`,
        heap: process.env.HEAP || '24576 MB',
        runs: '3 / 2 / 1 by scale',
        columns: COLUMNS.length,
        paths: Object.keys(CONFIG.fields).length,
        checkpoint: ['1', 'true', 'yes'].includes(String(process.env.CHECKPOINT)),
    },
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, report);
// eslint-disable-next-line no-console
console.log(`${state.rows.length} measurements across ${scales.length} scales -> ${OUT}`);
