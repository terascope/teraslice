/**
 * Renders the comparison as the markdown report.
 *
 * Deliberately plain: one table per case, scales down the rows, so a reader can see where the
 * two engines cross over rather than being handed a single ratio.
*/
import { fmt, rate, speedup } from './harness.js';
import { label } from './generate.js';

function cell(result) {
    if (result.note) return `_${result.note}_`;
    return fmt(result.ms);
}

export function writeReport({
    rows, lifecycleRows, groups, scales, meta
}) {
    const out = [];
    const push = (text = '') => out.push(text);

    push('# DataFrame vs DuckFrame — performance comparison');
    push();
    push('Both engines are given **identical records** from a seeded generator, and every case is'
        + ' checked to have produced the same number of rows on both sides, so "faster" cannot'
        + ' mean "did less".');
    push();
    push('| | |');
    push('|---|---|');
    push(`| corpus | ${meta.columns} columns (${meta.paths} declared field paths), across`
        + ' Keyword, Text, Byte, Short, Integer, Long, Float, Double, Number, Boolean, Date, IP,'
        + ' GeoPoint, 7 array types and nested objects |');
    push(`| scales | ${scales.map(label).join(', ')} records |`);
    push(`| timing | median of ${meta.runs} runs, after a discarded warm-up |`);
    push(`| machine | node ${meta.node}, ${meta.cores} cores, ${meta.memory} RAM,`
        + ` JS heap limit ${meta.heap} |`);
    push();
    push('**How to read the timings.** `DuckFrame` operations are lazy — they build SQL and'
        + ' execute nothing — so every case below ends in an explicit force: `count(*)` for a'
        + ' filter or join, `materialize()` for anything that must yield a usable frame, and a'
        + ' full row drain where the `DataFrame` side also produces JS values. A sort is *never*'
        + ' forced with a count, because that lets the optimiser drop the `ORDER BY` and would'
        + ' measure nothing.');
    push();
    push('`OOM` means the JS heap was exhausted — a result, not a crash: it is the scale at which'
        + ' the current engine stops working on this machine.');
    push();

    for (const group of groups) {
        const groupRows = rows.filter((row) => row.group === group.title);
        if (!groupRows.length) continue;

        push(`## ${group.title}`);
        push();
        push(group.blurb);
        push();

        for (const testCase of group.cases) {
            const caseRows = groupRows.filter((row) => row.name === testCase.name);
            if (!caseRows.length) continue;

            push(`### ${testCase.name}`);
            push();
            if (testCase.note) {
                push(testCase.note);
                push();
            }

            push('| records | DataFrame | DuckFrame | difference | DuckFrame throughput |');
            push('|---|---|---|---|---|');
            for (const row of caseRows) {
                const throughput = row.duck.ms != null && row.duck.rows
                    ? rate(row.duck.rows, row.duck.ms)
                    : '-';
                const diff = row.df.note || row.duck.note
                    ? '-'
                    : speedup(row.df.ms, row.duck.ms);
                push(`| ${label(row.scale)} | ${cell(row.df)} | ${cell(row.duck)} |`
                    + ` ${diff} | ${throughput} |`);
            }
            push();

            const mismatched = caseRows.filter((row) => row.mismatch);
            if (mismatched.length) {
                push(`> **Row counts differ** (${mismatched
                    .map((row) => `${label(row.scale)}: ${row.mismatch}`).join(', ')}) — the two`
                    + ' engines did not produce the same result here, so treat the timing as'
                    + ' indicative only.');
                push();
            }
        }
    }

    if (lifecycleRows?.length) {
        push('## The spaces query lifecycle, end to end');
        push();
        push('The only section that measures the system rather than an operation. **Today** the'
            + ' api-server builds a `DataFrame` and serializes it to dfjson, and the worker'
            + ' deserializes every payload, appends them, and runs the query in JS. **On'
            + ' DuckFrame** the api-server writes Parquet+zstd, the worker inserts the payloads'
            + ' into one table with no coercion at all, and the whole query is one SQL statement.');
        push();
        push('The fetch itself is not simulated — that cost is identical either way.');
        push();

        const stages = [...new Set(lifecycleRows.map((row) => row.stage))];
        for (const stage of stages) {
            push(`### ${stage}`);
            push();
            push('| records | today | DuckFrame | difference |');
            push('|---|---|---|---|');
            for (const row of lifecycleRows.filter((entry) => entry.stage === stage)) {
                const diff = row.today.note || row.duck.note
                    ? '-'
                    : speedup(row.today.ms, row.duck.ms);
                push(`| ${label(row.scale)} | ${cell(row.today)} | ${cell(row.duck)} | ${diff} |`);
            }
            push();
        }
    }

    push('## Reproducing this');
    push();
    push('```bash');
    push('cd packages/data-mate && pnpm build');
    push('node --max-old-space-size=16384 bench/comparison/run.js');
    push('```');
    push();
    push('`SCALES=1000,10000` for a quick pass, `RUNS=5` for more samples, `OUT=path.md` to send'
        + ' the report elsewhere. The heap flag matters: with the default heap `DataFrame` OOMs'
        + ' far earlier than it needs to, which would overstate the difference.');
    push();

    return `${out.join('\n')}\n`;
}
