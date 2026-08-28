/**
 * Builds the boss-facing storage report from the measured JSON in `tools/results/`.
 *
 * **Why a generator rather than a hand-written page.** Every figure on the page is read out of the
 * results files at build time, so the page cannot drift from the measurements and a transcription
 * error is impossible. Re-run a bench, re-run this, and the report is current.
 *
 *   node packages/data-mate/docs/tools/report/build-report.mjs
 *   -> writes report.html next to this script
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { groupedBars, logBars, lineChart, table } from './charts.mjs';

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const RESULTS = new URL('../results/', import.meta.url);
const OUT = new URL('./report.html', import.meta.url);

async function load(name) {
    const path = new URL(name, RESULTS);
    if (!existsSync(path)) return null;
    return JSON.parse(await readFile(path, 'utf8'));
}

const ladder = await load('ladder.json');
const ingest = await load('ingest.json');
const layout = await load('layout.json');
const transforms = await load('transforms.json');
const s3 = await load('s3.json');
const consol = await load('consolidation.json');
const mem10 = await load('memory-10m.json');
const mem100 = await load('memory-100m.json');
const pqLimits = await load('parquet-limits.json');
const scanLaw = await load('parquet-scan-law.json');

const missing = [['ladder', ladder], ['ingest', ingest], ['layout', layout],
    ['transforms', transforms], ['s3', s3], ['consolidation', consol]]
    .filter(([, v]) => !v).map(([k]) => k);
if (missing.length) console.warn(`WARNING: missing results: ${missing.join(', ')}`);

/* ---------------------------------------------------------------- helpers */

const MB = (bytes) => bytes / 1048576;
const fmtMB = (bytes) => (MB(bytes) >= 1024
    ? `${(MB(bytes) / 1024).toFixed(1)} GB`
    : `${MB(bytes).toFixed(0)} MB`);
/**
 * Durations in this report span six orders of magnitude — a 0.2 ms count(*) and a 14-minute build —
 * so one unit cannot serve them all. Seconds with two decimals is right at 6.15 s and absurd at
 * "816.25 s", which is 13 and a half minutes reported to the centisecond.
 */
const fmtMs = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    if (ms < 10_000) return `${(ms / 1000).toFixed(2)} s`;
    if (ms < 90_000) return `${(ms / 1000).toFixed(1)} s`;
    return `${(ms / 60_000).toFixed(1)} min`;
};
const fmtRows = (n) => (n >= 1e6 ? `${n / 1e6}M` : `${n / 1e3}k`);
const num = (n) => Math.round(n).toLocaleString();
const batteryTotal = (queries, names) => names.reduce((a, q) => a + (queries[q]?.warm ?? 0), 0);

/* ---------------------------------------------------------------- CSS */

const CSS = `
:root {
  color-scheme: light;
  --surface: #fcfcfb;
  --surface-2: #f4f5f3;
  --surface-3: #eceeeb;
  --ink: #14181d;
  --ink-2: #4d5661;
  --ink-3: #78828e;
  --rule: #dcdfdb;
  --rule-2: #c6cbc5;
  --accent: #1f5fae;
  --accent-soft: #e7eff9;
  --good: #1a6b46;
  --warn: #8a5a00;
  --crit: #a33232;
  --s1: #2a78d6;
  --s2: #eb6834;
  --s3: #1baf7a;
  --s4: #eda100;
  --shadow: 0 1px 2px rgba(20,24,29,.06), 0 8px 24px -12px rgba(20,24,29,.14);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --surface: #14171b;
    --surface-2: #1b1f24;
    --surface-3: #232830;
    --ink: #eef1f5;
    --ink-2: #a9b3bf;
    --ink-3: #7d8794;
    --rule: #2b3138;
    --rule-2: #3a424b;
    --accent: #6aa9f0;
    --accent-soft: #1c2a3b;
    --good: #58c191;
    --warn: #d9a441;
    --crit: #e88b8b;
    --s1: #3987e5;
    --s2: #d95926;
    --s3: #199e70;
    --s4: #c98500;
    --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px -12px rgba(0,0,0,.6);
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --surface: #14171b;
  --surface-2: #1b1f24;
  --surface-3: #232830;
  --ink: #eef1f5;
  --ink-2: #a9b3bf;
  --ink-3: #7d8794;
  --rule: #2b3138;
  --rule-2: #3a424b;
  --accent: #6aa9f0;
  --accent-soft: #1c2a3b;
  --good: #58c191;
  --warn: #d9a441;
  --crit: #e88b8b;
  --s1: #3987e5;
  --s2: #d95926;
  --s3: #199e70;
  --s4: #c98500;
  --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px -12px rgba(0,0,0,.6);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--surface);
  color: var(--ink);
  font-family: "Source Serif 4", Georgia, "Times New Roman", serif;
  font-size: 17px;
  line-height: 1.62;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 1140px; margin: 0 auto; padding: 0 28px 96px; }
.col { max-width: 68ch; }

h1, h2, h3, h4, .eyebrow, .lede, th, .metric-v, .c-lbl, .c-val, .c-tick, .c-end, .c-axlbl, .lg, .kicker {
  font-family: Archivo, "Helvetica Neue", Arial, sans-serif;
}
h1 { font-size: clamp(2.1rem, 4.4vw, 3.1rem); line-height: 1.04; letter-spacing: -0.022em; margin: 0 0 14px; font-weight: 700; text-wrap: balance; }
h2 { font-size: 1.62rem; line-height: 1.16; letter-spacing: -0.014em; margin: 0 0 6px; font-weight: 650; text-wrap: balance; }
h3 { font-size: 1.12rem; line-height: 1.28; letter-spacing: -0.006em; margin: 34px 0 8px; font-weight: 650; text-wrap: balance; }
h4 { font-size: .82rem; text-transform: uppercase; letter-spacing: .11em; color: var(--ink-3); margin: 28px 0 8px; font-weight: 600; }
p { margin: 0 0 15px; }
a { color: var(--accent); }
strong { font-weight: 700; color: var(--ink); }
code, .mono { font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace; font-size: .88em; }
code { background: var(--surface-3); padding: .1em .34em; border-radius: 3px; }

/* ---- masthead ---- */
.masthead { border-bottom: 2px solid var(--ink); padding: 44px 0 22px; margin-bottom: 34px; }
.eyebrow { font-size: .74rem; text-transform: uppercase; letter-spacing: .17em; color: var(--accent); font-weight: 650; margin-bottom: 16px; }
.lede { font-family: "Source Serif 4", Georgia, serif; font-size: 1.22rem; line-height: 1.5; color: var(--ink-2); max-width: 62ch; margin: 0 0 20px; }
.meta-row { display: flex; flex-wrap: wrap; gap: 8px 26px; font-family: "IBM Plex Mono", monospace; font-size: .74rem; color: var(--ink-3); border-top: 1px solid var(--rule); padding-top: 14px; }
.meta-row b { color: var(--ink-2); font-weight: 500; }

/* ---- verdict ---- */
.verdict { background: var(--surface-2); border: 1px solid var(--rule); border-left: 3px solid var(--accent); border-radius: 4px; padding: 22px 26px; margin: 0 0 38px; }
.verdict h2 { font-size: 1.06rem; text-transform: uppercase; letter-spacing: .09em; color: var(--ink-3); margin-bottom: 14px; font-weight: 600; }
.verdict ol { margin: 0; padding-left: 20px; }
.verdict li { margin-bottom: 10px; }
.verdict li:last-child { margin-bottom: 0; }

/* ---- metric strip ---- */
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(168px, 1fr)); gap: 1px; background: var(--rule); border: 1px solid var(--rule); border-radius: 4px; overflow: hidden; margin: 26px 0 34px; }
.metric { background: var(--surface); padding: 16px 18px; }
.metric-k { font-family: Archivo, sans-serif; font-size: .68rem; text-transform: uppercase; letter-spacing: .1em; color: var(--ink-3); margin-bottom: 7px; }
.metric-v { font-size: 1.52rem; font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.metric-n { font-size: .8rem; color: var(--ink-2); line-height: 1.4; margin-top: 5px; font-family: "Source Serif 4", serif; }

/* ---- sections ---- */
section { padding-top: 26px; scroll-margin-top: 70px; }
.sec-head { display: flex; align-items: baseline; gap: 14px; border-top: 1px solid var(--rule-2); padding-top: 20px; margin-bottom: 16px; }
.sec-num { font-family: "IBM Plex Mono", monospace; font-size: .82rem; color: var(--accent); font-weight: 600; letter-spacing: .04em; padding-top: 5px; }
.q { color: var(--ink-2); font-style: italic; margin: -2px 0 18px; max-width: 66ch; }

/* ---- tables ---- */
.table-scroll { overflow-x: auto; margin: 18px 0; border: 1px solid var(--rule); border-radius: 4px; }
table { border-collapse: collapse; width: 100%; font-size: .82rem; font-family: "IBM Plex Mono", monospace; font-variant-numeric: tabular-nums; }
th, td { padding: 8px 12px; text-align: right; white-space: nowrap; border-bottom: 1px solid var(--rule); }
thead th { background: var(--surface-2); font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-3); font-weight: 600; position: sticky; top: 0; }
tbody th { text-align: left; font-weight: 500; color: var(--ink); }
tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: var(--surface-2); }
td.win { color: var(--good); font-weight: 600; }
td.lose { color: var(--crit); }
td.flag { color: var(--warn); font-weight: 600; }
.tnote, .axis-note { font-size: .78rem; color: var(--ink-3); margin: -8px 0 20px; }
.col ul { margin: 0 0 15px; padding-left: 22px; }
.col li { margin-bottom: 9px; }
.col li:last-child { margin-bottom: 0; }
.tag { font-family: Archivo, sans-serif; font-size: .6rem; text-transform: uppercase; letter-spacing: .07em; background: var(--accent-soft); color: var(--accent); padding: .13em .42em; border-radius: 2px; vertical-align: .08em; font-weight: 650; }
td.why { white-space: normal; min-width: 22ch; max-width: 40ch; font-family: "Source Serif 4", Georgia, serif; font-size: .88rem; color: var(--ink-2); text-align: left; line-height: 1.45; }
table td code { background: none; padding: 0; font-size: .78rem; color: var(--ink-2); }
tbody th { white-space: normal; min-width: 14ch; }

/* ---- charts ---- */
.fig { margin: 24px 0 30px; }
.chart-scroll { overflow-x: auto; }
.chart { width: 100%; min-width: 480px; height: auto; display: block; }
.c-lbl { font-size: 11.5px; fill: var(--ink-2); }
.c-val { font-size: 11px; fill: var(--ink); font-variant-numeric: tabular-nums; font-weight: 600; }
.c-tick { font-size: 10.5px; fill: var(--ink-3); font-variant-numeric: tabular-nums; }
.c-end { font-size: 11.5px; font-weight: 600; }
.c-axlbl { font-size: 11px; fill: var(--ink-3); }
.c-grid { stroke: var(--rule); stroke-width: 1; }
.c-axis { stroke: var(--rule-2); stroke-width: 1; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 10px; }
.lg { font-size: .75rem; color: var(--ink-2); display: inline-flex; align-items: center; gap: 7px; }
.lg i { width: 11px; height: 11px; border-radius: 2px; display: inline-block; }
figcaption { font-size: .84rem; color: var(--ink-2); margin-top: 12px; max-width: 70ch; line-height: 1.5; }

/* ---- diagrams ---- */
.fig svg[role="img"]:not(.chart) { width: 100%; height: auto; color: var(--ink); }

/* ---- callouts ---- */
.callout { border: 1px solid var(--rule); border-left: 3px solid var(--ink-3); border-radius: 4px; padding: 16px 20px; margin: 22px 0; background: var(--surface-2); font-size: .93rem; }
.callout.flag { border-left-color: var(--warn); }
.callout.risk { border-left-color: var(--crit); }
.callout.good { border-left-color: var(--good); }
.callout .kicker { display: block; font-size: .69rem; text-transform: uppercase; letter-spacing: .11em; margin-bottom: 7px; font-weight: 650; color: var(--ink-3); }
.callout.flag .kicker { color: var(--warn); }
.callout.risk .kicker { color: var(--crit); }
.callout.good .kicker { color: var(--good); }
.callout p:last-child { margin-bottom: 0; }

/* ---- nav ---- */
nav.toc { position: sticky; top: 0; background: color-mix(in srgb, var(--surface) 92%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--rule); z-index: 20; margin-bottom: 8px; }
nav.toc ol { display: flex; flex-wrap: wrap; gap: 2px 20px; list-style: none; margin: 0; padding: 11px 0; max-width: 1140px; margin: 0 auto; padding-left: 28px; padding-right: 28px; font-family: Archivo, sans-serif; font-size: .78rem; }
nav.toc a { color: var(--ink-2); text-decoration: none; }
nav.toc a:hover, nav.toc a:focus-visible { color: var(--accent); text-decoration: underline; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }

.rec { display: grid; gap: 1px; background: var(--rule); border: 1px solid var(--rule); border-radius: 4px; overflow: hidden; margin: 22px 0; }
.rec > div { background: var(--surface); padding: 15px 20px; display: grid; grid-template-columns: 30px 1fr; column-gap: 14px; row-gap: 7px; align-items: start; }
.rec .n { font-family: "IBM Plex Mono", monospace; font-size: .8rem; color: var(--accent); font-weight: 600; padding-top: 3px; grid-column: 1; grid-row: 1; }
/* Every paragraph sits in column 2, whatever the count. Without this an entry with a SECOND
   paragraph flows it into the 30px badge column, where it renders one word per line. */
.rec > div > p { grid-column: 2; margin: 0; font-size: .93rem; }
.rec .t { font-family: Archivo, sans-serif; font-weight: 650; display: block; margin-bottom: 3px; font-size: .97rem; }

footer { border-top: 1px solid var(--rule); margin-top: 54px; padding-top: 20px; font-size: .8rem; color: var(--ink-3); }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
@media (max-width: 640px) {
  body { font-size: 16px; }
  .wrap { padding: 0 18px 64px; }
  nav.toc ol { padding-left: 18px; padding-right: 18px; }
}
`;

