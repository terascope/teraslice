// SQL GeoPoint coercion vs UDF over the real parseGeoPoint primitive.
// Imports the dist modules directly, not the data-mate barrel.
import { writeFileSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';
import { coerceExpr } from '@terascope/data-mate/dist/src/duck-frame/coercion-sql.js';
import { registerParseGeoPoint, PARSE_GEO_POINT_UDF } from '@terascope/data-mate/dist/src/duck-frame/udf/geo-point.js';

const N = Number(process.argv[2] ?? 200000);
const REPS = Number(process.argv[3] ?? 3);
const hr = () => Number(process.hrtime.bigint())/1e6;
const med = (a)=>{const s=[...a].sort((x,y)=>x-y);return s[(s.length-1)>>1];};
const conn = await (await DuckDBInstance.create(':memory:')).connect();
registerParseGeoPoint(conn);

// a realistic mix of the three structural forms, so both paths handle everything
function lcg(s0){let s=s0>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const r=lcg(7);
const rows=Array.from({length:N},(_,i)=>{
  const lat=Math.round((r()*180-90)*1000)/1000, lon=Math.round((r()*360-180)*1000)/1000;
  return JSON.stringify({ g: i%3===0 ? {lat,lon} : i%3===1 ? `${lat},${lon}` : [lon,lat] });
});
writeFileSync('./cost.json', rows.join('\n'));
const READ = "read_json('./cost.json', columns={'g':'JSON'}, format='newline_delimited')";

const SQL_EXPR = coerceExpr({ type: 'GeoPoint' }, 'g');
const UDF_EXPR = `${PARSE_GEO_POINT_UDF}(CAST(g AS VARCHAR))`;

async function t(label, expr) {
  const sql = `CREATE OR REPLACE TABLE o AS SELECT (${expr}) AS g FROM ${READ}`;
  await conn.run(sql);
  const runs=[];
  for (let i=0;i<REPS;i++){ global.gc?.(); const s=hr(); await conn.run(sql); runs.push(hr()-s); }
  const m=med(runs);
  console.log(`  ${label.padEnd(38)} ${m.toFixed(0).padStart(6)} ms`);
  return m;
}

console.log(`rows=${N} reps=${REPS}`);
const base = await t('baseline: extract text, no coercion', "g ->> '$'");
const sql  = await t('SQL coercion (structural forms only)', SQL_EXPR);
const udf  = await t('UDF over parseGeoPoint (full parity)', UDF_EXPR);
console.log(`\n  coercion cost above baseline: SQL ${(sql-base).toFixed(0)} ms   UDF ${(udf-base).toFixed(0)} ms`);
console.log(`  UDF / SQL total: ${(udf/sql).toFixed(2)}x    UDF per row: ${(udf*1000/N).toFixed(2)} us`);
// sanity: both produced real points
for (const [l,tb] of [['sql',SQL_EXPR],['udf',UDF_EXPR]]) {
  await conn.run(`CREATE OR REPLACE TABLE chk AS SELECT (${tb}) AS g FROM ${READ}`);
  const c = await (await conn.run('SELECT count(g), round(sum(g.lat),1) FROM chk')).getRowsJson();
  console.log(`  ${l} non-null=${c[0][0]} sum(lat)=${c[0][1]}`);
}
process.exit(0);
