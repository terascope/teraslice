// End-to-end: JS objects -> prepareObjectIngest -> DuckDB table, matching data-mate.
import { writeFileSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { prepareObjectIngest } from '@terascope/data-mate/dist/src/duck-frame/object-ingest.js';
import { buildFailureCountSql } from '@terascope/data-mate/dist/src/duck-frame/ingest-sql.js';

const conn = await (await DuckDBInstance.create(':memory:')).connect();
const FILE = './vo.json';
const CONFIG = { version:1, fields:{
  _key:{type:'Keyword'}, n:{type:'Integer'}, big:{type:'Long'},
  d:{type:'Double'}, ok:{type:'Boolean'}, lvl:{type:'Byte'} } };

const records = [
  { _key:'a', n:12,      big:BigInt('9007199254740993'), d:1.5,  ok:true,  lvl:10 },
  { _key:'b', n:'12.7',  big:'42',                       d:'',   ok:'yes', lvl:'0x10' },
  { _key:'c', n:'1,000', big:12,                         d:1e21, ok:false, lvl:null },
];

const prep = prepareObjectIngest(CONFIG, 'vo', records, { source: FILE });
writeFileSync(FILE, prep.bytes);
await conn.run(prep.sql);
const bad = Number((await (await conn.run(buildFailureCountSql('vo'))).getRowsJson())[0][0]);
const rows = (await (await conn.run('SELECT _key, n::VARCHAR, big::VARCHAR, d::VARCHAR, ok::VARCHAR, lvl::VARCHAR FROM vo ORDER BY _key')).getRowsJson());

const f = DataFrame.fromJSON(CONFIG, records);
const dmRow = (i) => ['_key','n','big','d','ok','lvl'].map(k=>{
  const v = f.getColumnOrThrow(k).vector.toJSON()[i];
  return v === undefined || v === null ? null : String(v);
});

console.log('coercion failures flagged:', bad, '\n');
console.log('field   duck                      data-mate                 match');
console.log('-'.repeat(74));
let all = true;
for (let i=0;i<records.length;i++){
  const dm = dmRow(i);
  for (let c=0;c<dm.length;c++){
    const d = rows[i][c] == null ? null : String(rows[i][c]);
    const m = d === dm[c];
    if (!m) all = false;
    console.log(`${['_key','n','big','d','ok','lvl'][c].padEnd(7)} ${String(d).padEnd(25)} ${String(dm[c]).padEnd(25)} ${m?'yes':'NO'}`);
  }
  console.log('-'.repeat(74));
}
console.log(all ? 'ALL MATCH' : 'DIVERGENCES PRESENT');
