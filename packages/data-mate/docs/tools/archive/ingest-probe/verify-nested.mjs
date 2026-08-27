import { writeFileSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';
import { DataFrame } from '@terascope/data-mate';
import { prepareObjectIngest } from '@terascope/data-mate/dist/src/duck-frame/object-ingest.js';
const conn = await (await DuckDBInstance.create(':memory:')).connect();
const F='./vn.json';
const norm = (v) => JSON.stringify(v === undefined ? null : v);

async function cmp(label, fields, records, cols) {
  let dmOut, duckOut;
  try {
    const f = DataFrame.fromJSON({version:1,fields}, records);
    dmOut = records.map((_,i)=>Object.fromEntries(cols.map(k=>[k, f.getColumnOrThrow(k).vector.toJSON()[i] ?? null])));
  } catch(e) { dmOut = 'FAIL'; }
  try {
    const p = prepareObjectIngest({version:1,fields}, 'nn', records, { source: F });
    writeFileSync(F, p.bytes);
    await conn.run(p.sql);
    const r = await (await conn.run(`SELECT ${cols.map(c=>`${c}::VARCHAR`).join(', ')} FROM nn`)).getRowsJson();
    duckOut = r.map(row=>Object.fromEntries(cols.map((k,i)=>[k,row[i]])));
  } catch(e) { duckOut = 'ERR:'+e.message.slice(0,44); }
  console.log(`  ${label.padEnd(34)} dm=${JSON.stringify(dmOut).slice(0,42).padEnd(44)} duck=${JSON.stringify(duckOut).slice(0,44)}`);
}

console.log('--- arrays ---');
const A={tags:{type:'Keyword',array:true}};
await cmp('["a","b"]', A, [{tags:['a','b']}], ['tags']);
await cmp('"a" (castArray)', A, [{tags:'a'}], ['tags']);
await cmp('[]', A, [{tags:[]}], ['tags']);
await cmp('null', A, [{tags:null}], ['tags']);
await cmp('[null,"a"]', A, [{tags:[null,'a']}], ['tags']);
await cmp('[1,2] -> strings', A, [{tags:[1,2]}], ['tags']);
const B={n:{type:'Integer',array:true}};
await cmp('Integer[] ["1e3","1,000"]', B, [{n:['1e3','1,000']}], ['n']);
await cmp('Integer[] [12.7] truncate', B, [{n:[12.7]}], ['n']);
await cmp('Integer[] scalar 5', B, [{n:5}], ['n']);

console.log('--- Object with children ---');
const C={meta:{type:'Object'},'meta.region':{type:'Keyword'},'meta.tier':{type:'Integer'}};
await cmp('{region,tier:"12"}', C, [{meta:{region:'x',tier:'12'}}], ['meta']);
await cmp('{region,tier:"1e3"}', C, [{meta:{region:'x',tier:'1e3'}}], ['meta']);
await cmp('{region} missing tier', C, [{meta:{region:'x'}}], ['meta']);
await cmp('extra key dropped', C, [{meta:{region:'x',tier:1,extra:'zz'}}], ['meta']);
await cmp('null', C, [{meta:null}], ['meta']);

console.log('--- Object, no children ---');
const D={meta:{type:'Object'}};
await cmp('{a:1,b:"x"} passthrough', D, [{meta:{a:1,b:'x'}}], ['meta']);

console.log('--- Tuple ---');
const E={t:{type:'Tuple'},'t.0':{type:'Keyword'},'t.1':{type:'Integer'}};
await cmp('["a","12"]', E, [{t:['a','12']}], ['t']);
await cmp('["a"] pads', E, [{t:['a']}], ['t']);

console.log('--- nested struct in struct ---');
const G={o:{type:'Object'},'o.inner':{type:'Object'},'o.inner.leaf':{type:'Byte'}};
await cmp('{inner:{leaf:"10"}}', G, [{o:{inner:{leaf:'10'}}}], ['o']);

console.log('--- array of objects ---');
const H={rows:{type:'Object',array:true},'rows.id':{type:'Integer'}};
await cmp('[{id:"1"},{id:"2"}]', H, [{rows:[{id:'1'},{id:'2'}]}], ['rows']);
