/**
 * STEP 4 — the three httpfs caches, ON vs OFF, measured in BYTES not just time.
 *
 * **This is the highest-value configuration decision for remote Parquet, and
 * all three caches are OFF in DuckDB by default.** Locally, turning them on took
 * a two-predicate search from transferring 40.7 MB to 5 KB.
 *
 *   enable_http_metadata_cache   caches HTTP HEAD results (object size, etag)
 *   parquet_metadata_cache       caches parsed Parquet footers
 *   httpfs_connection_caching    reuses connections instead of reconnecting
 *
 * **Why bytes and not only milliseconds.** Against a nearby endpoint the time
 * difference can be small while the byte difference is enormous; against a
 * distant or busy one the same byte difference dominates. Timing alone cannot
 * tell a cache hit from a warm OS page cache — the byte counter can.
 *
 * Each profile runs in a FRESH connection, because a cache that persisted from
 * the previous profile would make the OFF measurement meaningless.
 */
import { s3Glob, config } from '../lib/env.mjs';
import { open, measureQuery } from '../lib/duck.mjs';
import { buildBattery } from '../lib/queries.mjs';
import {
    heading, note, table, ms, bytes, save, explain,
} from '../lib/report.mjs';

const glob = s3Glob();
const T = `read_parquet('${glob}')`;

const PROFILES = [
    ['all OFF (DuckDB default)', { httpMetadata: false, parquetMetadata: false, connection: false, externalFile: false }],
    ['parquet_metadata_cache only', { httpMetadata: false, parquetMetadata: true, connection: false, externalFile: false }],
    ['all ON (recommended)', { httpMetadata: true, parquetMetadata: true, connection: true, externalFile: true }],
];

try {
    // Profile the corpus once, on its own connection, so every cache profile
    // runs an identical battery.
    const probe = await open();
    const schema = await probe.rows(`DESCRIBE SELECT * FROM ${T}`);
    const columns = [];
    for (const [name, type] of schema) {
        let approxDistinct = null;
        try {
            approxDistinct = Number(await probe.one(
                `SELECT approx_count_distinct("${String(name).replace(/"/g, '""')}")
                 FROM (SELECT * FROM ${T} LIMIT 100000)`
            ));
        } catch { /* unclassifiable type */ }
        columns.push({
            name,
            type,
            approxDistinct,
            lowCardinality: approxDistinct !== null && approxDistinct > 1 && approxDistinct <= 1000,
            highCardinality: approxDistinct !== null && approxDistinct > 10_000,
        });
    }
    probe.close();

    // The wide top-N is excluded: it can fail for MEMORY reasons, which would
    // confound a measurement about caching.
    const battery = buildBattery(columns).filter((s) => !s.dangerous);

    heading(`CACHE PROFILES — ${battery.length} shapes each, median of ${config.repeats}`);
    note(`reading ${glob}`);
    note('Each profile uses a FRESH connection so no cache survives between them.');
    note('');

    const measured = [];

    for (const [label, caches] of PROFILES) {
        const session = await open({ caches });
        const rows = [];
        try {
            for (const shape of battery) {
                const sql = shape.sql.replaceAll('{{T}}', T);
                try {
                    const m = await measureQuery(session, sql, config.repeats);
                    rows.push({
                        key: shape.key,
                        label: shape.label,
                        median: m.median,
                        bytes: m.coldBytes,
                    });
                } catch (err) {
                    rows.push({ key: shape.key, label: shape.label, failed: String(err.message).split('\n')[0] });
                }
            }
        } finally {
            session.close();
        }
        measured.push({ profile: label, caches, rows });

        const ok = rows.filter((r) => !r.failed);
        note(`${label}:`);
        const totalBytes = ok.every((r) => r.bytes === null)
            ? null
            : ok.reduce((a, r) => a + (r.bytes ?? 0), 0);
        note(`   total ${ms(ok.reduce((a, r) => a + r.median, 0))}, ${bytes(totalBytes)} read`);
    }

    heading('PER SHAPE — time');
    table(
        ['shape', ...PROFILES.map(([l]) => l)],
        battery.map((shape) => [
            shape.label,
            ...measured.map((m) => {
                const row = m.rows.find((r) => r.key === shape.key);
                return row?.failed ? 'FAILED' : ms(row.median);
            }),
        ])
    );

    heading('PER SHAPE — bytes read');
    note('This is the column that decides the setting: it separates a real cache hit');
    note('from a warm OS page cache, which timing alone cannot do. "n/a" means the');
    note('profiler did not report a byte count, so only the timings are valid.');
    note('');
    table(
        ['shape', ...PROFILES.map(([l]) => l)],
        battery.map((shape) => [
            shape.label,
            ...measured.map((m) => {
                const row = m.rows.find((r) => r.key === shape.key);
                return row?.failed ? '-' : bytes(row.bytes);
            }),
        ])
    );

    heading('THE VERDICT');
    const off = measured[0];
    const on = measured[measured.length - 1];
    const sum = (m, field) => m.rows
        .filter((r) => !r.failed)
        .reduce((a, r) => a + (r[field] ?? 0), 0);

    const timeOff = sum(off, 'median');
    const timeOn = sum(on, 'median');
    const bytesOff = sum(off, 'bytes');
    const bytesOn = sum(on, 'bytes');
    const bytesKnown = off.rows.some((r) => r.bytes !== null && r.bytes !== undefined);

    table(
        ['measure', 'all OFF', 'all ON', 'ratio'],
        [
            ['battery time', ms(timeOff), ms(timeOn), `${(timeOff / Math.max(timeOn, 0.001)).toFixed(2)}x`],
            ['bytes read',
                bytesKnown ? bytes(bytesOff) : 'n/a',
                bytesKnown ? bytes(bytesOn) : 'n/a',
                bytesKnown && bytesOn > 0 ? `${(bytesOff / bytesOn).toFixed(1)}x` : 'n/a'],
        ]
    );

    note('');
    note('These caches cost memory and nothing else, and they are OFF by default.');
    note('Turn all three on in the worker unless this table says otherwise for');
    note('your endpoint. The setting names are in s3.env.');

    save('caches', { table: T, profiles: measured });

    heading('NEXT');
    note('./run.sh layout   — query cost against the row-group and object census');
} catch (err) {
    explain(err);
    process.exit(1);
}
