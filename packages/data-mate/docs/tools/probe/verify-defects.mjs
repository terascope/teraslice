// Verify each claimed DataFrame defect against the BUILT dist. No assumptions.
const mate = await import('/Users/jarednoble/Projects/terascope/teraslice/packages/data-mate/dist/src/index.js');
const { FieldType } = await import('/Users/jarednoble/Projects/terascope/teraslice/packages/types/dist/src/index.js');
const DF = mate.DataFrame;
const ok = (b) => b ? 'PASS (no bug)' : '*** BUG CONFIRMED ***';

console.log('================ D1: multi-key sort sums comparisons ================');
{
  const cfg = { version: 1, fields: { a: { type: FieldType.Keyword }, b: { type: FieldType.Integer } } };
  const rows = [
    { a: 'x', b: 1 }, { a: 'x', b: 2 }, { a: 'y', b: 1 }, { a: 'y', b: 2 },
  ];
  const got = DF.fromJSON(cfg, rows).orderBy('a:asc', 'b:desc').toJSON().map(r => `${r.a}${r.b}`);
  const want = ['x2', 'x1', 'y2', 'y1'];   // a ascending, then b descending within a
  console.log('  input      ', rows.map(r=>`${r.a}${r.b}`).join(' '));
  console.log('  orderBy    a:asc, b:desc');
  console.log('  expected   ', want.join(' '));
  console.log('  actual     ', got.join(' '));
  console.log(' ', ok(JSON.stringify(got) === JSON.stringify(want)));
  // show the cancellation directly
  const v = mate.Column.fromJSON('a', { type: FieldType.Keyword }, ['x','y']).vector;
  const n = mate.Column.fromJSON('b', { type: FieldType.Integer }, [1,2]).vector;
  console.log('  mechanism: compare("x","y")=', v.compare('x','y'), ' -compare(1,2)=', -n.compare(1,2),
              ' sum=', v.compare('x','y') + (-n.compare(1,2)), '<- 0 means "equal", first key ignored');
}

console.log('\n================ D2: null makes string compare non-transitive ================');
{
  const v = mate.Column.fromJSON('s', { type: FieldType.Keyword }, ['a']).vector;
  console.log('  compare(null,"abc") =', v.compare(null, 'abc'), '   compare("abc",null) =', v.compare('abc', null));
  console.log('  compare("a","z")    =', v.compare('a','z'));
  console.log('  => null == "a" and null == "z" but "a" < "z"  : non-transitive =',
              v.compare(null,'a') === 0 && v.compare(null,'z') === 0 && v.compare('a','z') !== 0);
  const cfg = { version: 1, fields: { s: { type: FieldType.Keyword } } };
  const rows = [{s:'d'},{s:'b'},{s:null},{s:'a'},{s:'c'},{s:null},{s:'e'}];
  const got = DF.fromJSON(cfg, rows).orderBy('s:asc').toJSON().map(r => r.s ?? '_');
  const nonNull = got.filter(x => x !== '_');
  const sorted = [...nonNull].sort();
  console.log('  input      ', rows.map(r=>r.s ?? '_').join(' '));
  console.log('  actual     ', got.join(' '));
  console.log('  non-null   ', nonNull.join(' '), ' <- should be ascending regardless of null placement');
  console.log(' ', ok(JSON.stringify(nonNull) === JSON.stringify(sorted)));
}

console.log('\n================ D3: reverse() corrupts astral characters ================');
{
  const col = mate.Column.fromJSON('s', { type: FieldType.Keyword }, ['abc', '😀x', 'a😀b']);
  const got = mate.dataFrameAdapter(mate.functionConfigRepository.reverse, { field: 's' }).column(col).toJSON();
  console.log('  input   ', JSON.stringify(['abc','😀x','a😀b']));
  console.log('  actual  ', JSON.stringify(got));
  console.log('  expected', JSON.stringify(['cba','x😀','b😀a']));
  const wellFormed = got.every(s => s == null || !/[\uD800-\uDFFF]/.test(s) || s === [...s].join(''));
  console.log('  lone surrogates present:', got.some(s => typeof s === 'string' && /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(s)));
  console.log(' ', ok(JSON.stringify(got) === JSON.stringify(['cba','x😀','b😀a'])));
}

console.log('\n================ D4: numeric string coercion ================');
{
  for (const [type, v, want] of [[FieldType.Integer,'1e3',1000],[FieldType.Integer,'0x10',16],[FieldType.Integer,'12.7',null]]) {
    let got; try { got = mate.Column.fromJSON('n', { type }, [v]).toJSON()[0]; } catch(e){ got='THROW'; }
    console.log(`  ${type} "${v}" -> ${JSON.stringify(got)}   (JS Number("${v}") = ${Number(v)})`);
  }
}

console.log('\n================ D5: Date coercion leaks local timezone ================');
{
  console.log('  process TZ =', Intl.DateTimeFormat().resolvedOptions().timeZone);
  for (const v of ['0', 'Mar 10 2024', '2024-03-10']) {
    let got; try { got = mate.Column.fromJSON('d', { type: FieldType.Date }, [v]).toJSON()[0]; } catch(e){ got='THROW: '+e.message.slice(0,40); }
    console.log(`  Date "${v}" -> ${JSON.stringify(got)}`);
  }
  console.log('  ^ if these shift with TZ, coercion is not deterministic across deployments');
}