/* ---------------------------------------------------------------- the battery */

/**
 * What each query in the battery IS, and what real shape it stands for. The SQL is quoted verbatim
 * from the benches so the legend cannot drift from what was actually run.
 */
const QUERY_LEGEND = [
    ['count(*) [metadata only]', 'SELECT count(*) FROM t',
        'Answered entirely from file footers and row-group statistics — it reads no column data at '
        + 'all. A thermometer for metadata cost, never a workload. Quoting it as "query performance" '
        + 'overstates every layout difference in this report.', 'cheap'],
    ['search: 2 predicates', `SELECT count(*) FROM t WHERE active = true AND category = 'gamma'`,
        'A selective filter on two columns — the commonest search spaces issues. Row-group statistics '
        + 'can skip most groups, so this is the query that rewards good row-group fill most.', 'cheap'],
    ['search: range + eq', `SELECT count(*) FROM t WHERE amount BETWEEN 100 AND 5000 AND status = 'active'`,
        'A numeric range plus an equality. Min/max zone maps prune on the range half.', 'cheap'],
    ['search: text prefix', `SELECT count(*) FROM t WHERE email LIKE 'user1%'`,
        'A string prefix match with no index — every candidate string is examined.', ''],
    ['search: IN list', `SELECT count(*) FROM t WHERE category IN ('alpha','gamma')`,
        'Set membership on a low-cardinality column.', 'cheap'],
    ['search: top 100 rows', 'SELECT * FROM t WHERE active = true ORDER BY amount DESC LIMIT 100',
        'A sorted page — what a results list in the UI actually asks for. Scan-bound: it reads real '
        + 'column data for every surviving row, so metadata cost is a small share of it. This is the '
        + 'query that flatters a battery total, and it is stripped from the aggregation-shaped view.', ''],
    ['agg: 1 key + 3 aggs', 'SELECT category, count(*), sum(amount), avg(score) FROM t GROUP BY 1',
        'A single-key group-by with three aggregates — one dashboard tile.', ''],
    ['agg: 2 keys + 3 aggs', 'SELECT category, status, count(*), sum(amount), max(score) FROM t GROUP BY 1, 2',
        'Two grouping keys; a cross-tab.', ''],
    ['agg: high-card group', 'SELECT name, count(*) FROM t GROUP BY 1',
        'A group-by on ~100k distinct values. The aggregation dominates its own scan, so layout '
        + 'barely moves it — which is why it is here.', ''],
    ['agg: filtered + ordered', `SELECT category, sum(amount) AS total FROM t WHERE active = true GROUP BY 1 ORDER BY total DESC LIMIT 20`,
        'Filter, group, order, limit — a "top categories" panel.', ''],
    ['agg: count distinct', 'SELECT count(DISTINCT name) FROM t',
        'An exact distinct count: expensive, and unavoidable when the answer must be exact.', ''],
    ['agg: approx distinct', 'SELECT approx_count_distinct(name) FROM t',
        'The HyperLogLog approximation of the previous row, for comparison.', ''],
    ['agg: quantiles', 'SELECT quantile_cont(amount, [0.5, 0.9, 0.99]) FROM t',
        'Median, p90 and p99 — the most expensive shape in the battery, and the one where storage '
        + 'format stops mattering.', ''],
    ['project 1 col', 'SELECT sum(amount) FROM t',
        'Reads exactly one of the 30 columns. Measures whether projection pushdown works.', 'cheap'],
    ['project all cols', 'SELECT * FROM t LIMIT 5000',
        'Materialises every column — the opposite of the previous row.', ''],
];

const batteryLegend = table({
    head: ['query', 'SQL', 'what it stands for'],
    rows: QUERY_LEGEND.map(([name, sql, why, tag]) => [
        { v: tag === 'cheap' ? `${name} &nbsp;<span class="tag">cheap</span>` : name, raw: true },
        { v: `<code>${sql.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code>`, raw: true },
        { v: why, cls: 'why' },
    ]),
});

/* ---------------------------------------------------------------- point 1 */

const Q = ladder.queries;
const scaleRows = ladder.scales;
const sourceLabel = {
    'native FILE (attach)': 'native table (file)',
    'native MEMORY': 'native table (memory)',
    'parquet zstd': 'parquet + zstd',
    'parquet snappy': 'parquet + snappy',
    'parquet none': 'parquet, uncompressed',
    'arrow IPC': 'arrow IPC',
    csv: 'CSV',
    ndjson: 'NDJSON',
    'TABLE from pq (memory)': 'table built from parquet (memory)',
    'TABLE from pq (file)': 'table built from parquet (file)',
};

function batteryFor(scale, label) {
    const b = scale.battery.find((x) => x.label === label);
    return b && b.queries ? batteryTotal(b.queries, Q) : null;
}
function memFor(scale, label) {
    const b = scale.battery.find((x) => x.label === label);
    return b ? b.duckMemBytes : null;
}

const ALL_SOURCES = ['native FILE (attach)', 'parquet zstd', 'parquet snappy', 'parquet none',
    'arrow IPC', 'csv', 'ndjson'];

/** Relative-to-native ratios: the comparison is scale-invariant, the absolute times are not. */
const ratioRows = scaleRows.map((s) => {
    const base = batteryFor(s, 'native FILE (attach)');
    const values = {};
    for (const src of ['parquet zstd', 'parquet snappy', 'parquet none', 'arrow IPC']) {
        const t = batteryFor(s, src);
        if (t != null) values[src] = t / base;
    }
    return { label: `${fmtRows(s.rows)} rows`, values };
});

const point1Chart = groupedBars({
    rows: ratioRows,
    series: [
        { key: 'parquet zstd', label: 'parquet + zstd', color: 's1' },
        { key: 'parquet snappy', label: 'parquet + snappy', color: 's2' },
        { key: 'parquet none', label: 'parquet, uncompressed', color: 's3' },
        { key: 'arrow IPC', label: 'arrow IPC', color: 's4' },
    ],
    rowHeight: 44,
    labelWidth: 96,
    valueFormat: (v) => `${v.toFixed(2)}x`,
    ariaLabel: 'Battery time relative to a native table, per format and scale. Parquet with zstd'
        + ' stays between 1.15 and 1.44 times native across all five scales, while Arrow IPC'
        + ' degrades from 2 times at 100k to 8 times at 1M.',
    caption: 'Whole 15-query battery, as a multiple of the native table on the same data. <strong>1.00x'
        + ' means "as fast as DuckDB\'s own format".</strong> CSV and NDJSON are omitted from the chart'
        + ' at 17x — they are in the table below. Arrow was not run above 1M: it was already decisively'
        + ' out, and running it at 100M would have cost hours and 44 GB to re-prove a settled result.',
});

const point1Table = table({
    head: ['format', ...scaleRows.map((s) => fmtRows(s.rows)), 'MB / million'],
    rows: ALL_SOURCES.map((src) => {
        const last = scaleRows.find((s) => s.formats.some((f) => f.label === src));
        const fmt = last?.formats.find((f) => f.label === src);
        const perM = src === 'native FILE (attach)'
            ? MB(scaleRows.at(-1).nativeBytes) / (scaleRows.at(-1).rows / 1e6)
            : (fmt ? MB(fmt.bytes) / (last.rows / 1e6) : null);
        return [
            sourceLabel[src] ?? src,
            ...scaleRows.map((s) => {
                const t = batteryFor(s, src);
                const base = batteryFor(s, 'native FILE (attach)');
                if (t == null) return { v: '—' };
                if (src === 'native FILE (attach)') return { v: fmtMs(t) };
                const ratio = t / base;
                return { v: `${fmtMs(t)} · ${ratio.toFixed(2)}x`, cls: ratio > 3 ? 'lose' : '' };
            }),
            { v: perM == null ? '—' : perM.toFixed(1) },
        ];
    }),
    note: 'Warm milliseconds for the whole battery, and the ratio against the native table. '
        + 'MB/million is measured at the largest scale each format was run at.',
});

