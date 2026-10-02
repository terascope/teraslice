/* eslint-disable no-console -- a probe's output IS its result */
// Does a Long survive the Parquet wire? Top level and inside a STRUCT, via DuckFrame and raw
// DuckDB.
import { DuckDBInstance } from '@duckdb/node-api';
import { DuckFrame } from '../../../dist/src/duck-frame/index.js';
import { FieldType as T } from '@terascope/types';

const dir = process.argv[2];
const vals = ['9007199254740993', '9223372036854775807', '-9223372036854775808'];
const collect = async (it) => {
    const o = [];
    for await (const r of it) {
        o.push(r);
    }
    return o;
};

for (const [label, fields, rec] of [
    ['top-level Long', { n: { type: T.Long } }, (v) => ({ n: v })],
    ['Long in object', { o: { type: T.Object }, 'o.n': { type: T.Long } }, (v) => ({ o: { n: v } })],
]) {
    const config = { version: 1, fields };
    const f = await DuckFrame.fromRecords(config, vals.map(rec));
    const file = `${dir}/long-${label.replace(/\W/g, '')}.parquet`;
    await f.writeParquet(file);
    const back = await DuckFrame.fromParquet(config, file);
    console.log(label, '\n  in memory  ', JSON.stringify(await collect(f.rows())), '\n  via parquet', JSON.stringify(await collect(back.rows())));
    await f.destroy();
    await back.destroy();
}

const c = await (await DuckDBInstance.create(':memory:')).connect();
for (const t of ['BIGINT', 'HUGEINT']) {
    await c.run(`COPY (SELECT 9007199254740993::${t} v) TO '${dir}/raw-${t}.parquet'`);
    const r = await c.runAndReadAll(`SELECT v::VARCHAR, typeof(v) FROM '${dir}/raw-${t}.parquet'`);
    const s = await c.runAndReadAll(`SELECT type, logical_type FROM parquet_schema('${dir}/raw-${t}.parquet') WHERE name = 'v'`);
    console.log(`raw ${t} -> parquet ->`, JSON.stringify(r.getRows()), 'physical:', JSON.stringify(s.getRows()));
}
process.exit(0);
