/**
 * Concurrent appends: interleaved transactions on ONE connection vs a connection per
 * fetcher, and the throughput of each formulation. This is the measurement that found the
 * shared-connection correctness bug.
 *
 * Findings are recorded in docs/HANDOFF.md; this is the script that produced them.
 * Run: node packages/data-mate/docs/tools/bench/append-concurrency.mjs
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
import { tmpdir } from 'node:os'; import { join } from 'node:path';
const inst = await DuckDBInstance.create(':memory:');
const c = await inst.connect();
const d = tmpdir();
const PAYLOADS = 10, ROWS = 50_000;
const files = [];
for (let n = 0; n < PAYLOADS; n++) {
    const f = join(d, `ap-${n}.parquet`);
    await c.run(`COPY (SELECT i AS id, i%97 AS g, ('k' || i) AS k FROM range(${n*ROWS}, ${(n+1)*ROWS}) t(i))
                 TO '${f}' (FORMAT parquet, COMPRESSION zstd)`);
    files.push(f);
}
const DDL = (t='t') => `CREATE OR REPLACE TABLE ${t} (id BIGINT, g BIGINT, k VARCHAR)`;
const ms = (t0) => Number(process.hrtime.bigint() - t0) / 1e6;
const cnt = async (t='t', conn=c) => Number((await (await conn.run(`SELECT count(*) AS n FROM ${t}`)).getRowObjectsJson())[0].n);
const ins = (conn, f, t='t') => conn.run(`INSERT INTO ${t} BY NAME SELECT * FROM read_parquet('${f}')`);

// ---- A. concurrent appends, SEPARATE connection each, SAME table
console.log('=== A. concurrent INSERTs into the SAME table, one connection per fetcher');
await c.run(DDL());
const conns = await Promise.all(files.map(() => inst.connect()));
let t0 = process.hrtime.bigint();
let res = await Promise.allSettled(files.map((f, n) => ins(conns[n], f)));
let bad = res.filter((r) => r.status === 'rejected');
console.log(`   ${res.length - bad.length} ok / ${bad.length} failed in ${ms(t0).toFixed(0)} ms, rows=${await cnt()} (expect ${PAYLOADS*ROWS})`);
if (bad.length) console.log('   failure:', bad[0].reason.message.split('\n')[0]);

// ---- B. same, but each in its own explicit transaction
console.log('\n=== B. same, each wrapped in its own BEGIN/COMMIT on its own connection');
await c.run(DDL());
t0 = process.hrtime.bigint();
res = await Promise.allSettled(files.map(async (f, n) => {
    const conn = conns[n];
    await conn.run('BEGIN TRANSACTION');
    try { await ins(conn, f); await conn.run('COMMIT'); }
    catch (e) { await conn.run('ROLLBACK'); throw e; }
}));
bad = res.filter((r) => r.status === 'rejected');
console.log(`   ${res.length - bad.length} ok / ${bad.length} failed in ${ms(t0).toFixed(0)} ms, rows=${await cnt()} (expect ${PAYLOADS*ROWS})`);
if (bad.length) console.log('   failure:', bad[0].reason.message.split('\n')[0]);

// ---- C. concurrent appends into DIFFERENT tables (different frames), separate connections
console.log('\n=== C. concurrent appends into DIFFERENT tables, own connection + txn each');
for (let n = 0; n < PAYLOADS; n++) await c.run(DDL(`t${n}`));
t0 = process.hrtime.bigint();
res = await Promise.allSettled(files.map(async (f, n) => {
    const conn = conns[n];
    await conn.run('BEGIN TRANSACTION');
    try { await ins(conn, f, `t${n}`); await conn.run('COMMIT'); }
    catch (e) { await conn.run('ROLLBACK'); throw e; }
}));
bad = res.filter((r) => r.status === 'rejected');
console.log(`   ${res.length - bad.length} ok / ${bad.length} failed in ${ms(t0).toFixed(0)} ms`);
if (bad.length) console.log('   failure:', bad[0].reason.message.split('\n')[0]);

// ---- D. THROUGHPUT baselines, sequential
console.log('\n=== D. throughput (500k rows total, 10 payloads x 50k)');
for (const [label, run] of [
    ['sequential INSERT, no explicit txn', async () => { for (const f of files) await ins(c, f); }],
    ['sequential INSERT, BEGIN/COMMIT each', async () => {
        for (const f of files) { await c.run('BEGIN TRANSACTION'); await ins(c, f); await c.run('COMMIT'); } }],
    ['ALL payloads in ONE statement', async () => {
        await c.run(`INSERT INTO t BY NAME SELECT * FROM read_parquet([${files.map((f) => `'${f}'`).join(',')}])`); }],
    ['serialized queue on ONE connection (own txn each)', async () => {
        let chain = Promise.resolve();
        for (const f of files) chain = chain.then(async () => {
            await c.run('BEGIN TRANSACTION'); await ins(c, f); await c.run('COMMIT');
        });
        await chain; }],
]) {
    await c.run(DDL());
    const s = process.hrtime.bigint();
    await run();
    const el = ms(s);
    console.log(`   ${label.padEnd(50)} ${el.toFixed(0).padStart(6)} ms  ${Math.round((PAYLOADS*ROWS)/(el/1000)).toLocaleString().padStart(11)} rows/s  rows=${await cnt()}`);
}
c.disconnectSync(); inst.closeSync();
