/**
 * JOIN: parent x child in DuckDB. The shapes QPL actually needs, as raw SQL.
 *
 * **THE DEFAULTS WERE INVALID AND HAVE BEEN CHANGED.** This script used to default to
 * `MEM=6GB THREADS=2`, which describes the api-server - a tier that never runs a join. Three
 * sessions in a row produced worthless join numbers by inheriting those defaults, including a
 * bogus "nested join OOMs and will not spill" finding that came from a memory_limit above the
 * container cap. Joins run in the forked spaces_qpl_worker at **~64 GB**, so that is the
 * default now. See "THE DEPLOYMENT ENVELOPE" in docs/HANDOFF.md.
 *
 * Any number produced at the old defaults is INVALID - do not quote figures from the tables in
 * HANDOFF.md that are flagged as 6GB/2-thread. Re-run here instead.
 *
 * Run:  node packages/data-mate/docs/tools/bench/join-shapes.mjs
 * Squeeze it deliberately (and SAY SO when reporting):  MEM=6GiB THREADS=2 node ...
*/
import { duckdb } from '../lib/duck.mjs';

const { DuckDBInstance } = await duckdb();
const P = Number(process.env.P || 1_000_000);
const C = Number(process.env.C || 20_000_000);
const CARD = Number(process.env.CARD || 1_000_000);
// worker envelope, binary units - DuckDB reads '48GB' as 48x10^9 bytes, not 48 GiB
const MEM = process.env.MEM || '48GiB';
const TH = process.env.THREADS || String(navigator.hardwareConcurrency ?? 8);
const inst = await DuckDBInstance.create(':memory:', { threads: TH, memory_limit: MEM });
const conn = await inst.connect();
await conn.run(`SET preserve_insertion_order=false`);
// temp_directory is what makes whole-dataset-plus-overflow work at all: without it an
// over-limit query FAILS instead of spilling
await conn.run(`SET temp_directory='${process.env.SPILL || '/tmp/duckspill'}'`);
await conn.run(`SET max_temp_directory_size='30GB'`);
const ms = s => Number(process.hrtime.bigint()-s)/1e6;
const T = async (label, sql, note='') => {
  const s = process.hrtime.bigint();
  try { const r = await conn.runAndReadAll(sql);
    console.log(`  ${label.padEnd(44)} ${ms(s).toFixed(0).padStart(7)} ms   ${JSON.stringify(r.getRows()[0].map(String))} ${note}`);
  } catch(e) { console.log(`  ${label.padEnd(44)} ${ms(s).toFixed(0).padStart(7)} ms   FAILED: ${String(e.message).split('\n')[0].slice(0,58)}`); }
};
const envelope = (MEM === '48GiB' ? 'qpl-worker (default)' : 'CUSTOM - report this');
console.log(`envelope: ${envelope} | parent=${P} child=${C} keys=${CARD} threads=${TH} mem=${MEM}`);
let s = process.hrtime.bigint();
await conn.run(`CREATE TABLE parent AS SELECT v AS prow, ('k'||(v % ${CARD})) AS pkey,
  concat('pname-', v%1000) AS pname, (v%100)::INTEGER AS pnum FROM range(${P}) t(v)`);
const bp = ms(s); s = process.hrtime.bigint();
await conn.run(`CREATE TABLE child AS SELECT v AS crow, ('k'||(v % ${CARD})) AS ckey,
  concat('cname-', v%997) AS cname, (v%50)::INTEGER AS cnum FROM range(${C}) t(v)`);
console.log(`  build parent ${bp.toFixed(0)} ms | build child ${ms(s).toFixed(0)} ms\n`);

await T('1. flat join, count', `SELECT count(*) FROM parent p JOIN child c ON p.pkey = c.ckey`);
await T('2. flat join + per-parent LIMIT 10 (fetch:10)',
  `SELECT count(*) FROM (SELECT p.prow, c.crow, row_number() OVER (PARTITION BY p.prow ORDER BY c.crow) rn
     FROM parent p JOIN child c ON p.pkey = c.ckey) WHERE rn <= 10`, '<- fetch is PER PARENT ROW');
await T('3. nested join list() per parent (assign_to)',
  `SELECT count(*), sum(len(kids)) FROM (SELECT p.prow, list({'cname': c.cname, 'cnum': c.cnum}) AS kids
     FROM parent p JOIN child c ON p.pkey = c.ckey GROUP BY p.prow)`);
await T('4. @first per parent (return_index=0)',
  `SELECT count(*) FROM (SELECT p.prow, arg_min(c.cname, c.crow) AS f
     FROM parent p JOIN child c ON p.pkey = c.ckey GROUP BY p.prow)`);
await T('5. LEFT JOIN (skip_if_empty=false)',
  `SELECT count(*) FROM parent p LEFT JOIN child c ON p.pkey = c.ckey`);
await T('6. join+filter+groupBy+order (real pipeline)',
  `SELECT count(*) FROM (SELECT p.pkey, count(*) n, avg(c.cnum) a FROM parent p JOIN child c ON p.pkey = c.ckey
     WHERE c.cnum > 10 GROUP BY p.pkey ORDER BY n DESC LIMIT 1000)`);
console.log(`\n  peak duckdb memory: ${JSON.stringify((await conn.runAndReadAll(`SELECT sum(memory_usage_bytes)/1e9 FROM duckdb_memory()`)).getRows()[0].map(String))} GB`);
conn.disconnectSync();
