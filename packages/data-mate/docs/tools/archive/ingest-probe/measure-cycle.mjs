// TOTAL CYCLE, not one side. Jared's point: the search API must serialize something
// either way, so moving work to the worker only helps if the SUM drops.
//
// Both options start from the same thing the ES client hands formatData: JS objects.
//   dfjson (today) : search = fromJSON + serialize | worker = deserialize
//   json           : search = JSON.stringify       | worker = read_json + coerce
// Note formatData ALREADY implements both formats, so neither needs new producer code.
import { writeFileSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { buildIngestSql, buildFailureCountSql } from '@terascope/data-mate/dist/src/duck-frame/ingest-sql.js';

const ROWS = Number(process.argv[2] ?? 1_000_000);
const REPS = Number(process.argv[3] ?? 3);
const DIR = new URL('.', import.meta.url).pathname;
const FILE = `${DIR}cycle.json`;
const hr = () => Number(process.hrtime.bigint()) / 1e6;
const median = (a) => { const s=[...a].sort((x,y)=>x-y); return s[(s.length-1)>>1]; };
const conn = await (await DuckDBInstance.create(':memory:')).connect();
const one = async (s) => (await (await conn.run(s)).getRowsJson())[0][0];

const F = { _key:'Keyword', host:'Keyword', label:'Text', status:'Keyword', bytes:'Integer',
  total:'Long', duration:'Double', ratio:'Float', level:'Byte', port:'Short', active:'Boolean' };
const CONFIG = { version:1, fields:Object.fromEntries(Object.keys(F).map(k=>[k,{type:F[k]}])) };
function lcg(s0){let s=s0>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const r = lcg(7);
const records = Array.from({length:ROWS}, (_,i)=>({
  _key:`k-${i}`, host:`host-${Math.floor(r()*5000)}.example.com`,
  label:`event ${Math.floor(r()*100000)} recorded`, status:['ok','warn','error'][Math.floor(r()*3)],
  bytes:Math.floor(r()*2e6), total:Math.floor(r()*9e9), duration:Math.round(r()*1e6)/1000,
  ratio:Math.round(r()*1e4)/1e4, level:Math.floor(r()*120), port:Math.floor(r()*32000), active:r()>0.5 }));
const ingest = buildIngestSql(CONFIG, 'cy', { source: FILE, format:'newline_delimited', mode:'strict' });

async function t(label, fn){ await fn(); const runs=[];
  for(let i=0;i<REPS;i++){ global.gc?.(); const s=hr(); await fn(); runs.push(hr()-s); }
  const m=median(runs); console.log(`  ${label.padEnd(48)} ${m.toFixed(0).padStart(6)} ms`); return m; }

console.log(`rows=${ROWS}\n--- SEARCH SIDE (from JS objects) ---`);
let dfjsonBytes=null, jsonBytes=null;
const sDf = await t('dfjson: fromJSON + serialize   [today]', () => {
  dfjsonBytes = Buffer.from(DataFrame.fromJSON(CONFIG, records).serialize());
});
const sJson = await t('json:   JSON.stringify (ndjson)', () => {
  jsonBytes = Buffer.from(records.map(x=>JSON.stringify(x)).join('\n'));
});
console.log(`     dfjson wire = ${(dfjsonBytes.length/1048576).toFixed(0)}MB, json wire = ${(jsonBytes.length/1048576).toFixed(0)}MB`);

console.log('\n--- WORKER SIDE (from those bytes) ---');
const wDf = await t('dfjson: DataFrame.deserialize', async () => { await DataFrame.deserialize(dfjsonBytes); });
const wJson = await t('json:   write + read_json + strict coerce', async () => {
  writeFileSync(FILE, jsonBytes);
  await conn.run(ingest.sql);
  if (Number(await one(buildFailureCountSql('cy'))) > 0) throw new Error('bad');
});
// dfjson today lands as a DataFrame, not a duck table; to be comparable, add the hop
const wDfToDuck = await t('dfjson: deserialize + stringify + read_json', async () => {
  const f = await DataFrame.deserialize(dfjsonBytes);
  const bi = (_k, v) => (typeof v === 'bigint' ? v.toString() : v);
  writeFileSync(FILE, Buffer.from(f.toArray().map(x=>JSON.stringify(x, bi)).join('\n')));
  await conn.run(ingest.sql);
});

console.log('\n--- TOTALS ---');
console.log(`  today, ends as a DataFrame        : ${(sDf+wDf).toFixed(0)} ms  (${sDf.toFixed(0)} + ${wDf.toFixed(0)})`);
console.log(`  json wire, ends as a DUCK TABLE   : ${(sJson+wJson).toFixed(0)} ms  (${sJson.toFixed(0)} + ${wJson.toFixed(0)})`);
console.log(`  dfjson wire, ends as a DUCK TABLE : ${(sDf+wDfToDuck).toFixed(0)} ms  (${sDf.toFixed(0)} + ${wDfToDuck.toFixed(0)})`);
console.log('\n  (first row ends in a different place than the other two - it is the');
console.log('   current behaviour, not an equivalent-outcome comparison)');
