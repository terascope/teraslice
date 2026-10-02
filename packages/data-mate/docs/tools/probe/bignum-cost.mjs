/* eslint-disable no-console -- a probe's output IS its result */
// BIGNUM is the only DuckDB integer that holds every data-mate Long (int64 + ipToInt's 128-bit
// IPv6) AND survives Parquet exactly. What does it support, and what does it cost vs BIGINT /
// HUGEINT?
import { DuckDBInstance } from '@duckdb/node-api';
const c = await (await DuckDBInstance.create(`${process.argv[2]}/bignum.duckdb`)).connect();
const q = async (s) => (await c.runAndReadAll(s)).getRows();
const tryQ = async (label, s) => {
    try {
        console.log(`  ok   ${label}: ${JSON.stringify(await q(s), (_, v) => (typeof v === 'bigint' ? `${v}` : v))}`);
    } catch (e) {
        console.log(`  FAIL ${label}: ${e.message.split('\n')[0]}`);
    }
};

console.log('### support (the operations a Long field and the Long emissions use)');
const B = `'340282366920938463463374607431768211455'::BIGNUM`;
await tryQ('compare to int literal', `SELECT ${B} > 5, '5'::BIGNUM = 5`);
await tryQ('add / subtract', `SELECT ${B} - 1, '5'::BIGNUM + 3`);
await tryQ('multiply / divide / modulus', `SELECT '6'::BIGNUM * 7, '7'::BIGNUM // 2, '7'::BIGNUM % 2`);
await tryQ('abs / negate', `SELECT abs('-5'::BIGNUM), -('5'::BIGNUM)`);
await tryQ('sum / min / max / avg', `SELECT sum(v), min(v), max(v), avg(v) FROM (VALUES ('1'::BIGNUM), ('2'::BIGNUM)) t(v)`);
await tryQ('ORDER BY is numeric', `SELECT list(v::VARCHAR ORDER BY v) FROM (VALUES ('10'::BIGNUM), ('9'::BIGNUM), ('-1'::BIGNUM)) t(v)`);
await tryQ('to_json', `SELECT to_json('9007199254740993'::BIGNUM)::VARCHAR`);
await tryQ('cast to DOUBLE / BIGINT / VARCHAR', `SELECT '12'::BIGNUM::DOUBLE, '12'::BIGNUM::BIGINT, ${B}::VARCHAR`);
await tryQ('BETWEEN', `SELECT '5'::BIGNUM BETWEEN 1 AND 10`);
await tryQ('from VARCHAR column read off parquet', `SELECT ('123'::VARCHAR)::BIGNUM + 1`);

console.log('\n### cost, 10M rows, file-backed, CHECKPOINTed; median of 5 warm runs');
const N = 10_000_000;
for (const t of ['BIGINT', 'HUGEINT', 'BIGNUM']) {
    await c.run(`CREATE OR REPLACE TABLE t_${t} AS SELECT (i * 7919 % 1000003)::${t} v, (i % 100)::BIGINT g FROM range(${N}) r(i)`);
}
await c.run('CHECKPOINT');
const med = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const time = async (sql) => {
    const r = [];
    let out;
    for (let k = 0; k < 6; k++) {
        const t0 = process.hrtime.bigint();
        out = await q(sql);
        if (k) {
            r.push(Number(process.hrtime.bigint() - t0) / 1e6);
        }
    }
    return [med(r), out];
};
const SHAPES = {
    'filter count(v > X)': (t) => `SELECT count(*) FROM t_${t} WHERE v > 500000`,
    'sum(v)': (t) => `SELECT sum(v)::VARCHAR FROM t_${t}`,
    'group by g, sum(v)': (t) => `SELECT sum(s)::VARCHAR FROM (SELECT g, sum(v) s FROM t_${t} GROUP BY g)`,
    'order by v limit 10': (t) => `SELECT list(v::VARCHAR) FROM (SELECT v FROM t_${t} ORDER BY v DESC LIMIT 10)`,
    'render to text': (t) => `SELECT sum(strlen(v::VARCHAR)) FROM t_${t}`,
};
for (const [name, sql] of Object.entries(SHAPES)) {
    const row = [];
    let ref;
    for (const t of ['BIGINT', 'HUGEINT', 'BIGNUM']) {
        const [ms, out] = await time(sql(t));
        const same = ref === undefined ? (ref = JSON.stringify(out, (_, v) => `${v}`), true) : JSON.stringify(out, (_, v) => `${v}`) === ref;
        row.push(`${t} ${ms.toFixed(1)}ms${same ? '' : ' (RESULT DIFFERS)'}`);
    }
    console.log(`  ${name.padEnd(22)} ${row.join('   ')}`);
}
for (const t of ['BIGINT', 'HUGEINT', 'BIGNUM']) await c.run(`COPY (SELECT v FROM t_${t}) TO '${process.argv[2]}/cost-${t}.parquet' (FORMAT parquet, COMPRESSION zstd)`);
const { statSync } = await import('node:fs');
console.log('\n### parquet+zstd size of the column:', ['BIGINT', 'HUGEINT', 'BIGNUM'].map((t) => `${t} ${(statSync(`${process.argv[2]}/cost-${t}.parquet`).size / 1e6).toFixed(1)} MB`).join('   '));
console.log('threads:', JSON.stringify(await q(`SELECT current_setting('threads')`), (_, v) => `${v}`));
process.exit(0);
