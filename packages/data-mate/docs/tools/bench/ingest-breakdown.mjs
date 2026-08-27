/**
 * Why is `fromRecords` slower than `DataFrame.fromJSON` on the 30-field corpus, when the frame's
 * own docstring records it FASTER on 7 fields (510 ms vs 573 ms at 1M)?
 *
 * The answer is not "DuckDB ingest is slow" - the two measurements use different COLUMN MIXES.
 * `coerceToType` is shared by both engines, so the only difference is what happens after it:
 *
 *   coerce          `coerceToType`, identical on both sides - the shared floor
 *   convert         `makeValueConverter` - build DuckDB's representation (BigInt, timestampValue,
 *                   structValue, listValue). DuckFrame ONLY.
 *   append          hand the typed values across the JS/C++ boundary, 2048 rows per chunk.
 *
 * Part 1 splits those three phases on the real corpus. Part 2 measures cost PER FIELD TYPE against
 * `DataFrame` for the same single-column config, which is what identifies the types worth
 * optimising rather than guessing at them.
 *
 *     node packages/data-mate/docs/tools/bench/ingest-breakdown.mjs
 *     ROWS=1000000 node .../ingest-breakdown.mjs
 */
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { heading, note } from '../lib/duck.mjs';

const require = createRequire(new URL('../../../package.json', import.meta.url));
const dist = (rel) => pathToFileURL(require.resolve(`./dist/src/${rel}`)).href;

const { DuckFrame, closeDuckDatabase } = await import(dist('duck-frame/DuckFrame.js'));
const { DataFrame } = await import(dist('index.js'));
const { coerceToType } = await import(dist('builder/type-coercion.js'));

const { CONFIG, COLUMNS, makeRecords } = await import(
    new URL('../../../bench/comparison/lib/generate.js', import.meta.url).href
);

const ROWS = Number(process.env.ROWS || 500_000);
const RUNS = Number(process.env.RUNS || 3);

