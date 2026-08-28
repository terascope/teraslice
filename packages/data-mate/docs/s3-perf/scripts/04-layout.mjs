/**
 * STEP 5 — how the objects are laid out, and what that costs.
 *
 * **The unit of query cost is the ROW GROUP, not the file.** That correction
 * was expensive to learn: every earlier sweep varied file count at a fixed total
 * size, so "more files" and "more row groups" moved together in every cell and
 * the write-up named FILES as the cause with a clean constant to back it. The
 * decisive pair afterwards: 100 files/100 groups and 20 files/100 groups both
 * answered count(*) in 4.1 ms.
 *
 * This script cannot re-run that controlled experiment — it does not create
 * data. What it CAN do against a pre-uploaded corpus is:
 *
 *   1. census the row groups per object (counted, never inferred)
 *   2. measure cost against SUBSETS of the objects, so cost-per-row-group is
 *      derived from this corpus rather than assumed from the recorded numbers
 *   3. flag the layout pathologies that actually hurt
 *
 * Subsets are chosen by object count, and the row-group count of each subset is
 * counted, so the fit is against groups even though the axis is objects.
 */
import { s3Glob } from '../lib/env.mjs';
import { open } from '../lib/duck.mjs';
import {
    heading, note, table, ms, num, save, explain, measure,
} from '../lib/report.mjs';

const session = await open();

try {
    const glob = s3Glob();

    heading('LAYOUT CENSUS');
    const files = (await session.rows(`
        SELECT file_name, num_rows, num_row_groups
        FROM parquet_file_metadata('${glob}') ORDER BY file_name
    `)).map(([file, rows, groups]) => ({
        file, rows: Number(rows), groups: Number(groups),
    }));

    if (!files.length) {
        note('No objects found. Run ./run.sh doctor.');
        process.exit(1);
    }

    const totalRows = files.reduce((a, f) => a + f.rows, 0);
    const totalGroups = files.reduce((a, f) => a + f.groups, 0);

    table(
        ['measure', 'value'],
        [
            ['objects', num(files.length)],
            ['total rows', num(totalRows)],
            ['total row groups', num(totalGroups)],
            ['mean rows per object', num(totalRows / files.length)],
            ['mean rows per group', num(totalRows / Math.max(totalGroups, 1))],
            ['mean groups per object', (totalGroups / files.length).toFixed(2)],
        ]
    );

    heading('RAGGEDNESS — are the objects evenly sized?');
    const rowCounts = files.map((f) => f.rows).sort((a, b) => a - b);
    const pct = (p) => rowCounts[Math.min(rowCounts.length - 1, Math.floor(rowCounts.length * p))];
    table(
        ['percentile', 'rows in object'],
        [['min', num(rowCounts[0])],
            ['p50', num(pct(0.5))],
            ['p90', num(pct(0.9))],
            ['max', num(rowCounts[rowCounts.length - 1])]],
    );
    const ragged = rowCounts[rowCounts.length - 1] / Math.max(rowCounts[0], 1);
    note('');
    note(`largest / smallest = ${ragged.toFixed(1)}x`);
    if (ragged > 5) {
        note('A ragged mix is EXPECTED for as-received slice payloads and is not a problem');
        note('on its own — cost tracks row groups, and small objects hold one group each.');
    }

    /*
     * Cost against subsets. The axis is objects because that is the only thing
     * selectable without rewriting data, but the row-group count of each subset
     * is counted and reported, so the relationship can be read against GROUPS.
     */
    heading('COST vs SUBSET SIZE — the per-row-group law, fitted to THIS corpus');
    const fractions = [0.1, 0.25, 0.5, 1.0].filter((f) => Math.ceil(files.length * f) >= 1);
    const points = [];

    for (const fraction of fractions) {
        const take = Math.max(1, Math.ceil(files.length * fraction));
        const subset = files.slice(0, take);
        const list = subset.map((f) => `'${f.file}'`).join(', ');
        const groups = subset.reduce((a, f) => a + f.groups, 0);
        const rows = subset.reduce((a, f) => a + f.rows, 0);

        // count(*) is answered from footers, so it isolates per-row-group
        // metadata cost from any column scanning.
        const meta = await measure(async () => {
            await session.connection.run(`SELECT count(*) FROM read_parquet([${list}])`);
        });

        points.push({
            objects: take, rowGroups: groups, rows, metadataMs: meta.median,
            usPerGroup: (meta.median * 1000) / Math.max(groups, 1),
        });
    }

    table(
        ['objects', 'row groups', 'rows', 'count(*)', 'us / row group'],
        points.map((p) => [
            num(p.objects),
            num(p.rowGroups),
            num(p.rows),
            ms(p.metadataMs),
            p.usPerGroup.toFixed(1),
        ])
    );

    note('');
    note('The recorded law is 26-44 us per row group, with FILE COUNT absent from it.');
    const perGroup = points.map((p) => p.usPerGroup);
    const spread = Math.max(...perGroup) / Math.max(Math.min(...perGroup), 0.001);
    if (spread < 3) {
        note(`Here the per-group cost varies only ${spread.toFixed(1)}x across a `
            + `${(points[points.length - 1].rowGroups / Math.max(points[0].rowGroups, 1)).toFixed(0)}x `
            + 'range of row groups — consistent with a per-group law.');
    } else {
        note(`Here it varies ${spread.toFixed(1)}x, which is NOT flat. Either the subsets`);
        note('differ in more than group count, or latency dominates at this endpoint —');
        note('check the requests column in ./run.sh caches before drawing a conclusion.');
    }

    heading('PATHOLOGIES WORTH FLAGGING');
    const findings = [];

    const meanGroup = totalRows / Math.max(totalGroups, 1);
    if (meanGroup < 10_000 && totalGroups > 100) {
        findings.push(
            `Mean row group is only ${num(meanGroup)} rows across ${num(totalGroups)} groups. `
            + 'Consolidation starts to pay at consistently-tiny slices — break-even was 5 queries '
            + 'at ~10k slices, against 67 at a realistic ragged mix.'
        );
    }
    if (files.length > 5000) {
        findings.push(
            `${num(files.length)} objects. Object count only began to hurt around ~10k slices; `
            + 'below that, 10 files and 100 files measured the same.'
        );
    }
    const multiGroup = files.filter((f) => f.groups > 1).length;
    if (multiGroup && multiGroup < files.length) {
        findings.push(
            `${num(multiGroup)} of ${num(files.length)} objects hold more than one row group. `
            + 'Mixed layouts make a per-object cost model wrong; reason in groups.'
        );
    }
    if (!findings.length) {
        note('None. This layout sits in the range where file count is not the variable.');
    } else {
        for (const f of findings) note(`- ${f}`);
    }

    save('layout', {
        objects: files.length, totalRows, totalRowGroups: totalGroups,
        raggedness: ragged, points, findings, files,
    });

    heading('NEXT');
    note('./run.sh duckframe   — the DuckFrame API itself against these objects');
} catch (err) {
    explain(err);
    process.exit(1);
} finally {
    session.close();
}