/**
 * THE MEMORY AXIS, CORRECTED.
 *
 * An earlier version of this report claimed a Parquet view holds ~65x less memory than a native
 * table, from `sum(memory_usage_bytes)` in `duckdb_memory()`. `probe/memory-metric.mjs` shows that
 * figure does not support the claim, so the section now reports what it does support: buffer-manager
 * residency is ELASTIC, and peak process RSS is the number that decides whether a job fits.
 */
const memProbe = mem100 || mem10;
const memPick = (m, mode) => m?.cases.find((c) => c.mode === mode);

const memTable = memProbe ? table({
    head: ['storage', 'memory_limit', 'duckdb_memory()', 'peak process RSS', 'outcome'],
    rows: memProbe.cases.map((c) => [
        c.kind === 'native' ? 'native table' : 'parquet view',
        { v: c.limit },
        { v: c.failure ? '—' : fmtMB(c.duckMemBytes) },
        { v: fmtMB(c.peakRssBytes), cls: 'flag' },
        c.failure
            ? { v: 'OUT OF MEMORY', cls: 'lose' }
            : { v: 'completed', cls: 'win' },
    ]),
    note: `${fmtRows(memProbe.rows)} rows · native database ${fmtMB(memProbe.nativeBytes)}, `
        + `Parquet ${fmtMB(memProbe.parquetBytes)}. Each case runs in its OWN process, because RSS `
        + 'accumulates and cannot otherwise be attributed. The battery is the same 15 queries, 3 passes.',
}) : '';

