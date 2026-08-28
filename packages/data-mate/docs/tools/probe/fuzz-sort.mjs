// Do the two sort mechanisms actually produce wrong OUTPUT, and on what inputs?
const mate = await import('/Users/jarednoble/Projects/terascope/teraslice/packages/data-mate/dist/src/index.js');
const { FieldType } = await import('/Users/jarednoble/Projects/terascope/teraslice/packages/types/dist/src/index.js');
const DF = mate.DataFrame;
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

console.log('=== D1 multi-key: minimal hand case, adversarial input ORDER ===');
{
  const cfg = { version: 1, fields: { a: { type: FieldType.Keyword }, b: { type: FieldType.Integer } } };
  // y2 vs x1 : a says y>x (+1), b:desc says 2 before 1 (-1) -> sum 0 -> "equal" -> input order kept
  const rows = [{ a:'y', b:2 }, { a:'x', b:1 }];
  const got = DF.fromJSON(cfg, rows).orderBy('a:asc','b:desc').toJSON().map(r=>`${r.a}${r.b}`);
  console.log('  input [y2, x1] orderBy a:asc,b:desc -> ', got.join(' '), ' expected: x1 y1? no -> x1 then y2 =>', JSON.stringify(['x1','y2']));
  console.log('  ', JSON.stringify(got)===JSON.stringify(['x1','y2']) ? 'PASS' : '*** BUG CONFIRMED ***');
}

console.log('\n=== D1 multi-key: fuzz 2000 random frames ===');
{
  const cfg = { version: 1, fields: { a: { type: FieldType.Integer }, b: { type: FieldType.Integer } } };
  let fails = 0, firstFail = null;
  for (let t = 0; t < 2000; t++) {
    const n = 3 + Math.floor(rnd()*12);
    const rows = Array.from({length:n}, () => ({ a: Math.floor(rnd()*3), b: Math.floor(rnd()*3) }));
    const got = DF.fromJSON(cfg, rows).orderBy('a:asc','b:desc').toJSON().map(r=>[r.a,r.b]);
    const want = [...rows].map(r=>[r.a,r.b]).sort((x,y)=> x[0]-y[0] || y[1]-x[1]);
    if (JSON.stringify(got)!==JSON.stringify(want)) { fails++; if(!firstFail) firstFail={rows,got,want}; }
  }
  console.log(`  ${fails}/2000 frames sorted incorrectly`);
  if (firstFail) {
    console.log('  first failing input :', JSON.stringify(firstFail.rows.map(r=>`${r.a}${r.b}`)));
    console.log('  actual              :', JSON.stringify(firstFail.got.map(r=>`${r[0]}${r[1]}`)));
    console.log('  correct             :', JSON.stringify(firstFail.want.map(r=>`${r[0]}${r[1]}`)));
  }
  console.log('  ', fails===0 ? 'PASS (no bug observed)' : '*** BUG CONFIRMED ***');
}

console.log('\n=== D2 null-in-string-sort: fuzz 2000 random frames ===');
{
  const cfg = { version: 1, fields: { s: { type: FieldType.Keyword } } };
  const letters = 'abcdefghij'.split('');
  let fails = 0, firstFail = null;
  for (let t = 0; t < 2000; t++) {
    const n = 4 + Math.floor(rnd()*16);
    const rows = Array.from({length:n}, () => ({ s: rnd() < 0.25 ? null : pick(letters) }));
    const got = DF.fromJSON(cfg, rows).orderBy('s:asc').toJSON().map(r=>r.s ?? null);
    const nonNull = got.filter(x=>x!=null);
    const sorted = [...nonNull].sort();
    if (JSON.stringify(nonNull)!==JSON.stringify(sorted)) {
      fails++; if(!firstFail) firstFail={inp:rows.map(r=>r.s??'_'),got:got.map(x=>x??'_'),nonNull,sorted};
    }
  }
  console.log(`  ${fails}/2000 frames had NON-NULL values out of order`);
  if (firstFail) {
    console.log('  first failing input :', firstFail.inp.join(' '));
    console.log('  actual              :', firstFail.got.join(' '));
    console.log('  non-null actual     :', firstFail.nonNull.join(' '));
    console.log('  non-null correct    :', firstFail.sorted.join(' '));
  }
  console.log('  ', fails===0 ? 'PASS (no bug observed)' : '*** BUG CONFIRMED ***');
}

console.log('\n=== D2b: does array SIZE matter (V8 switches sort algorithm)? ===');
{
  const cfg = { version: 1, fields: { s: { type: FieldType.Keyword } } };
  const letters = 'abcdefghijklmnopqrst'.split('');
  for (const n of [8, 16, 22, 23, 32, 64, 128, 512]) {
    let fails = 0;
    for (let t = 0; t < 300; t++) {
      const rows = Array.from({length:n}, () => ({ s: rnd() < 0.25 ? null : pick(letters) }));
      const got = DF.fromJSON(cfg, rows).orderBy('s:asc').toJSON().map(r=>r.s ?? null).filter(x=>x!=null);
      const sorted = [...got].sort();
      if (JSON.stringify(got)!==JSON.stringify(sorted)) fails++;
    }
    console.log(`  n=${String(n).padStart(4)}  ${String(fails).padStart(3)}/300 corrupted`);
  }
}