/** Median of `RUNS` timed calls, after one discarded warm-up. */
async function median(fn) {
    await fn();
    const samples = [];
    for (let n = 0; n < RUNS; n++) {
        const start = performance.now();
        await fn();
        samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    return samples[Math.floor(samples.length / 2)];
}

function show(label, ms, extra = '') {
    note(`${label.padEnd(38)}${ms.toFixed(0).padStart(7)} ms`
        + `${Math.round(ROWS / (ms / 1000)).toLocaleString()
            .padStart(14)} rows/s  ${extra}`);
}

// ---------------------------------------------------------------- part 1: the phases

heading(`Ingest phases - ${ROWS.toLocaleString()} rows x ${COLUMNS.length} columns`);

const records = makeRecords(ROWS);

/** The per-field coercion functions `fromRecords` builds, rebuilt so the phase runs alone. */
const coercers = COLUMNS.map((name) => {
    const fieldConfig = CONFIG.fields[name];
    // dot-notation children, the way the real field plan resolves them
    const children = Object.fromEntries(
        Object.entries(CONFIG.fields)
            .filter(([path]) => path.startsWith(`${name}.`))
            .map(([path, config]) => [path.slice(name.length + 1), config])
    );
    return {
        name,
        coerce: coerceToType(fieldConfig, Object.keys(children).length ? children : undefined),
    };
});

let sink = 0;
const coerceOnly = await median(async () => {
    for (const record of records) {
        for (const { name, coerce } of coercers) {
            const value = coerce(record[name]);
            if (value != null) sink++;
        }
    }
});
show('coerce only (BOTH engines pay this)', coerceOnly);

const dataFrameCreate = await median(async () => {
    sink += DataFrame.fromJSON(CONFIG, records).size;
});
show('DataFrame.fromJSON (coerce + vectors)', dataFrameCreate);

const duckCreate = await median(async () => {
    const frame = await DuckFrame.fromRecords(CONFIG, records, {});
    sink += await frame.size();
    await frame.destroy();
});
show('DuckFrame.fromRecords (all three)', duckCreate);

note('');
note(`the shared coercion floor is ${((coerceOnly / duckCreate) * 100).toFixed(0)}% of DuckFrame's`
    + ` total and ${((coerceOnly / dataFrameCreate) * 100).toFixed(0)}% of DataFrame's`);
note(`so the ADDRESSABLE difference is ${(duckCreate - dataFrameCreate).toFixed(0)} ms`
    + ` - convert + append minus DataFrame's vector writes`);

// ---------------------------------------------------------------- part 2: per field type

heading(`Cost per FIELD TYPE - ${ROWS.toLocaleString()} rows, one column each`);

const SAMPLES = {
    Keyword: { config: { type: 'Keyword' }, value: (i) => `key-${i}` },
    Boolean: { config: { type: 'Boolean' }, value: (i) => i % 2 === 0 },
    Short: { config: { type: 'Short' }, value: (i) => i % 30000 },
    Integer: { config: { type: 'Integer' }, value: (i) => i % 1000000 },
    Long: { config: { type: 'Long' }, value: (i) => 1000000 + i },
    Double: { config: { type: 'Double' }, value: (i) => i / 7 },
    Date: { config: { type: 'Date' }, value: (i) => 1786669323456 + i },
    'Date (ISO string)': {
        config: { type: 'Date' },
        value: (i) => new Date(1786669323456 + i).toISOString(),
    },
    IP: { config: { type: 'IP' }, value: (i) => `10.0.${i % 255}.${(i * 7) % 255}` },
    GeoPoint: { config: { type: 'GeoPoint' }, value: (i) => ({ lat: i % 90, lon: i % 180 }) },
    'Keyword[] (2)': { config: { type: 'Keyword', array: true }, value: (i) => [`a${i}`, `b${i}`] },
    'Integer[] (3)': { config: { type: 'Integer', array: true }, value: (i) => [i, i + 1, i + 2] },
    'Date[] (2)': {
        config: { type: 'Date', array: true },
        value: (i) => [1786669323456 + i, 1786669323456 + i + 1],
    },
};

note(`${'type'.padEnd(20)}${'DataFrame'.padStart(10)}${'DuckFrame'.padStart(11)}`
    + `${'ratio'.padStart(9)}   ns/value (DuckFrame)`);
note('-'.repeat(74));

const rows = [];
for (const [label, { config, value }] of Object.entries(SAMPLES)) {
    const single = { version: 1, fields: { v: config } };
    const data = Array.from({ length: ROWS }, (_unused, i) => ({ v: value(i) }));

    const df = await median(async () => {
        sink += DataFrame.fromJSON(single, data).size;
    });
    const duck = await median(async () => {
        const frame = await DuckFrame.fromRecords(single, data, {});
        sink += await frame.size();
        await frame.destroy();
    });

    rows.push({ label, df, duck });
    const ratio = duck / df;
    note(`${label.padEnd(20)}${`${df.toFixed(0)} ms`.padStart(10)}`
        + `${`${duck.toFixed(0)} ms`.padStart(11)}`
        + `${`${ratio.toFixed(2)}x`.padStart(9)}   ${((duck * 1e6) / ROWS).toFixed(0)}`
        + `${ratio > 1.5 ? '   <- DuckFrame loses' : ''}`);
}

heading('Where to look first');
const worst = [...rows].sort((a, b) => (b.duck / b.df) - (a.duck / a.df)).slice(0, 4);
for (const r of worst) {
    note(`${r.label.padEnd(20)} ${(r.duck / r.df).toFixed(2)}x`
        + `  (${r.duck.toFixed(0)} ms vs ${r.df.toFixed(0)} ms)`);
}
note('');
note('the verified lever, per docs/HANDOFF.md: the bindings expose a BULK BUFFER path');
note('(vector_get_data / copy_data_to_vector), checked in both directions including validity');
note('masks. It is a bulk memcpy, so it replaces the per-value appender calls - but NOT the');
note('per-value wrapper allocation that the expensive types above spend their time on.');

if (sink === -1) note('unreachable');
await closeDuckDatabase();
