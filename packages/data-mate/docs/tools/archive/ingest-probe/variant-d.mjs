// If the input is JS objects, the fastest way into DuckDB may be neither read_json
// (pays JSON.stringify) nor a fully-typed appender (pays JS-side coercion):
// append every value as raw TEXT into a staging table, then run the SAME SQL
// coercion layer. String(v) per value is far cheaper than JSON.stringify per record.
import { DuckDBInstance, DuckDBDataChunk } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { coerceExpr } from '@terascope/data-mate/dist/src/duck-frame/coercion-sql.js';

const ROWS = Number(process.argv[2] ?? 1_000_000);
const REPS = Number(process.argv[3] ?? 3);
const hr = () => Number(process.hrtime.bigint()) / 1e6;
const median = (a) => { const s=[...a].sort((x,y)=>x-y); return s[(s.length-1)>>1]; };
const conn = await (await DuckDBInstance.create(':memory:')).connect();

const F = { _key:'Keyword', host:'Keyword', label:'Text', status:'Keyword', bytes:'Integer',
  total:'Long', duration:'Double', ratio:'Float', level:'Byte', port:'Short', active:'Boolean' };
const KEYS = Object.keys(F);
const CONFIG = { version:1, fields:Object.fromEntries(KEYS.map(k=>[k,{type:F[k]}])) };
const STAGE_DDL = `(${KEYS.map(k=>`${k} VARCHAR`).join(', ')})`;

function lcg(s0){let s=s0>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const r = lcg(7);
const records = Array.from({length:ROWS}, (_,i)=>({
  _key:`k-${i}`, host:`host-${Math.floor(r()*5000)}.example.com`,
  label:`event ${Math.floor(r()*100000)} recorded`, status:['ok','warn','error'][Math.floor(r()*3)],
  bytes:Math.floor(r()*2e6), total:Math.floor(r()*9e9), duration:Math.round(r()*1e6)/1000,
  ratio:Math.round(r()*1e4)/1e4, level:Math.floor(r()*120), port:Math.floor(r()*32000), active:r()>0.5 }));

await conn.run(`CREATE OR REPLACE TABLE probe ${STAGE_DDL}`);
const TYPES = (await conn.run('SELECT * FROM probe LIMIT 0')).columnTypes();
// coerce from a VARCHAR staging column: source 'sql', not 'json'
const SEL = KEYS.map(k=>`${coerceExpr({type:F[k]}, k, {source:'sql'})} AS ${k}`).join(', ');

async function timeIt(label, fn){ await fn(); const runs=[];
  for(let i=0;i<REPS;i++){ global.gc?.(); const t=hr(); await fn(); runs.push(hr()-t); }
  console.log(`  ${label.padEnd(52)} ${median(runs).toFixed(0).padStart(6)} ms`); return median(runs); }

console.log(`rows=${ROWS}\n--- from JS objects ---`);
const dm = await timeIt('A  dm fromJSON(objects)            [TODAY]', async()=>{ DataFrame.fromJSON(CONFIG, records); });
const d = await timeIt('D  text appender -> staging -> SQL coercion', async()=>{
  await conn.run(`CREATE OR REPLACE TABLE stg ${STAGE_DDL}`);
  const app = await conn.createAppender('stg');
  for(let off=0; off<records.length; off+=2048){
    const w = records.slice(off, off+2048);
    const ch = DuckDBDataChunk.create(TYPES, w.length);
    ch.setColumns(KEYS.map(k=>w.map(x=>String(x[k]))));
    app.appendDataChunk(ch);
  }
  app.flushSync(); app.closeSync();
  await conn.run(`CREATE OR REPLACE TABLE final AS SELECT ${SEL} FROM stg`);
});
console.log(`\n  D vs today: ${(dm/d).toFixed(2)}x`);
// sanity: did coercion actually produce typed values?
const chk = await (await conn.run('SELECT sum(bytes)::VARCHAR, sum(level)::VARCHAR, count(*) FILTER (WHERE active)::VARCHAR FROM final')).getRowsJson();
const f2 = DataFrame.fromJSON(CONFIG, records);
const col=(n)=>f2.getColumnOrThrow(n).vector.toJSON();
const sum=(n)=>col(n).reduce((a,b)=>a+Number(b??0),0);
console.log(`  duck : ${JSON.stringify(chk[0])}`);
console.log(`  dm   : ["${sum('bytes')}","${sum('level')}","${col('active').filter(v=>v===true).length}"]`);