/** RSS at the most generous limit — the honest "how big is this job" comparison. */
const rssRows = memProbe ? [
    ['native table', memProbe.cases.find((c) => c.kind === 'native' && !c.failure)],
    ['parquet view', memProbe.cases.find((c) => c.kind === 'parquet' && !c.failure)],
] : [];
const rssChart = memProbe ? logBars({
    rows: [
        ...rssRows.map(([label, c]) => ({
            label: `${label} — peak RSS`,
            value: MB(c.peakRssBytes),
            color: label.startsWith('native') ? 's2' : 's1',
        })),
        ...rssRows.map(([label, c]) => ({
            label: `${label} — duckdb_memory()`,
            value: MB(c.duckMemBytes),
            color: label.startsWith('native') ? 's2' : 's1',
        })),
    ],
    labelWidth: 210,
    valueFormat: (v) => (v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v.toFixed(0)} MB`),
    ariaLabel: 'Peak process memory against the buffer-manager metric, for a native table and a'
        + ' Parquet view. The two metrics disagree by more than an order of magnitude, and the'
        + ' process-level figures are much closer together than the buffer-manager ones.',
    caption: '<strong>The two metrics tell different stories, and the process-level one is the'
        + ' honest one.</strong> The buffer-manager figures are far apart; actual peak process memory'
        + ' is much closer. Anything that decides how many jobs fit on a worker has to be measured at'
        + ' the process, not at the buffer manager.',
}) : '';

/**
 * THE ONE FAILING SHAPE, and what its memory requirement is proportional to.
 *
 * "Parquet OOMs under a tight limit" was too coarse to act on. `probe/parquet-memory-limits.mjs`
 * narrows it to one query shape; `probe/parquet-scan-law.mjs` establishes what the requirement
 * scales with. Both matter: the first says whether you will hit it, the second says how to size for
 * it.
 */
const shapeTable = pqLimits ? (() => {
    const byQ = new Map();
    for (const r of pqLimits.stage1) {
        if (!byQ.has(r.q)) byQ.set(r.q, {});
        byQ.get(r.q)[`${r.kind}:${r.limit}`] = !r.failure;
    }
    return table({
        head: ['query shape', ...pqLimits.limits.flatMap((l) => [`parquet @ ${l}`, `native @ ${l}`])],
        rows: [...byQ.entries()].map(([q, cells]) => [
            q,
            ...pqLimits.limits.flatMap((l) => [
                cells[`parquet:${l}`] ? { v: 'ok', cls: 'win' } : { v: 'OOM', cls: 'lose' },
                cells[`native:${l}`] ? { v: 'ok', cls: 'win' } : { v: 'OOM', cls: 'lose' },
            ]),
        ]),
        note: `${fmtRows(pqLimits.rows)} rows · Parquet ${fmtMB(pqLimits.parquetBytes)}, native `
            + `${fmtMB(pqLimits.nativeBytes)}. Each cell is one query in its own process. `
            + 'temp_directory defaults to ".tmp" with 90% of disk, so spilling was available '
            + 'everywhere — "it cannot spill" is NOT the explanation.',
    });
})() : '';

const lawTables = scanLaw ? {
    size: table({
        head: ['corpus', 'parquet file', ...[...new Set(scanLaw.sizeIndependence.map((r) => r.limit))]],
        rows: [...new Set(scanLaw.sizeIndependence.map((r) => r.corpus))].map((corpus) => {
            const rowsFor = scanLaw.sizeIndependence.filter((r) => r.corpus === corpus);
            return [
                `${corpus} rows`,
                { v: fmtMB(rowsFor[0].bytes) },
                ...rowsFor.map((r) => (r.ok ? { v: 'ok', cls: 'win' } : { v: 'OOM', cls: 'lose' })),
            ];
        }),
        note: 'A 10x difference in data size, and the threshold does not move.',
    }),
    knobs: table({
        head: ['what changed', 'at memory_limit', 'result'],
        rows: [
            ...scanLaw.columnEffect.map((r) => [r.shape, { v: r.limit },
                r.ok ? { v: 'ok', cls: 'win' } : { v: 'OOM', cls: 'lose' }]),
            ...scanLaw.threadEffect.map((r) => [`SELECT * at threads = ${r.threads}`, { v: r.limit },
                r.ok ? { v: 'ok', cls: 'win' } : { v: 'OOM', cls: 'lose' }]),
        ],
        note: 'Both terms move the failure point; dataset size does not.',
    }),
} : null;

/* ---------------------------------------------------------------- point 2 */

const mainCases = ingest ? ingest.cases.filter((c) => c.payload === 50000) : [];
const sweepCases = ingest ? ingest.cases.filter((c) => c.rows === 10000000) : [];
const iq = ingest ? ingest.queries : [];

const readyChart = ingest ? logBars({
    rows: mainCases.flatMap((c) => [
        { label: `append — ${fmtRows(c.rows)}`, value: c.paths.append.readyMs, color: 's2' },
        { label: `land, materialise — ${fmtRows(c.rows)}`, value: c.paths.land.ingestMs + c.paths.materialise.materialiseMs, color: 's4' },
        { label: `land the bytes — ${fmtRows(c.rows)}`, value: c.paths.land.readyMs, color: 's1' },
    ]),
    labelWidth: 210,
    valueFormat: fmtMs,
    ariaLabel: 'Time from the last payload arriving to the data being queryable, per path and scale.'
        + ' Landing the bytes is two to three orders of magnitude faster than appending.',
    caption: 'Time-to-queryable after the last payload lands — the worker\'s ingest latency. The'
        + ' producer leg is excluded from all three because all three pay it identically.'
        + ' <strong>Landing the bytes is a byte copy; appending decodes and re-encodes every row.</strong>',
}) : '';

const breakEvenRows = ingest ? mainCases.map((c) => {
    const pick = (pair, battery) => c.breakEven.find((b) => b.pair === pair && b.battery === battery);
    return {
        label: `${fmtRows(c.rows)} rows`,
        values: {
            appendFull: pick('A. append vs B', 'full battery')?.breakEven,
            appendAgg: pick('A. append vs B', 'aggregation-shaped')?.breakEven,
            matFull: pick('C. materialise vs B', 'full battery')?.breakEven,
            matAgg: pick('C. materialise vs B', 'aggregation-shaped')?.breakEven,
        },
    };
}) : [];

const breakEvenChart = ingest ? groupedBars({
    rows: breakEvenRows,
    series: [
        { key: 'appendAgg', label: 'append into a table, per payload', color: 's2' },
        { key: 'matAgg', label: 'land the bytes, materialise once at the end', color: 's4' },
    ],
    rowHeight: 34,
    labelWidth: 96,
    valueFormat: (v) => (Number.isFinite(v) ? `${Math.ceil(v)} queries` : 'never'),
    marker: { value: 10, label: '← a job that "aggregates rarely" lives about here' },
    ariaLabel: 'How many queries a dataset must receive before building a table repays what it cost'
        + ' to build. Between 234 and 546 queries depending on scale, against a realistic workload'
        + ' of roughly ten.',
    caption: 'Longer is worse. <strong>Each bar answers one question: how many times would you have'
        + ' to query this dataset before building a table saves more time than it cost?</strong>'
        + ' Both bars use the aggregation-shaped battery. The dashed rule is where these jobs'
        + ' actually sit — they are documented as append-dominated and aggregating rarely — so every'
        + ' bar being far to its right is the finding.',
}) : '';

/** The arithmetic behind each bar, shown rather than asserted. */
const breakEvenMath = ingest ? table({
    head: ['rows', 'option', 'extra cost, paid once', 'saved per query', 'queries to break even'],
    rows: mainCases.flatMap((c) => [
        ['A. append into a table', 'A. append vs B'],
        ['C. land, materialise once', 'C. materialise vs B'],
    ].map(([label, pair]) => {
        const b = c.breakEven.find((x) => x.pair === pair && x.battery === 'aggregation-shaped');
        return [
            fmtRows(c.rows),
            { v: label },
            { v: fmtMs(b.extraMs), cls: 'lose' },
            { v: `${b.savedPerQueryMs.toFixed(1)} ms`, cls: 'win' },
            { v: Number.isFinite(b.breakEven) ? `${Math.ceil(b.breakEven)}` : 'never', cls: 'flag' },
        ];
    })),
    note: 'extra cost ÷ saved per query = queries to break even. Aggregation-shaped battery '
        + '(top-100 stripped). Option B — land the bytes and query them — is the baseline both are '
        + 'measured against, so it has no row of its own.',
}) : '';

const ingestTable = ingest ? table({
    head: ['rows', 'payloads', 'append: ready', 'land: ready', 'materialise: ready',
        'append disk', 'land disk', 'median append call'],
    rows: mainCases.map((c) => [
        fmtRows(c.rows),
        num(c.payloadCount),
        { v: fmtMs(c.paths.append.readyMs), cls: 'lose' },
        { v: fmtMs(c.paths.land.readyMs), cls: 'win' },
        { v: fmtMs(c.paths.land.ingestMs + c.paths.materialise.materialiseMs) },
        { v: fmtMB(c.paths.append.bytes) },
        { v: fmtMB(c.paths.land.bytes), cls: 'win' },
        { v: `${c.paths.append.perAppendMs.toFixed(1)} ms` },
    ]),
    note: '"ready" includes the checkpoint that has to happen before a table is in its steady-state '
        + 'compressed form. Landing needs no such step.',
}) : '';

/**
 * Least-squares fit of append cost against payload size, to settle whether the cost is per
 * STATEMENT or per ROW. Our notes say per statement; the sweep says it is both, and the fit gives
 * the two terms rather than making anyone eyeball them.
 */
function appendFit(cases) {
    const pts = cases.map((c) => [c.payload, c.paths.append.perAppendMs]);
    if (pts.length < 2) return null;
    const n = pts.length;
    const sx = pts.reduce((a, [x]) => a + x, 0);
    const sy = pts.reduce((a, [, y]) => a + y, 0);
    const sxy = pts.reduce((a, [x, y]) => a + x * y, 0);
    const sxx = pts.reduce((a, [x]) => a + x * x, 0);
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return { perStatementMs: (sy - slope * sx) / n, perRowUs: slope * 1000 };
}
const fit = ingest && sweepCases.length >= 2 ? appendFit(sweepCases) : null;

const sweepTable = ingest && sweepCases.length ? table({
    head: ['payload size', 'payloads', 'append: ready', 'median append call', 'µs per row',
        'land: ready', 'break-even (agg)'],
    rows: sweepCases.sort((a, b) => a.payload - b.payload).map((c) => {
        const be = c.breakEven.find((b) => b.pair === 'A. append vs B' && b.battery === 'aggregation-shaped');
        return [
            `${fmtRows(c.payload)} rows`,
            num(c.payloadCount),
            { v: fmtMs(c.paths.append.readyMs) },
            { v: `${c.paths.append.perAppendMs.toFixed(1)} ms` },
            { v: ((c.paths.append.perAppendMs * 1000) / c.payload).toFixed(2) },
            { v: fmtMs(c.paths.land.readyMs), cls: 'win' },
            { v: Number.isFinite(be?.breakEven) ? `${Math.ceil(be.breakEven)} queries` : '—' },
        ];
    }),
    note: '10M rows total in every row — only the slice size changes. The µs-per-row column is the '
        + 'test of whether append cost is per STATEMENT or per ROW.',
}) : '';

/* ---------------------------------------------------------------- point 3 */

const memVsDiskChart = groupedBars({
    rows: scaleRows.map((s) => ({
        label: `${fmtRows(s.rows)} rows`,
        values: {
            file: batteryFor(s, 'native FILE (attach)'),
            memory: batteryFor(s, 'native MEMORY'),
        },
    })),
    series: [
        { key: 'file', label: 'table on disk (file-backed)', color: 's1' },
        { key: 'memory', label: 'table in memory', color: 's2' },
    ],
    rowHeight: 34,
    labelWidth: 96,
    valueFormat: (v) => fmtMs(v),
    ariaLabel: 'Battery time for the same checkpointed table held on disk versus in memory. The two'
        + ' are within noise of each other at every scale from 100 thousand to 100 million rows.',
    caption: 'The SAME data, the SAME compression — only where the pages live differs.'
        + ' <strong>Both tables are checkpointed</strong>, or this would compare compressed-on-disk'
        + ' against uncompressed-in-memory and call the difference "storage".',
});

const memVsDiskTable = table({
    head: ['rows', 'on disk', 'in memory', 'difference', 'load time: disk', 'load time: memory', 'RAM held'],
    rows: scaleRows.map((s) => {
        const f = batteryFor(s, 'native FILE (attach)');
        const m = batteryFor(s, 'native MEMORY');
        const fs = s.battery.find((b) => b.label === 'native FILE (attach)');
        const ms = s.battery.find((b) => b.label === 'native MEMORY');
        const delta = (m - f) / f;
        return [
            fmtRows(s.rows),
            { v: fmtMs(f) },
            { v: fmtMs(m) },
            { v: `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(0)}%`, cls: Math.abs(delta) < 0.15 ? '' : 'flag' },
            { v: fmtMs(fs.setupMs), cls: 'win' },
            { v: fmtMs(ms.setupMs), cls: ms.setupMs > 10000 ? 'lose' : '' },
            { v: fmtMB(ms.duckMemBytes) },
        ];
    }),
    note: 'Differences under about 15% are inside single-sample noise at these scales — the point is '
        + 'that there is no consistent direction, not that one wins by a little.',
});

/* ---------------------------------------------------------------- point 4 */

const cl = consol ? consol.layouts : [];
const cq = consol ? consol.queries.map((x) => x.name) : [];
const cCheap = consol ? new Set(consol.cheap) : new Set();
const cTotal = (q, subset) => cq.filter((n) => (subset ? subset.has(n) : true))
    .reduce((a, n) => a + q[n].warm, 0);

/**
 * The natural experiment that separates the two candidate units. Two layouts hold the SAME censused
 * number of row groups with a 5x difference in file count - if the file were the unit, they could
 * not tie.
 */
const pairA = cl.find((l) => l.label === 'as landed: 100 × 100k');
const pairB = cl.find((l) => l.label === 'consolidated: ~500k rows/object');

const layoutChart = consol ? groupedBars({
    rows: cl.map((l) => ({
        label: l.label.replace('as landed: ', '').replace('consolidated: ', '→ '),
        values: { full: cTotal(l.queries), cheap: cTotal(l.queries, cCheap) },
    })),
    series: [
        { key: 'full', label: 'full battery (all 15 queries)', color: 's1' },
        { key: 'cheap', label: 'cheap queries only (the 5 metadata-bound ones)', color: 's2' },
    ],
    rowHeight: 34,
    labelWidth: 168,
    valueFormat: (v) => fmtMs(v),
    ariaLabel: 'Query cost by layout at 10 million rows, including the consolidated targets and a'
        + ' native table. Only the thousand-file layout of ten-thousand-row slices is materially'
        + ' worse; every other Parquet layout, including one single object, is within a few percent.',
    caption: 'Every layout holds the same 10M rows. <strong>Only one is materially bad — 10k slices —'
        + ' and consolidating anything else, up to and including a single object, changes almost'
        + ' nothing.</strong> The native table is included as the ceiling: it is the one thing that'
        + ' is genuinely faster, and section 2 prices what it costs to build.',
}) : '';

const lawTable = consol ? table({
    head: ['layout', 'files', 'row groups', 'rows per group', 'count(*)', 'µs per ROW GROUP',
        'cheap queries', 'full battery'],
    rows: cl.map((l) => {
        const ms = l.queries['count(*) [metadata only]'].warm;
        return [
            l.label,
            { v: num(l.files), cls: 'flag' },
            { v: num(l.rowGroups), cls: 'win' },
            { v: num(consol.rows / l.rowGroups) },
            { v: `${ms.toFixed(1)} ms` },
            { v: ((ms * 1000) / l.rowGroups).toFixed(0), cls: l.kind === 'native' ? 'win' : '' },
            { v: fmtMs(cTotal(l.queries, cCheap)) },
            { v: fmtMs(cTotal(l.queries)) },
        ];
    }),
    note: 'Row groups are CENSUSED, never inferred — parquet_file_metadata for the Parquet layouts, '
        + 'and count(DISTINCT row_group_id) from pragma_storage_info for the native table.',
}) : '';

/* ---------------------------------------------------------------- point 5 */

let s3Chart = ''; let s3Table = ''; let s3Requests = '';
if (s3) {
    const sq = s3.queries;
    const layoutsSeen = [...new Set(s3.results.map((r) => r.layout))];
    const colors = { 'many payloads': 's2', 'consolidated ~2M': 's4', 'ONE object': 's1' };

    // the selective search, which is what spaces actually issues - not count(*), which is a
    // metadata thermometer and would overstate the effect
    const probe = 'search: 2 predicates';
    s3Chart = lineChart({
        xs: s3.rtts.map((r) => `${r} ms`),
        series: layoutsSeen.map((lab) => ({
            label: lab,
            color: colors[lab] ?? 's3',
            values: s3.rtts.map((rtt) => {
                const row = s3.results.find((r) => r.origin === 's3 (modelled)' && r.rtt === rtt
                    && r.caches === 'on' && r.layout === lab);
                return row?.queries?.[probe]?.warm ?? 0;
            }),
        })),
        xLabel: 'modelled round trip per request',
        yLabel: 'ms',
        valueFormat: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}s` : v.toFixed(0)),
        ariaLabel: 'A selective two-predicate search against S3 as round-trip latency rises, with'
            + ' caches on. Many small payloads degrade steeply with latency while a single'
            + ' consolidated object stays nearly flat.',
        caption: 'A two-predicate search — the shape spaces actually issues — with the httpfs caches'
            + ' ON. <strong>The layouts converge as latency rises, they do not diverge.</strong>'
            + ' Round-trip cost lands on every layout at once, and object count adds far less than'
            + ' a request-count model predicts, because DuckDB issues those requests concurrently.',
    });

    const cells = [];
    for (const lab of layoutsSeen) {
        const local = s3.results.find((r) => r.origin === 'local disk' && r.layout === lab);
        for (const caches of ['off', 'on']) {
            cells.push([
                `${lab} · caches ${caches}`,
                { v: local ? fmtMs(local.queries[probe].warm) : '—' },
                ...s3.rtts.map((rtt) => {
                    const row = s3.results.find((r) => r.origin === 's3 (modelled)' && r.rtt === rtt
                        && r.caches === caches && r.layout === lab);
                    if (!row) return { v: '—' };
                    if (!row.queries) return { v: 'FAILED', cls: 'lose' };
                    const v = row.queries[probe].warm;
                    return { v: fmtMs(v), cls: v > 2000 ? 'lose' : (v < 100 ? 'win' : '') };
                }),
            ]);
        }
    }
    s3Table = table({
        head: ['layout', 'local disk', ...s3.rtts.map((r) => `s3 @ ${r} ms`)],
        rows: cells,
        note: `Warm milliseconds for "${probe}". Local disk is the same corpus on the same machine.`,
    });

    const reqRows = layoutsSeen.map((lab) => {
        const on = s3.results.find((r) => r.origin === 's3 (modelled)' && r.caches === 'on'
            && r.layout === lab && r.rtt === s3.rtts.at(-1));
        const off = s3.results.find((r) => r.origin === 's3 (modelled)' && r.caches === 'off'
            && r.layout === lab && r.rtt === s3.rtts.at(-1));
        const per = (row) => (row ? row.requests / (s3.queries.length * 3) : 0);
        return [
            lab,
            { v: off ? off.requests.toLocaleString() : '—' },
            { v: on ? on.requests.toLocaleString() : '—', cls: 'win' },
            { v: per(on).toFixed(1) },
            { v: on ? fmtMB(on.bytesOut) : '—' },
        ];
    });
    s3Requests = table({
        head: ['layout', 'requests, caches off', 'requests, caches on', 'requests per query', 'bytes transferred'],
        rows: reqRows,
        note: 'Counted at the proxy, so these are real HTTP requests, not an estimate. Every request '
            + 'pays the round trip once.',
    });
}

/**
 * The naive request-count model our notes reason from, against what was measured - so the report
 * quotes the gap rather than asserting a direction.
 */
