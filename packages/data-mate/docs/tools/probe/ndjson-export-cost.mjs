/* eslint-disable no-console -- a probe's output IS its result */
// What writeNDJSON costs, 1M rows, both spaces presets. Run before and after a change to the
// JSON renderer; the file is rewritten each run so the timing includes DuckDB writing it.
import { rmSync, statSync } from 'node:fs';
import { TealFrame } from '../../../dist/src/teal-frame/index.js';
import { FieldType as T } from '@terascope/types';

const dir = process.argv[2];
const N = Number(process.argv[3] ?? 1_000_000);
const config = {
    version: 1,
    fields: {
        _key: { type: T.Keyword },
        count: { type: T.Integer },
        total: { type: T.Long },
        score: { type: T.Double },
        active: { type: T.Boolean },
        created: { type: T.Date },
        ip: { type: T.IP },
        location: { type: T.GeoPoint },
        tags: { type: T.Keyword, array: true },
        meta: { type: T.Object },
        'meta.source': { type: T.Keyword },
        'meta.depth': { type: T.Integer },
        'meta.seen': { type: T.Date },
        items: { type: T.Object, array: true },
        'items.sku': { type: T.Keyword },
        'items.qty': { type: T.Integer },
    },
};
const frame = await TealFrame.create(config);
// build the rows in SQL so ingest time is not what is measured; every 3rd row is sparse
await frame.rawRows(`INSERT INTO ${frame.from} SELECT
    'k' || i, i % 1000, i * 7919, CASE WHEN i % 3 = 0 THEN NULL ELSE i / 7.0 END, i % 2 = 0,
    TIMESTAMP '2026-01-01' + INTERVAL (i) SECOND, '10.0.' || (i % 250) || '.' || (i % 200),
    {'lat': (i % 90) + 0.5, 'lon': (i % 180) + 0.25},
    CASE WHEN i % 3 = 0 THEN NULL ELSE ['a' || (i % 7), 'b'] END,
    CASE WHEN i % 3 = 0 THEN NULL ELSE {'source': 'api', 'depth': CASE WHEN i % 2 = 0 THEN NULL ELSE i % 9 END,
        'seen': TIMESTAMP '2026-02-02' + INTERVAL (i) MINUTE} END,
    CASE WHEN i % 3 = 0 THEN NULL ELSE [{'sku': 's' || (i % 50), 'qty': i % 4}, {'sku': 'x', 'qty': NULL}] END
    FROM range(${N}) r(i)`);

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
for (const [label, options] of [['default', {}], ['preserveNullFields', { removeNullFields: false }]]) {
    const times = [];
    let bytes = 0;
    for (let run = 0; run < 5; run++) {
        const file = `${dir}/export-${label}.ndjson`;
        rmSync(file, { force: true });
        const start = process.hrtime.bigint();
        await frame.writeNDJSON(file, options);
        times.push(Number(process.hrtime.bigint() - start) / 1e6);
        bytes = statSync(file).size;
    }
    console.log(`${label.padEnd(20)} median ${median(times).toFixed(0)} ms  (runs ${times.map((t) => t.toFixed(0)).join(', ')})  ${(bytes / 1e6).toFixed(1)} MB`);
}
await frame.destroy();
process.exit(0);
