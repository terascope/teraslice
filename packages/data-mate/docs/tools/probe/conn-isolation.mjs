// Is the stream truncation a DuckDB limit, or a single-CONNECTION limit?
// A: stream + interleaved queries on the SAME connection
// B: stream on conn1, interleaved queries on conn2 (same instance)
// C: two streams concurrently on two connections
import api from 'file:///Users/jarednoble/Projects/terascope/teraslice/node_modules/.pnpm/@duckdb+node-api@1.5.5-r.3/node_modules/@duckdb/node-api/lib/index.js';

const { DuckDBInstance } = api;
const N = 500_000;

const inst = await DuckDBInstance.create(':memory:');
const c1 = await inst.connect();
const c2 = await inst.connect();
await c1.run(`CREATE TABLE t AS SELECT v AS i, 'x'||v AS s FROM range(${N}) t(v)`);

async function drain(conn, sql, onChunk) {
    const r = await conn.stream(sql);
    let rows = 0;
    for (;;) {
        const chunk = await r.fetchChunk();
        if (chunk == null || chunk.rowCount === 0) break;
        rows += chunk.rowCount;
        if (onChunk) await onChunk(rows);
    }
    return rows;
}

let interleaved = 0;
const A = await drain(c1, 'SELECT * FROM t', async (rows) => {
    if (rows % 100_000 < 2048) { await c1.runAndReadAll('SELECT count(*) FROM t'); interleaved++; }
});
console.log(`A same connection, ${interleaved} interleaved queries : ${A} / ${N} rows  ${A === N ? 'OK' : '<-- TRUNCATED'}`);

interleaved = 0;
const B = await drain(c1, 'SELECT * FROM t', async (rows) => {
    if (rows % 100_000 < 2048) { await c2.runAndReadAll('SELECT count(*) FROM t'); interleaved++; }
});
console.log(`B other connection, ${interleaved} interleaved queries: ${B} / ${N} rows  ${B === N ? 'OK' : '<-- TRUNCATED'}`);

const [C1, C2] = await Promise.all([
    drain(c1, 'SELECT * FROM t WHERE i % 2 = 0'),
    drain(c2, 'SELECT * FROM t WHERE i % 2 = 1'),
]);
console.log(`C two concurrent streams, two connections   : ${C1} + ${C2} = ${C1 + C2} / ${N}  ${C1 + C2 === N ? 'OK' : '<-- WRONG'}`);

// and: can two connections run heavy queries at once without error?
const t0 = process.hrtime.bigint();
const both = await Promise.all([
    c1.runAndReadAll('SELECT count(*), sum(i) FROM t'),
    c2.runAndReadAll('SELECT count(*), avg(i) FROM t'),
]);
console.log(`D two concurrent aggregates                 : ${both.map((r) => r.getRows()[0].map(String).join('/')).join('  ')} in ${(Number(process.hrtime.bigint() - t0) / 1e6).toFixed(0)} ms`);

c1.disconnectSync();
c2.disconnectSync();