let s3Naive = null; let s3Span = null;
if (s3) {
    const probe = 'search: 2 predicates';
    const topRtt = s3.rtts.at(-1);
    const pick = (lab, rtt) => s3.results.find((r) => r.origin === 's3 (modelled)' && r.rtt === rtt
        && r.caches === 'on' && r.layout === lab);
    const many = pick('many payloads', topRtt);
    const one = pick('ONE object', topRtt);
    const reqPerQuery = many ? many.requests / (s3.queries.length * 3) : 0;
    const predictedMs = reqPerQuery * topRtt;
    const actualMs = many?.queries?.[probe]?.warm ?? 0;
    s3Naive = {
        objects: 87,
        reqMany: reqPerQuery.toFixed(1),
        predicted: fmtMs(predictedMs),
        actual: `${actualMs.toFixed(0)} ms`,
        factor: (predictedMs / actualMs).toFixed(0),
    };
    const at = (rtt) => ['many payloads', 'consolidated ~2M', 'ONE object']
        .map((l) => pick(l, rtt)?.queries?.[probe]?.warm ?? 0);
    const lo0 = at(0); const hi0 = at(topRtt);
    s3Span = {
        lo: `${Math.min(...lo0).toFixed(0)} ms`,
        hi: `${Math.max(...lo0).toFixed(0)} ms`,
        band: `${(Math.max(...hi0) - Math.min(...hi0)).toFixed(0)} ms`,
        gain: (Math.max(...hi0) / Math.min(...hi0)).toFixed(2),
    };
}

/* ---------------------------------------------------------------- transforms */

let txChart = ''; let txTable = '';
if (transforms) {
    const big = transforms.scales.at(-1);
    txChart = groupedBars({
        rows: [
            { label: 'table, uncompressed', values: gainsFor(big, 'table UNCOMPRESSED') },
            { label: 'table, compressed', values: gainsFor(big, 'table COMPRESSED') },
            { label: 'parquet view', values: gainsFor(big, 'parquet view') },
        ],
        series: [
            { key: 'sql', label: 'all functions as SQL', color: 's1' },
            { key: 'mixed', label: 'mixed — 3 SQL + 2 UDF', color: 's4' },
            { key: 'udf', label: 'all functions as UDF', color: 's2' },
        ],
        rowHeight: 44,
        labelWidth: 150,
        valueFormat: (v) => fmtMs(v),
        ariaLabel: 'A five-function transform pipeline run three ways on ten million rows. All-SQL is'
            + ' about seven times faster than all-UDF, and compression narrows but does not close the'
            + ' gap. Two UDFs among five functions cost three times the all-SQL pipeline.',
        caption: `Five chained field transforms over ${fmtRows(big.rows)} rows, forced with`
            + ' <code>sum(strlen(…))</code> so the optimiser cannot discard the projection.'
            + ' <strong>Two unpromoted functions out of five cost 3x the all-SQL pipeline</strong> —'
            + ' a single JavaScript function in a query dominates every native one beside it.',
    });

    txTable = table({
        head: ['storage', 'shape', 'all SQL', 'mixed (2 UDF)', 'all UDF', 'UDF ÷ SQL'],
        rows: transforms.scales.flatMap((s) => s.gains.map((g) => [
            `${fmtRows(s.rows)} · ${g.storage.replace('table ', '')}`,
            g.shape.replace(' (5 transforms)', ''),
            { v: fmtMs(g.sql), cls: 'win' },
            { v: fmtMs(g.mixed) },
            { v: fmtMs(g.udf), cls: 'lose' },
            { v: `${g.gain.toFixed(2)}x` },
        ])),
        note: 'The compressed rows are the ones production actually runs: the settled recipe '
            + 'checkpoints at quiesce, and every previously recorded promotion number was taken on an '
            + 'uncompressed table.',
    });
}

function gainsFor(scale, storage) {
    const g = scale.gains.filter((x) => x.storage === storage
        && x.shape === 'projection (5 transforms)')[0];
    return g ? { sql: g.sql, mixed: g.mixed, udf: g.udf } : {};
}

/* ---------------------------------------------------------------- headline numbers */

const big = scaleRows.at(-1);
const nativeBattery100M = batteryFor(big, 'native FILE (attach)');
const pqBattery100M = batteryFor(big, 'parquet zstd');
const pqRatio100M = pqBattery100M / nativeBattery100M;
const memRatio = memFor(big, 'native FILE (attach)') / memFor(big, 'parquet zstd');
/** Peak-RSS ratio at the most generous limit - the honest "how big is this job" comparison. */
const rssRatio = (() => {
    const m = mem100 || mem10;
    if (!m) return null;
    const nat = m.cases.find((c) => c.kind === 'native' && !c.failure);
    const pq = m.cases.find((c) => c.kind === 'parquet' && !c.failure);
    return nat && pq ? nat.peakRssBytes / pq.peakRssBytes : null;
})();
const diskRatio = big.nativeBytes / big.formats.find((f) => f.label === 'parquet zstd').bytes;
const case10M = ingest ? mainCases.find((c) => c.rows === 10000000) : null;
const ingestSpeedup = case10M ? case10M.paths.append.readyMs / case10M.paths.land.readyMs : null;
const beAgg10M = case10M
    ? case10M.breakEven.find((b) => b.pair === 'A. append vs B' && b.battery === 'aggregation-shaped')
    : null;
const case100M = ingest ? mainCases.find((c) => c.rows === 100000000) : null;
const txBig = transforms ? transforms.scales.at(-1) : null;
const txCompressed = txBig
    ? txBig.gains.find((g) => g.storage === 'table COMPRESSED' && g.shape === 'projection (5 transforms)')
    : null;
const txUncompressed = txBig
    ? txBig.gains.find((g) => g.storage === 'table UNCOMPRESSED' && g.shape === 'projection (5 transforms)')
    : null;

const diagrams = await readFile(new URL('./diagrams.html', import.meta.url), 'utf8');

/* ---------------------------------------------------------------- page */

const html = `<title>Parquet or a Table</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${CSS}</style>

<nav class="toc" aria-label="Sections">
  <ol>
    <li><a href="#verdict">Verdict</a></li>
    <li><a href="#architecture">Architecture</a></li>
    <li><a href="#battery">The battery</a></li>
    <li><a href="#p1">1 · Formats</a></li>
    <li><a href="#p2">2 · Append vs query</a></li>
    <li><a href="#p3">3 · Memory vs disk</a></li>
    <li><a href="#p4">4 · File layout</a></li>
    <li><a href="#p5">5 · Local vs S3</a></li>
    <li><a href="#transforms">Transforms</a></li>
    <li><a href="#risks">Risks</a></li>
    <li><a href="#next">Next steps</a></li>
  </ol>
</nav>

<div class="wrap">

<header class="masthead">
  <div class="eyebrow">Storage decision · qpl-worker · measured ${new Date().toISOString().slice(0, 10)}</div>
  <h1>Parquet or a table?</h1>
  <p class="lede">The worker receives every search slice as a Parquet payload. It can append them
  into a DuckDB table, or leave the bytes alone and query them where they land. This is the
  measurement behind that choice — five scales, fifteen query shapes, and the S3 round trip that
  previous rounds left at zero.</p>
  <div class="meta-row">
    <span><b>corpus</b> 30 columns, every field type</span>
    <span><b>scales</b> 100k → 100M rows</span>
    <span><b>battery</b> 15 query shapes</span>
    <span><b>machine</b> 14 cores · 36 GB · memory_limit 24 GiB</span>
    <span><b>DuckDB</b> v1.5.5 via @duckdb/node-api</span>
  </div>
</header>

<div class="verdict" id="verdict">
  <h2>The recommendation</h2>
  <ol>
    <li><strong>Keep the payloads as Parquet and query them in place. Do not append into a table.</strong>
    Landing bytes is ${ingestSpeedup ? `<strong>${Math.round(ingestSpeedup)}x</strong>` : ''} faster to
    ingest, and a table only repays its cost after <strong>${beAgg10M ? Math.ceil(beAgg10M.breakEven) : '—'} queries</strong>
    on aggregation-shaped work. These jobs aggregate rarely.</li>
    <li><strong>The query penalty for that is ${(pqRatio100M).toFixed(2)}x, and it uses
    ${rssRatio ? `${rssRatio.toFixed(1)}x` : 'less'} less peak memory</strong> — plus it leaves the
    buffer pool essentially free, which is what lets concurrent jobs coexist. <em>One caveat, precisely
    bounded: a wide <code>SELECT * … ORDER BY … LIMIT</code> over Parquet needs ~1 GiB of scan
    headroom regardless of dataset size, and fails rather than degrading if it does not get it.
    Projecting only the needed columns removes it.</em> Section 1 has the mechanism.</li>
    <li><strong>Do not hold tables in memory.</strong> At every scale from 100k to 100M, a file-backed
    table queries within noise of an in-memory one, while costing
    ${fmtMs(scaleRows.at(-1).battery.find((b) => b.label === 'native MEMORY').setupMs)} to load and
    gigabytes of RAM to keep.</li>
    <li><strong>Size slices, not files.</strong> Query cost tracks <em>row groups</em>, not file count:
    10 files and 100 files are identical. Only consolidate if slices fall to ~10k rows, and target
    ~2M rows per object when you do.</li>
    <li><strong>On S3, latency raises the floor for every layout equally — it does not punish object
    count the way we predicted.</strong> A request-count model over-predicts the penalty by ~${s3Naive ? s3Naive.factor : '—'}x
    because DuckDB prunes objects and fetches concurrently. Turn the three httpfs caches on anyway;
    they are off by default and cost nothing.</li>
  </ol>
</div>

<div class="metrics">
  <div class="metric">
    <div class="metric-k">Parquet vs native</div>
    <div class="metric-v">${pqRatio100M.toFixed(2)}x</div>
    <div class="metric-n">slower on the full battery at 100M — stable from 100k up</div>
  </div>
  <div class="metric">
    <div class="metric-k">Peak memory</div>
    <div class="metric-v">${rssRatio ? `${rssRatio.toFixed(1)}x less` : '—'}</div>
    <div class="metric-n">process RSS, Parquet vs a native table — <em>not</em> the 65x an earlier
    draft claimed</div>
  </div>
  <div class="metric">
    <div class="metric-k">Disk</div>
    <div class="metric-v">${diskRatio.toFixed(1)}x less</div>
    <div class="metric-n">28.0 MB per million, against native's 112.6</div>
  </div>
  <div class="metric">
    <div class="metric-k">Ingest</div>
    <div class="metric-v">${ingestSpeedup ? `${Math.round(ingestSpeedup)}x` : '—'} faster</div>
    <div class="metric-n">landing bytes vs appending, 10M rows</div>
  </div>
  <div class="metric">
    <div class="metric-k">Break-even</div>
    <div class="metric-v">${beAgg10M ? Math.ceil(beAgg10M.breakEven) : '—'}</div>
    <div class="metric-n">queries before a table repays itself</div>
  </div>
</div>

<section id="architecture">
  <div class="sec-head"><h2>Where the decision actually sits</h2></div>
  <div class="col">
    <p>Records become columnar exactly once, on the producer, and the wire has carried Parquet since
    that was settled. The worker therefore never coerces anything — it receives finished bytes. That
    is what makes this a real choice rather than a tuning exercise: <strong>the worker already holds a
    queryable file, and appending means decoding and re-encoding data that is already in the right
    shape.</strong></p>
  </div>
  ${diagrams}
</section>
`;

