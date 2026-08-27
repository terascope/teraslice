// Generic coerceToType UDF vs my hand-written SQL: parity AND cost.
import { writeFileSync } from 'node:fs';
import { DuckDBInstance, BIGINT, DOUBLE, VARCHAR, BOOLEAN, TIMESTAMP } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { coerceExpr } from '@terascope/data-mate/dist/src/duck-frame/coercion-sql.js';
import { registerFieldCoercion } from '@terascope/data-mate/dist/src/duck-frame/udf/coerce-field.js';

const N = Number(process.argv[2] ?? 1000000), REPS = Number(process.argv[3] ?? 3);
const hr = () => Number(process.hrtime.bigint())/1e6;
const med = (a)=>{const s=[...a].sort((x,y)=>x-y);return s[(s.length-1)>>1];};
const conn = await (await DuckDBInstance.create(':memory:')).connect();

// one UDF per field, driven by its config
const FIELDS = [
  ['bytes','Integer', BIGINT, 'BIGINT'], ['level','Byte', BIGINT, 'BIGINT'],
  ['duration','Double', DOUBLE, 'DOUBLE'], ['created','Date', TIMESTAMP, 'TIMESTAMP'],
  ['active','Boolean', BOOLEAN, 'BOOLEAN'], ['host','Keyword', VARCHAR, 'VARCHAR'],
];
for (const [f, type, rt, tn] of FIELDS) registerFieldCoercion(conn, `dm_c_${f}`, { type }, rt, tn);

// --- PARITY on the inputs SQL gets wrong ---
console.log('--- parity on SQL\'s known divergences ---');
const dm=(t,v)=>{try{const fr=DataFrame.fromJSON({version:1,fields:{v:{type:t}}},[{v}]);const o=fr.getColumnOrThrow('v').vector.toJSON()[0];return o==null?'NULL':String(o);}catch(e){return 'FAIL';}};
const run=async(expr,v)=>{writeFileSync('./cu.json',JSON.stringify({v}));
  try{const r=await(await conn.run(`SELECT (${expr})::VARCHAR FROM read_json('./cu.json', columns={'v':'JSON'}, format='newline_delimited')`)).getRowsJson();return r[0][0]??'NULL';}catch(e){return 'ERR';}};
const norm=(x)=>String(x).replace(/\.0+$/,'');
let sqlOk=0, udfOk=0, total=0;
for (const [t, f, vals] of [
  ['Integer','bytes',['0o17', 127, '1e3', '1,000', 12.7, 'bad', null]],
  ['Byte','level',[127, -128, 100, '0o17']],
  ['Date','created',['2026-01-02T03:04:05.000Z','1710028800000','01/02/2026','0','2026',null]],
]) {
  for (const v of vals) {
    total++;
    const a=dm(t,v), s=await run(coerceExpr({type:t},'v'),v), u=await run(`dm_c_${f}(CAST(v AS VARCHAR))`,v);
    const sOk=norm(a)===norm(s)||(a==='FAIL'&&s==='NULL'), uOk=norm(a)===norm(u)||(a==='FAIL'&&u==='NULL');
    if(sOk)sqlOk++; if(uOk)udfOk++;
    console.log(`  ${t}:${String(v).slice(0,26).padEnd(28)} utils=${String(a).slice(0,26).padEnd(28)} sql=${sOk?'ok  ':'DIFF'} udf=${uOk?'ok':'DIFF ('+u+')'}`);
  }
}
console.log(`\n  SQL ${sqlOk}/${total}   coerceToType UDF ${udfOk}/${total}`);

// --- COST over a realistic mixed set ---
function lcg(s0){let s=s0>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const r=lcg(7);
writeFileSync('./cu-big.json', Array.from({length:N},(_,i)=>JSON.stringify({
  bytes: i%7===0 ? '1e3' : Math.floor(r()*2e6),
  duration: Math.round(r()*1e6)/1000,
  created: i%2===0 ? '2026-01-02T03:04:05.000Z' : 1710028800000,
  active: r()>0.5, host: `host-${i%5000}`,
})).join('\n'));
const READ = "read_json('./cu-big.json', columns={'bytes':'JSON','duration':'JSON','created':'JSON','active':'JSON','host':'JSON'}, format='newline_delimited')";
const SQL_SEL = ['bytes','duration','created','active','host'].map((f,i)=>
  `${coerceExpr({type:['Integer','Double','Date','Boolean','Keyword'][i]}, f)} AS ${f}`).join(', ');
const UDF_SEL = ['bytes','duration','created','active','host'].map(f=>`dm_c_${f}(CAST(${f} AS VARCHAR)) AS ${f}`).join(', ');
async function t(label, sel){
  const sql=`CREATE OR REPLACE TABLE o AS SELECT ${sel} FROM ${READ}`;
  await conn.run(sql); const runs=[];
  for(let i=0;i<REPS;i++){ global.gc?.(); const s=hr(); await conn.run(sql); runs.push(hr()-s); }
  const nn=(await(await conn.run('SELECT count(bytes), count(created) FROM o')).getRowsJson())[0];
  console.log(`  ${label.padEnd(34)} ${med(runs).toFixed(0).padStart(6)} ms   non-null bytes=${nn[0]} created=${nn[1]}`);
  return med(runs);
}
console.log(`\n--- cost, ${N} rows x 5 fields ---`);
const s=await t('hand-written SQL', SQL_SEL);
const u=await t('coerceToType UDF per field', UDF_SEL);
console.log(`\n  UDF / SQL: ${(u/s).toFixed(2)}x`);
process.exit(0);
