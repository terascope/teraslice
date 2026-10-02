/* eslint-disable no-console -- a probe's output IS its result */
// Which DuckDB integer type carries a data-mate `Long` EXACTLY through Parquet?
// A Long holds int64 from Elasticsearch AND ipToInt's IPv6 results, up to 2^128 - 1.
import { DuckDBInstance } from '@duckdb/node-api';
const dir = process.argv[2];
const c = await (await DuckDBInstance.create(':memory:')).connect();
const VALUES = [
    '9007199254740993',
    '9223372036854775807',
    '-9223372036854775808',
    '42540488320432167789079031612388147199',
    '170141183460469231731687303715884105727',
    '-170141183460469231731687303715884105728',
    '340282366920938463463374607431768211455',
];
for (const type of ['HUGEINT', 'UHUGEINT', 'DECIMAL(38,0)', 'BIGNUM']) {
    const fits = [];
    for (const v of VALUES) {
        try {
            await c.run(`SELECT '${v}'::${type}`);
            fits.push(v);
        } catch { /* out of range */ }
    }
    const file = `${dir}/wide-${type.replace(/\W/g, '')}.parquet`;
    try {
        await c.run(`COPY (SELECT i, v::${type} v FROM (VALUES ${fits.map((v, i) => `(${i}, '${v}')`).join(',')}) t(i, v)) TO '${file}' (FORMAT parquet, COMPRESSION zstd)`);
        const back = (await c.runAndReadAll(`SELECT v::VARCHAR, typeof(v) FROM '${file}' ORDER BY i`)).getRows();
        const phys = (await c.runAndReadAll(`SELECT type, logical_type, converted_type FROM parquet_schema('${file}') WHERE name = 'v'`)).getRows();
        const exact = back.every(([s], i) => s.replace(/\.0$/, '') === fits[i] && !s.includes('e') && !s.endsWith('.0'));
        console.log(`${type.padEnd(14)} holds ${fits.length}/${VALUES.length}  parquet=${JSON.stringify(phys[0])}  reads back as ${back[0]?.[1]}  exact=${exact}`);
        if (!exact) back.forEach(([s], i) => s !== fits[i] && console.log(`      ${fits[i]} -> ${s}`));
    } catch (e) {
        console.log(`${type.padEnd(14)} holds ${fits.length}/${VALUES.length}  COPY FAIL: ${e.message.split('\n')[0]}`);
    }
}
process.exit(0);