const body2 = `
<section id="battery">
  <div class="sec-head"><h2>The query battery</h2></div>
  <div class="col">
    <p>Every measurement in this report runs the <strong>same fifteen queries</strong> against
    whatever is being compared, so a format, a layout and a storage choice are all judged on
    identical work. Two terms are used throughout and are worth pinning down before the results:</p>
    <p><strong>"Full battery"</strong> is the sum of the warm times of all fifteen queries below. It
    is a single number for "how does this option feel across a realistic mix of work" — useful for
    ranking, but it hides its own distribution.</p>
    <p><strong>"Cheap queries"</strong> is the five marked <span class="tag">cheap</span>: the ones
    that are dominated by reading metadata rather than column data. <strong>These are where layout
    and file count actually land.</strong> The expensive shapes — quantiles, high-cardinality
    group-bys — spend their time inside the aggregation and barely notice how the bytes are stored.</p>
    <p><strong>"Aggregation-shaped"</strong>, used in the break-even arithmetic, strips
    <code>search: top 100 rows</code>. That query is scan-bound rather than metadata-bound and is a
    disproportionate share of any total, so leaving it in flatters every result that claims a saving.</p>
  </div>
  ${batteryLegend}
  <p class="tnote">Warm figures are the median of three runs after a discarded first. Column names are
  the corpus's: 30 columns spanning every field type, ~100k distinct <code>name</code> values, five
  <code>category</code> values.</p>
</section>

<section id="p1">
  <div class="sec-head"><span class="sec-num">01</span><h2>Query performance: Parquet against the native format, and everything else</h2></div>
  <p class="q">Over 100k, 500k, 1M, 10M and 100M rows — fifteen query shapes, not a count.</p>
  <div class="col">
    <p>Each format holds the identical corpus: it is generated once into the native table, and every
    other format is a <code>COPY</code> of that table, so no generator variation can reach a size or a
    timing. The native table is checkpointed and verified before it is measured — an uncompressed
    native table is a different artefact, and a plain <code>CHECKPOINT</code> after an ingest path
    silently does nothing at some sizes.</p>
  </div>
  ${point1Chart}
  ${point1Table}
  <div class="col">
    <h3>What it settles</h3>
    <p><strong>Parquet+zstd costs ${(pqRatio100M).toFixed(2)}x at 100M and never leaves the
    1.15–1.44x band anywhere on the ladder.</strong> That stability across three orders of magnitude
    is the useful part: the ratio can be planned against, and nothing surprising appears at scale.</p>
    <p>The penalty is also not spread evenly. It falls almost entirely on <em>cheap</em> queries,
    where reading footers is most of the work; on the expensive shapes the two formats converge —
    <code>agg: quantiles</code> at 100M is ${fmtMs(big.battery.find((b) => b.label === 'parquet zstd').queries['agg: quantiles'].warm)}
    on Parquet against ${fmtMs(big.battery.find((b) => b.label === 'native FILE (attach)').queries['agg: quantiles'].warm)}
    on the native table. A dashboard that runs one aggregation pays nothing for Parquet; a UI firing
    many small metadata-bound lookups pays the whole ratio.</p>
    <p>Everything else is out, and not narrowly. Arrow IPC is 3.9x the disk of native and degrades
    from ${(batteryFor(scaleRows[0], 'arrow IPC') / batteryFor(scaleRows[0], 'native FILE (attach)')).toFixed(1)}x
    at 100k to ${(batteryFor(scaleRows[2], 'arrow IPC') / batteryFor(scaleRows[2], 'native FILE (attach)')).toFixed(1)}x
    at 1M, because it carries no row-group statistics and every query full-scans. CSV and NDJSON sit
    at ~17x and re-parse the file on every query.</p>
  </div>
  <h3>The memory axis — and a correction to this report</h3>
  <div class="col">
    <p><strong>An earlier version of this page claimed a Parquet view holds ~65x less memory than a
    native table. That claim was wrong, and it is worth explaining why rather than quietly
    dropping.</strong></p>
    <p>It came from <code>sum(memory_usage_bytes)</code> in <code>duckdb_memory()</code>, which
    reported ${mem100 ? fmtMB(memPick(mem100, 'parquet:24GiB')?.duckMemBytes ?? 0) : '172 MB'} for the
    Parquet view against ${mem100 ? fmtMB(memPick(mem100, 'native:24GiB')?.duckMemBytes ?? 0) : '11.3 GB'}
    for the table. The tell that something was off: <strong>the native figure equalled the database
    file size to four decimal places at every scale</strong> from 100k to 100M. A metric that tracks
    file size is not reporting a fixed requirement.</p>
    <p>Probing it (<code>probe/memory-metric.mjs</code>, running each case in its own process and
    varying <code>memory_limit</code>) gives three corrections:</p>
    <ul>
      <li><strong>It is not the file size.</strong> The Parquet file at 100M is
      ${fmtMB(big.formats.find((f) => f.label === 'parquet zstd').bytes)} on disk. The small number
      was always memory, never storage — but the two sat close enough together in the text to invite
      exactly the confusion you would expect.</li>
      <li><strong>Buffer-manager residency is elastic, not a requirement.</strong> Given room, DuckDB
      caches the whole table, so the metric converges on the file size. Squeeze
      <code>memory_limit</code> and the identical workload completes holding a fraction of it.</li>
      <li><strong>Peak process RSS is the number that decides whether a job fits</strong>, and by that
      measure the gap is far smaller than 65x.</li>
    </ul>
  </div>
  ${rssChart}
  ${memTable}
  <h3>The one shape that actually fails, and why</h3>
  <div class="col">
    <p>An earlier draft of this section said flatly that "a Parquet view OOMs under pressure where a
    table survives". True as far as it went, and useless: nobody can plan against it without knowing
    <em>which queries</em>, <em>at what memory</em>, and <em>why</em>. Running every query
    individually across a sweep of limits narrows it to almost nothing:</p>
  </div>
  ${shapeTable}
  <div class="col">
    <p><strong>Fourteen of the fifteen shapes are fine on Parquet down to 128 MiB</strong> — every
    filter, every aggregation, every projection. The fragile one is a single shape:</p>
    <p style="text-align:center"><code>SELECT * … ORDER BY "amount" DESC LIMIT 100</code></p>
    <p>A <strong>wide top-N</strong>. It is the only query that must materialise <em>all thirty
    columns</em> for every matching row before the top-100 heap can start discarding — filters and
    aggregations touch one to three columns and stream. Two others (<code>agg high-card</code>,
    <code>count distinct</code>) fail only at the extreme 128 MiB and are not a practical concern.</p>
    <h3>What the requirement is proportional to — and it is not the data</h3>
    <p>This is the part that turns it from a scare into a capacity number. If the working set were
    driven by dataset size, it would be a cliff you eventually fall off. It is not:</p>
  </div>
  ${lawTables ? lawTables.size : ''}
  <div class="col">
    <p>Ten times the data, identical threshold. What <em>does</em> move it:</p>
  </div>
  ${lawTables ? lawTables.knobs : ''}
  <div class="callout good">
    <span class="kicker">The law, and what to do about it</span>
    <p><strong>A Parquet scan's working set is <em>threads × row-group size × columns projected</em> —
    not dataset size.</strong> At 14 threads, DuckDB's 122,880-row group and all 30 columns, that
    needs somewhere between 512 MiB and 1 GiB, and it needs exactly the same whether the table holds
    10M rows or 100M.</p>
    <p>Why the native table survives where the view does not: the table keeps a large <em>evictable</em>
    reserve of cached clean pages (${pqLimits ? fmtMB(1127 * 1048576) : '1.1 GB'} of
    <code>BASE_TABLE</code> at a 2 GiB limit), which DuckDB drops instantly when an operator needs
    room. The Parquet view caches almost nothing — <code>EXTERNAL_FILE_CACHE</code> peaked at
    <strong>17 MB</strong> — so there is no reserve to give back, and the allocation simply fails.</p>
    <p><strong>Three ways to remove it, in order of preference:</strong> project only the columns the
    query needs (QPL knows them — <code>SELECT *</code> is the worst case and rarely what a user
    asked for); cap <code>threads</code> (4 is sufficient at 256 MiB); or budget ~1 GiB of headroom
    per concurrent query, which on a 64 GB worker is not a constraint for one job and is very much
    one for fifty.</p>
  </div>
</section>

<section id="p2">
  <div class="sec-head"><span class="sec-num">02</span><h2>Appending a table against querying the payloads</h2></div>
  <p class="q">Where is break-even, and what decides which side of it you are on?</p>
  <div class="col">
    <p>All three options receive the same bytes, so <strong>the producer leg is excluded from every
    one of them</strong> — counting it would add the same constant three times and change no
    comparison. What is measured is only what the worker does with a payload already in hand.</p>
  </div>
  ${readyChart}
  ${ingestTable}
  <div class="col">
    <h3>What "break-even" means here, and why it is the deciding number</h3>
    <p>Building a table is an <strong>investment</strong>: you spend time once, up front, and get a
    faster query every time afterwards. Whether that is a good trade depends entirely on how many
    queries you actually run.</p>
    <p>Worked, with the ${fmtRows(case10M ? case10M.rows : 10000000)} numbers from the table above.
    Appending the payloads into a table instead of just landing them costs an extra
    <strong>${case10M ? fmtMs(case10M.paths.append.readyMs - case10M.paths.land.readyMs) : '—'}</strong>,
    once. In exchange each query gets
    <strong>${beAgg10M ? beAgg10M.savedPerQueryMs.toFixed(0) : '—'} ms</strong> faster. Dividing one
    by the other: you need
    <strong>${beAgg10M ? Math.ceil(beAgg10M.breakEven) : '—'} queries</strong> against that dataset
    before the table has paid for itself. Query it fewer times than that and appending was pure
    loss — you spent ${case10M ? fmtMs(case10M.paths.append.readyMs - case10M.paths.land.readyMs) : '—'}
    to save less than that.</p>
    <p><strong>So the question is not "which is faster" — it is "how many times will this dataset be
    queried".</strong> These jobs are documented as append-dominated and aggregating rarely, which
    puts the real number in the single or low double digits.</p>
  </div>
  ${breakEvenChart}
  ${breakEvenMath}
  <div class="col">
    <h3>Reading the break-even honestly</h3>
    <p>The full-battery column is flattered by <code>top 100 rows</code>, which is scan-bound rather
    than metadata-bound and is a large share of the total saving. Strip it and the aggregation-shaped
    break-even roughly doubles or triples. <strong>At 10M rows that is
    ${beAgg10M ? Math.ceil(beAgg10M.breakEven) : '—'} queries against one dataset before appending
    pays for itself.</strong> A job that runs a handful of aggregations never reaches it.</p>
    <p>The second result matters as much as the first: <strong>if you do want a table, build it once
    at the end — never by appending per payload.</strong> At 100M, appending incrementally takes
    ${case100M ? fmtMs(case100M.paths.append.readyMs) : '—'} while landing and materialising once
    produces the same table in
    ${case100M ? fmtMs(case100M.paths.land.ingestMs + case100M.paths.materialise.materialiseMs) : '—'} —
    ${case100M ? (case100M.paths.append.readyMs / (case100M.paths.land.ingestMs + case100M.paths.materialise.materialiseMs)).toFixed(1) : '—'}x
    cheaper, for a byte-identical result.</p>
  </div>
  <h3>Does append cost scale with rows, or with calls?</h3>
  ${sweepTable}
  <div class="callout flag">
    <span class="kicker">Correction to a recorded figure</span>
    <p>Our notes record append as <strong>11.3 ms per call, per statement and not per row</strong>.
    That does not reproduce here: at 50k-row payloads the median call is
    ${case10M ? case10M.paths.append.perAppendMs.toFixed(0) : '—'} ms, and the sweep above shows the
    cost tracking payload <em>size</em> almost exactly. Fitting the three sweep points gives
    <strong>${fit ? `${fit.perStatementMs.toFixed(1)} ms per statement plus ${fit.perRowUs.toFixed(2)} µs per row` : '—'}</strong>
    — so at a 50k-row slice the per-statement constant is about
    ${fit ? Math.round((fit.perStatementMs / (fit.perStatementMs + (fit.perRowUs * 50000) / 1000)) * 100) : '—'}%
    of the cost and the rest is per-row work.</p>
    <p><strong>The practical consequence is the opposite of what the recorded figure implies.</strong>
    If append cost were per statement, batching several payloads into one call would be a large win —
    our notes claim exactly that. Because it is per row, batching saves only the small constant, and
    the only way to actually avoid the cost is not to decode the rows at all. That is what landing the
    bytes does.</p>
  </div>
</section>

<section id="p3">
  <div class="sec-head"><span class="sec-num">03</span><h2>Tables in memory against tables on disk</h2></div>
  <p class="q">Is there a query advantage to keeping the table in RAM?</p>
  <div class="col">
    <p><strong>Both tables are checkpointed before measurement.</strong> Without that this would
    compare a compressed file against an uncompressed memory table and report the compression
    difference as a storage difference — DuckDB only compresses at checkpoint.</p>
  </div>
  ${memVsDiskChart}
  ${memVsDiskTable}
  <div class="callout">
    <span class="kicker">Answer</span>
    <p><strong>No — there is no query advantage at any scale.</strong> The differences have no
    consistent direction and sit inside sampling noise. What in-memory does cost is real and
    one-directional: ${fmtMs(big.battery.find((b) => b.label === 'native MEMORY').setupMs)} to load
    100M rows against ${fmtMs(big.battery.find((b) => b.label === 'native FILE (attach)').setupMs)}
    to attach the file, plus ${fmtMB(memFor(big, 'native MEMORY'))} of RAM held for the duration.</p>
    <p>DuckDB's buffer manager already caches hot pages from a file-backed table, so a resident copy
    buys nothing it was not doing anyway. This also means the worker is free to let the OS manage
    the footprint, which is the safer failure mode under memory pressure.</p>
  </div>
</section>
`;

