/**
 * What a CHECKPOINT buys, per operation: two comparison sweeps, differenced.
 *
 * The comparison harness measures DuckFrame with its tables `Uncompressed` (the state an in-memory
 * DuckDB table is in until a checkpoint) or compressed (`CHECKPOINT=1`). Neither run alone answers
 * "should the worker checkpoint" - the answer is per OPERATION, and it is the ratio between them:
 *
 *     cd packages/data-mate && pnpm build
 *     RESULTS=bench/comparison/.plain.json ENGINES=duckframe \
 *         SCALES=100000,1000000,5000000 node bench/comparison/sweep.js
 *     RESULTS=bench/comparison/.ckpt.json  ENGINES=duckframe CHECKPOINT=1 \
 *         SCALES=100000,1000000,5000000 node bench/comparison/sweep.js
 *     node docs/tools/bench/checkpoint-payback.mjs
 *
 * Prints one row per case and scale, sorted by how much the checkpoint helped, plus what the
 * checkpoint itself cost in that setup - so the payback and the price are on the same page.
 *
 *     PLAIN=... CKPT=... node .../checkpoint-payback.mjs        # other result files
*/
import fs from 'node:fs';
import process from 'node:process';

const PLAIN = process.env.PLAIN || 'bench/comparison/.plain.json';
const CKPT = process.env.CKPT || 'bench/comparison/.ckpt.json';

const log = (text = '') => {
    // eslint-disable-next-line no-console
    console.log(text);
};

function load(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`no result file at ${file} - run the sweep that writes it first`);
    }
    const state = JSON.parse(fs.readFileSync(file, 'utf8'));
    return new Map(state.rows.map((row) => [`${row.scale}::${row.group}::${row.name}`, row]));
}

const plain = load(PLAIN);
const ckpt = load(CKPT);

const label = (count) => {
    if (count >= 1_000_000) return `${count / 1_000_000}M`;
    if (count >= 1_000) return `${count / 1_000}k`;
    return String(count);
};
const fmt = (ms) => {
    if (ms == null) return '-';
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
    return `${ms.toFixed(1)} ms`;
};

const rows = [];
for (const [key, before] of plain) {
    const after = ckpt.get(key);
    if (!after) continue;
    // only cases both sweeps actually measured: a failed or skipped half has no ms
    if (before.duck?.ms == null || after.duck?.ms == null) continue;

    rows.push({
        scale: before.scale,
        group: before.group,
        name: before.name,
        plainMs: before.duck.ms,
        ckptMs: after.duck.ms,
        ratio: before.duck.ms / after.duck.ms,
        checkpointMs: after.duck.checkpointMs ?? null,
        rowsPlain: before.duck.rows,
        rowsCkpt: after.duck.rows,
    });
}

if (!rows.length) throw new Error('the two result files have no case measured in both');

rows.sort((a, b) => b.ratio - a.ratio || a.scale - b.scale);

log(`\nplain: ${PLAIN}\nckpt:  ${CKPT}\n${rows.length} cases measured in both\n`);
log('| scale | case | uncompressed | checkpointed | change | the checkpoint itself | rows agree |');
log('|---|---|---|---|---|---|---|');
for (const row of rows) {
    const change = row.ratio >= 1
        ? `**${row.ratio.toFixed(1)}x faster**`
        : `${(1 / row.ratio).toFixed(1)}x SLOWER`;
    log(`| ${label(row.scale)} | ${row.name} | ${fmt(row.plainMs)} | ${fmt(row.ckptMs)} |`
        + ` ${change} | ${fmt(row.checkpointMs)} |`
        + ` ${row.rowsPlain === row.rowsCkpt ? 'yes' : `**NO - ${row.rowsPlain} vs ${row.rowsCkpt}**`} |`);
}

// a mismatch here means the two sweeps did not do the same work, which voids every ratio above it
const mismatched = rows.filter((row) => row.rowsPlain !== row.rowsCkpt);
if (mismatched.length) {
    log(`\n**${mismatched.length} case(s) produced different row counts between the two sweeps -`
        + ' those ratios are not comparable.**');
}

/** Grouped by case, across scales: the shape of the payback is what a policy is written from. */
log('\n### by case, across scales\n');
const names = [...new Set(rows.map((row) => row.name))];
const scales = [...new Set(rows.map((row) => row.scale))].sort((a, b) => a - b);
log(`| case | ${scales.map(label).join(' | ')} |`);
log(`|---|${scales.map(() => '---').join('|')}|`);
for (const name of names) {
    const cells = scales.map((scale) => {
        const row = rows.find((r) => r.name === name && r.scale === scale);
        if (!row) return '-';
        return row.ratio >= 1 ? `${row.ratio.toFixed(1)}x` : `${(1 / row.ratio).toFixed(1)}x slower`;
    });
    log(`| ${name} | ${cells.join(' | ')} |`);
}
