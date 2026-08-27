// Option 2: DuckDB on the search side -> COPY TO Parquet -> worker read_parquet.
// Plus gzip cost/benefit for every format, since Jared cares about TIME not size.
//
// APPLES-TO-APPLES: every option starts from the same JS objects (what formatData
// gets) and ends with a QUERYABLE DUCKDB TABLE on the worker. dfjson is shown too but
// ends at a DataFrame - noted, not compared as equivalent.
//
// Note option 2's producer is NOT free: getting objects into DuckDB on the search side
// costs the same as it would on the worker. What it buys is a worker side with no
// coercion at all, because Parquet is typed and schema-carrying.
import { writeFileSync, statSync, readFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { DuckDBInstance } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { prepareObjectIngest, serializeRecords } from '@terascope/data-mate/dist/src/duck-frame/object-ingest.js';
import { buildFailureCountSql } from '@terascope/data-mate/dist/src/duck-frame/ingest-sql.js';

const ROWS = Number(process.argv[2] ?? 1_000_000);
const REPS = Number(process.argv[3] ?? 3);
const D = new URL('.', import.meta.url).pathname;
const hr = () => Number(process.hrtime.bigint()) / 1e6;
const med = (a) => { const s=[...a].sort((x,y)=>x-y); return s[(s.length-1)>>1]; };
const MB = (p) => (statSync(p).size/1048576).toFixed(1);
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

const NDJSON=`${D}p-nd.json`, NDGZ=`${D}p-nd.json.gz`, PQ_NONE=`${D}p-none.parquet`,
      PQ_SNAP=`${D}p-snap.parquet`, PQ_ZSTD=`${D}p-zstd.parquet`, DFJSON=`${D}p-df.bin`;
const prep = prepareObjectIngest(CONFIG, 'srch', records, { source: NDJSON });

async function t(label, fn){ await fn(); const runs=[];
  for(let i=0;i<REPS;i++){ global.gc?.(); const s=hr(); await fn(); runs.push(hr()-s); }
  const m=med(runs); console.log(`  ${label.padEnd(50)} ${m.toFixed(0).padStart(6)} ms`); return m; }

console.log(`rows=${ROWS}\n===== SEARCH SIDE (producer) =====`);
const pDf = await t('dfjson: fromJSON + serialize        [today]', () => {
  writeFileSync(DFJSON, Buffer.from(DataFrame.fromJSON(CONFIG, records).serialize()));
});
const pNd = await t('ndjson: JSON.stringify + write', () => {
  writeFileSync(NDJSON, serializeRecords(records));
});
const pNdGz = await t('ndjson + gzip: stringify + gzip + write', () => {
  writeFileSync(NDGZ, gzipSync(serializeRecords(records)));
});
// option 2: build the table here (this IS the coercion/validation step), then COPY
writeFileSync(NDJSON, prep.bytes);
const pTable = await t('  (opt2 step A) objects -> duck table+coerce', async () => {
  writeFileSync(NDJSON, serializeRecords(records));
  await conn.run(prep.sql);
  if (Number(await one(buildFailureCountSql('srch'))) > 0) throw new Error('bad');
  await conn.run('ALTER TABLE srch DROP COLUMN _dm_coerce_failed');
});
const copies = {};
for (const [label, path, codec] of [['none',PQ_NONE,'uncompressed'],['snappy',PQ_SNAP,'snappy'],['zstd',PQ_ZSTD,'zstd']]) {
  copies[label] = await t(`  (opt2 step B) COPY TO parquet (${codec})`, async () => {
    await conn.run(`COPY srch TO '${path}' (FORMAT parquet, COMPRESSION ${codec})`);
  });
}

console.log('\n===== WIRE SIZE =====');
const gzOf = (p) => { const s=hr(); const b=gzipSync(readFileSync(p)); return { ms:hr()-s, mb:(b.length/1048576).toFixed(1) }; };
console.log(`  dfjson              ${MB(DFJSON).padStart(7)} MB   gzip -> ${(()=>{const g=gzOf(DFJSON);return `${g.mb} MB in ${g.ms.toFixed(0)} ms`;})()}`);
console.log(`  ndjson              ${MB(NDJSON).padStart(7)} MB   gzip -> ${(()=>{const g=gzOf(NDJSON);return `${g.mb} MB in ${g.ms.toFixed(0)} ms`;})()}`);
console.log(`  parquet none        ${MB(PQ_NONE).padStart(7)} MB   gzip -> ${(()=>{const g=gzOf(PQ_NONE);return `${g.mb} MB in ${g.ms.toFixed(0)} ms`;})()}`);
console.log(`  parquet snappy      ${MB(PQ_SNAP).padStart(7)} MB   (internal, no gzip needed)`);
console.log(`  parquet zstd        ${MB(PQ_ZSTD).padStart(7)} MB   (internal, no gzip needed)`);

console.log('\n===== WORKER SIDE (consumer) =====');
const wDf = await t('dfjson: DataFrame.deserialize  [-> DataFrame]', async () => {
  await DataFrame.deserialize(readFileSync(DFJSON));
});
const wNd = await t('ndjson: read_json + strict coerce', async () => {
  await conn.run(prep.sql.replace('TABLE srch', 'TABLE w1'));
});
const wNdGz = await t('ndjson.gz: read_json(gzip) + coerce  [C++ gunzip]', async () => {
  await conn.run(prep.sql.replace('TABLE srch','TABLE w2').replace(`'${NDJSON}'`, `'${NDGZ}'`)
    .replace("format = 'newline_delimited'", "format = 'newline_delimited', compression = 'gzip'"));
});
const wPq = {};
for (const [label, path] of [['none',PQ_NONE],['snappy',PQ_SNAP],['zstd',PQ_ZSTD]]) {
  wPq[label] = await t(`parquet ${label}: read_parquet (NO coercion needed)`, async () => {
    await conn.run(`CREATE OR REPLACE TABLE wp_${label} AS SELECT * FROM read_parquet('${path}')`);
  });
}

console.log('\n===== TOTALS (producer + consumer, ending in a duck table) =====');
const rows = [
  ['ndjson',                 pNd,   wNd],
  ['ndjson + gzip',          pNdGz, wNdGz],
  ['opt2 parquet none',      pTable + copies.none,   wPq.none],
  ['opt2 parquet snappy',    pTable + copies.snappy, wPq.snappy],
  ['opt2 parquet zstd',      pTable + copies.zstd,   wPq.zstd],
];
for (const [l,p,w] of rows) console.log(`  ${l.padEnd(24)} ${(p+w).toFixed(0).padStart(6)} ms   (producer ${p.toFixed(0)} + worker ${w.toFixed(0)})`);
console.log(`  ${'dfjson [-> DataFrame]'.padEnd(24)} ${(pDf+wDf).toFixed(0).padStart(6)} ms   (producer ${pDf.toFixed(0)} + worker ${wDf.toFixed(0)})  <- different end state`);

// correctness: parquet must round-trip the values
const chk = async (tbl) => (await (await conn.run(`SELECT sum(bytes)::VARCHAR||'|'||sum(total)::VARCHAR||'|'||count(*) FILTER (WHERE active)::VARCHAR FROM ${tbl}`)).getRowsJson())[0][0];
console.log('\n  fingerprint w1 (ndjson)     :', await chk('w1'));
console.log('  fingerprint wp_zstd (parquet):', await chk('wp_zstd'));