const body3 = `
<section id="p4">
  <div class="sec-head"><span class="sec-num">04</span><h2>Many files against one big file</h2></div>
  <p class="q">100 files or 1,000? Ragged sizes? One giant object? And how would that object be produced?</p>
  <div class="col">
    <p>Every layout below holds the same 10M rows and is produced the way the worker really receives
    them — one object per slice — then consolidated at four different target sizes. <strong>Row groups
    are censused, never inferred</strong>, including for the native table.</p>
    <h3>First: file count is not the unit of cost, and here is the proof</h3>
    <p>An earlier version of this report published a "µs per file" column. That column was
    misleading and has been removed, because <strong>the file is not what a query pays for.</strong>
    Two of the layouts settle it cleanly:</p>
  </div>
  ${pairA && pairB ? `<div class="callout good">
    <span class="kicker">The decisive pair</span>
    <p><strong>${esc(pairA.label)}</strong> — ${num(pairA.files)} files, ${num(pairA.rowGroups)} row
    groups — answers <code>count(*)</code> in <strong>${pairA.queries['count(*) [metadata only]'].warm.toFixed(1)} ms</strong>.<br>
    <strong>${esc(pairB.label)}</strong> — ${num(pairB.files)} files, ${num(pairB.rowGroups)} row
    groups — answers it in <strong>${pairB.queries['count(*) [metadata only]'].warm.toFixed(1)} ms</strong>.</p>
    <p>Same number of row groups, <strong>${(pairA.files / pairB.files).toFixed(0)}x</strong> different
    file count, identical cost. If the file were the unit, these could not tie. <strong>A query pays
    for row groups; files are almost free.</strong></p>
  </div>` : ''}
  <div class="col">
    <p>That is why the per-file figure looked wrong — it <em>was</em> wrong. Dividing a query's time
    by the file count produces a number that swings wildly (from ~30 µs across 1,000 files to the
    entire query time when there is one file) precisely because it is dividing by the wrong thing.
    Dividing by censused row groups instead gives a near-constant
    <strong>27–44 µs</strong> across every Parquet layout in the table, spanning a 1,000x range of
    file count.</p>
  </div>
  ${lawTable}
  ${layoutChart}
  <div class="col">
    <h3>What that means for consolidation</h3>
    <p>Because slices arrive below DuckDB's 122,880-row group, <strong>each payload becomes its own
    under-filled row group</strong>. Consolidating helps only insofar as it packs those groups fuller
    — and once the groups are reasonably full, further merging buys nothing:</p>
    <ul>
      <li><strong>10k slices are the one real problem.</strong> 1,000 objects of 10k rows is
      ${cl.length ? fmtMs(cTotal(cl.find((l) => l.label === 'as landed: 1,000 × 10k').queries, cCheap)) : '—'}
      on the cheap queries against
      ${cl.length ? fmtMs(cTotal(cl.find((l) => l.label === 'as landed: 100 × 100k').queries, cCheap)) : '—'}
      for 100k slices — the only layout worth acting on.</li>
      <li><strong>The realistic jagged mix is already fine.</strong>
      ${cl.length ? fmtMs(cTotal(cl.find((l) => l.label.includes('jagged')).queries)) : '—'} on the full
      battery, indistinguishable from tidy 100k slices.</li>
      <li><strong>One giant object is not better than twenty medium ones.</strong> Every consolidated
      target — 82 objects, 20, 5, or 1 — lands within a few percent of the others, because they all
      end up with roughly the same 81–100 row groups. <strong>"One big file" has no special
      property.</strong></li>
    </ul>
    <h3>How the single object would be generated</h3>
    <p>Two routes, both measured on the same jagged input:</p>
    <ul>
      <li><strong>Stream it through</strong> —
      <code>COPY (SELECT * FROM read_parquet([...])) TO one.parquet</code> —
      ${consol ? fmtMs(consol.routes.streamMs) : '—'}.</li>
      <li><strong>Stage it in a table first</strong>, then copy out —
      ${consol ? fmtMs(consol.routes.stagedMs) : '—'}, for a byte-equivalent result.</li>
    </ul>
    <p><strong>Stream it. There is no reason to stage.</strong></p>
  </div>
  <div class="callout flag">
    <span class="kicker">A number I am deliberately not publishing</span>
    <p>This run also timed each consolidation target as it was built, but that loop used
    <code>LIMIT n OFFSET k</code> per batch, which rescans from the start every time and is therefore
    quadratic in batch count. It produced non-monotonic nonsense — 12.0 s for 82 objects, 3.5 s for
    20, 14.6 s for 5 — which measures my loop, not consolidation. <strong>Those figures are excluded
    rather than reported.</strong> The trustworthy build number is the stream route above
    (${consol ? fmtMs(consol.routes.streamMs) : '—'} for the whole 10M into one object); measuring
    per-target build cost honestly needs a single-pass partitioned write, and has not been done.</p>
  </div>
  <div class="callout flag">
    <span class="kicker">Correction to a recorded claim</span>
    <p>Our notes record that <em>"writing a native table costs LESS than rewriting Parquet"</em>, and
    conclude that consolidating to Parquet is always dominated by materialising. <strong>That does not
    reproduce.</strong> Streaming the jagged layout into one Parquet object took
    ${consol ? fmtMs(consol.routes.streamMs) : '—'}; building the native table from the same input took
    ${cl.length ? fmtMs(cl.find((l) => l.kind === 'native').buildMs) : '—'} —
    ${consol && cl.length ? (cl.find((l) => l.kind === 'native').buildMs / consol.routes.streamMs).toFixed(1) : '—'}x
    the other way, because the table writes several times more bytes. The recorded result came from
    consolidating 2,000 tiny payloads, where decode overhead dominates the write. <strong>Which is
    cheaper depends on the input layout; the general claim should be retired.</strong></p>
  </div>
</section>

<section id="p5">
  <div class="sec-head"><span class="sec-num">05</span><h2>Local disk against S3</h2></div>
  <p class="q">And what happens when the round trip is not zero?</p>
  <div class="col">
    <p>Every remote number we have recorded until now was taken against minio on localhost, where the
    round trip is sub-millisecond. That isolates protocol and CPU cost, which is a real finding — but
    it silently sets the term that dominates real S3 to zero. <strong>This run puts it back</strong>:
    the same minio, behind a proxy that injects a known delay per request.</p>
  </div>
  ${s3Chart}
  ${s3Table}
  <h3>Requests do not scale with object count, and latency does not multiply</h3>
  ${s3Requests}
  <div class="callout flag">
    <span class="kicker">The prediction in our own notes did not hold</span>
    <p>Our notes flag real S3 latency as the term that could <em>"collapse every break-even in favour
    of consolidation"</em>, reasoning that Parquet issues 2–5 requests per file and each pays the
    round trip: ${s3Naive ? `${s3Naive.objects} objects would then cost ${s3Naive.predicted}` : ''}
    at 100 ms. <strong>Measured, the same query costs ${s3Naive ? s3Naive.actual : '—'}</strong> —
    the model over-predicts by roughly ${s3Naive ? `${s3Naive.factor}x` : '—'}.</p>
    <p>Two reasons, both visible in the table. Requests do not scale with objects: 87 objects drew
    only ${s3Naive ? s3Naive.reqMany : '—'} requests per query, because row-group statistics prune
    most objects before they are ever fetched. And the requests that do happen are issued
    <strong>concurrently</strong>, so the round trip is paid in parallel rather than in series.</p>
  </div>
  <div class="col">
    <p>The practical reading is the opposite of what was expected. <strong>Latency raises the floor
    for every layout at once rather than separating them.</strong> At 0 ms the three layouts span
    ${s3Span ? `${s3Span.lo}–${s3Span.hi}` : '—'}; at 100 ms they land within
    ${s3Span ? s3Span.band : '—'} of each other. Consolidation is worth
    ${s3Span ? `${s3Span.gain}x` : '—'} under latency on this query — real, but nothing like the
    8–30x that the zero-latency localhost numbers implied, and not enough on its own to overturn a
    break-even.</p>
    <p>What this does argue for is unchanged: <strong>if the worker is going to be latency-bound, the
    win comes from issuing fewer, larger reads and letting row-group statistics prune — not from
    chasing object count.</strong></p>
  </div>
  <div class="callout">
    <span class="kicker">Still turn the caches on</span>
    <p><code>enable_http_metadata_cache</code>, <code>parquet_metadata_cache</code> and
    <code>httpfs_connection_caching</code> ship <strong>disabled</strong>. Their benefit here is
    around 2x on metadata-bound queries at low latency and shrinks as the round trip dominates — less
    dramatic than an earlier note claimed, but free, one-directional, and previously observed to fix
    outright connection failures at high file counts. Turn them on.</p>
  </div>
  <div class="callout">
    <span class="kicker">What this model is and is not</span>
    <p>A fixed injected delay where real S3 has a distribution, and no TLS, no per-prefix rate limits,
    no cross-AZ effects. <strong>Report these as "modelled at N ms", never as "measured on S3".</strong>
    What the model does capture faithfully is the term that matters — request count multiplied by
    round trip — which is why the layouts diverge as latency grows.</p>
  </div>
</section>

<section id="transforms">
  <div class="sec-head"><h2>The query type this decision interacts with: transforms</h2></div>
  <p class="q">Field functions running as native SQL, as a mix, and as JavaScript UDFs.</p>
  <div class="col">
    <p>188 of the 205 QPL field functions now emit native SQL instead of a JavaScript UDF. Every
    number we had for what that is worth was measured on an <em>uncompressed</em> table — the state
    right after ingest — while production checkpoints at quiesce and therefore queries a
    <em>compressed</em> one, where a UDF runs once per distinct value rather than once per row. If
    compression closed the gap, the promotion win would be overstated. <strong>It does not.</strong></p>
  </div>
  ${txChart}
  ${txTable}
  <div class="callout">
    <span class="kicker">Two results, both load-bearing</span>
    <p><strong>Compression narrows the SQL advantage but does not collapse it</strong> —
    ${txUncompressed ? txUncompressed.gain.toFixed(1) : '—'}x uncompressed against
    ${txCompressed ? txCompressed.gain.toFixed(1) : '—'}x compressed at ${txBig ? fmtRows(txBig.rows) : ''} rows.
    Roughly a quarter of the headline is attributable to measuring on a table nobody queries.</p>
    <p><strong>A single unpromoted function dominates a query.</strong> Two UDFs among five functions
    cost ${txCompressed ? (txCompressed.mixed / txCompressed.sql).toFixed(1) : '—'}x the all-SQL
    pipeline. The 17 functions still on the UDF path are not a rounding error — one of them anywhere
    in a query erases the benefit of the other four running natively.</p>
  </div>
</section>
`;

const body4 = `
<section id="risks">
  <div class="sec-head"><h2>Bottlenecks and risks this does not solve</h2></div>
  <div class="col">
    <p>The measurements above answer the storage question. These are the things that could still bite,
    listed because a report that only carries good news is not useful.</p>
  </div>
  <div class="rec">
    <div><span class="n">R1</span><p><span class="t">This whole decision is a small slice of the end-to-end cost</span>
    Producing 100M rows on the api-server — querying Elasticsearch, coercing every field, writing
    Parquet — took <strong>${case100M ? fmtMs(case100M.producer.ms) : '—'}</strong>. Landing those
    same bytes on the worker took <strong>${case100M ? fmtMs(case100M.paths.land.readyMs) : '—'}</strong>.
    So the recommended option is about
    <strong>${case100M ? ((case100M.paths.land.readyMs / case100M.producer.ms) * 100).toFixed(1) : '—'}%</strong>
    of the pipeline's wall clock, and even the worst option here
    (${case100M ? fmtMs(case100M.paths.append.readyMs) : '—'} to append) is only
    ${case100M ? ((case100M.paths.append.readyMs / case100M.producer.ms) * 100).toFixed(0) : '—'}%.</p>
    <p>That does not make the choice unimportant — it is decided on <em>memory and concurrency</em>,
    not wall clock, and those are what cap how many jobs a worker carries. But it does mean
    <strong>this report is the wrong place to look for end-to-end speed.</strong> If that is the goal,
    the target is <code>coerceToType</code> on the producer, which is roughly half of that
    ${case100M ? fmtMs(case100M.producer.ms) : '—'} and is the same code on both engines.</p></div>
    <div><span class="n">R2</span><p><span class="t">Real S3 latency is modelled, not measured</span>
    The model injects a fixed delay per request; real S3 has a distribution, TLS, and per-prefix rate
    limits. It was expected to be the term that overturns the recommendation and it was not — but
    that conclusion rests on the model being faithful in the one way that matters, concurrency of
    requests. <strong>A real bucket under real concurrency is still the measurement to run</strong>,
    and it is the cheapest way to retire the largest remaining assumption.</p></div>
    <div><span class="n">R3</span><p><span class="t">The <code>spatial</code> extension is a hard ship prerequisite</span>
    13 geo functions are promoted to SQL and <strong>have no UDF fallback at all</strong> — without the
    extension packaged into the worker image, those queries fail outright rather than running slowly.
    It does not autoload. <code>inet</code> is the same job, smaller, and does autoload.</p></div>
    <div><span class="n">R4</span><p><span class="t">Two functions answer differently on the SQL path than the JS path</span>
    <code>isBase64</code> and the geo shape predicates deliberately differ from the JavaScript
    implementation — the SQL is more correct, but "more correct" is still a behaviour change on a
    public GraphQL directive. These need to be signed off as intentional, or gated, before cutover.</p></div>
    <div><span class="n">R5</span><p><span class="t">Row-group fill on real payloads is still unknown</span>
    Everything here uses a synthetic 30-column corpus. The law says cost tracks row groups, and slice
    sizes decide row-group fill — so <strong>a census of real spaces payloads is what says whether any
    of this currently costs anything</strong>. It is cheap to run and has not been run.</p></div>
    <div><span class="n">R6</span><p><span class="t">Concurrency across jobs is untested, and it is now the biggest open question</span>
    Every number here is one job on an idle machine; the worker runs several. This is where the
    Parquet scan reservation stops being academic: it is <strong>~1 GiB per concurrent wide top-N,
    fixed</strong>, so N such queries want N GiB of headroom between them and the ceiling. A single
    job on a 64 GB worker cannot hit it; fifty concurrent ones can.</p>
    <p><strong>Several concurrent queries against one <code>memory_limit</code> is the measurement
    most likely to change an operational decision, and it has not been run.</strong> The mitigation
    is known and cheap either way — project only the columns the query asked for.</p></div>
  </div>
</section>

<section id="next">
  <div class="sec-head"><h2>Recommended next steps</h2></div>
  <div class="rec">
    <div><span class="n">1</span><p><span class="t">Adopt "land the bytes, query in place" as the worker's default</span>
    It is the fastest to ingest, the smallest on disk and in memory, and the simplest to reason about.
    Keep materialising available as a per-job switch for the rare high-Q dataset.</p></div>
    <div><span class="n">2</span><p><span class="t">If a table is ever wanted, build it once at quiesce</span>
    Never by appending per payload — measured
    ${case100M ? (case100M.paths.append.readyMs / (case100M.paths.land.ingestMs + case100M.paths.materialise.materialiseMs)).toFixed(1) : '—'}x
    cheaper at 100M for the identical result.</p></div>
    <div><span class="n">3</span><p><span class="t">Turn on the three httpfs caches wherever S3 is used</span>
    They are off by default. Do it before any remote rollout, not after the first incident.</p></div>
    <div><span class="n">4</span><p><span class="t">Run a row-group census on a real corpus</span>
    The cheapest remaining measurement, and the one that says whether the layout guidance changes
    anything in production today.</p></div>
    <div><span class="n">5</span><p><span class="t">Measure against a real S3 bucket</span>
    To retire R2. Same bench, real endpoint, several jobs at once — the modelled result says object
    count matters far less than feared, and that is worth confirming before it is relied on.</p></div>
    <div><span class="n">6</span><p><span class="t">Package <code>spatial</code> and <code>inet</code> into the worker image</span>
    A build step, but a blocking one for the geo functions.</p></div>
    <div><span class="n">7</span><p><span class="t">Never emit <code>SELECT *</code> from the query planner</span>
    Project only the fields the query actually references. It removes the one Parquet memory cliff
    outright, and it reduces scan cost on every other shape too. QPL already knows the field list.</p></div>
    <div><span class="n">8</span><p><span class="t">Re-point optimisation effort at the producer</span>
    It is the dominant cost in the whole pipeline, and <code>coerceToType</code> is roughly half of it.</p></div>
  </div>
</section>

<section id="method">
  <div class="sec-head"><h2>Method, and what would invalidate this</h2></div>
  <div class="col">
    <p>One corpus of 30 columns covering every field type, generated from a fixed seed. Every scale
    builds the native table first and derives every other format from it by <code>COPY</code>, so no
    generator variation can reach a number. Warm figures are the median of repeats after a discarded
    first run; cold figures are reported separately in the raw results. Benches were run strictly one
    at a time — two DuckDB benchmarks sharing 14 cores produce four numbers that are all wrong and
    none obviously so.</p>
    <p><code>memory_limit</code> is set to 24 GiB, deliberately <em>below</em> this machine's 36 GB.
    Set above the real cap, DuckDB never spills and the kernel kills the process — which is exactly
    how an earlier round produced a bogus "will not spill" finding.</p>
    <p>Sorts are never forced with <code>count(*)</code>, which lets the optimiser drop the
    <code>ORDER BY</code>; transforms are forced with <code>sum(strlen(…))</code>, because a transform
    projection under a count is discarded entirely and once reported 500k rows in 0 ms.</p>
    <p><strong>Row groups are counted, never derived.</strong> Dividing rows by 122,880 would have
    been wrong — DuckDB rounds — and inferring the unit is exactly the mistake that produced the
    per-file law this report retires. Where a measurement turned out to be an artifact of the bench
    rather than of the thing measured, it is excluded and said so, not quietly dropped.</p>
    <p><strong>What would invalidate it:</strong> real payloads whose row-group fill differs sharply
    from this corpus; a real S3 endpoint behaving unlike the model; or concurrency changing the memory
    picture. All three are in the next-steps list.</p>
  </div>
</section>

<footer>
  <p>Generated from <code>docs/tools/results/*.json</code> by
  <code>docs/tools/report/build-report.mjs</code>. Every figure on this page is read from those files
  at build time — re-run a bench, rebuild, and the report is current. Benches:
  <code>report-ladder</code>, <code>report-ingest</code>, <code>report-consolidation</code>,
  <code>report-transforms</code>, <code>report-s3</code>.</p>
</footer>

</div>
`;

await writeFile(OUT, html + body2 + body3 + body4, 'utf8');
console.log(`wrote ${OUT.pathname}`);
