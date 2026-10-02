/* eslint-disable no-console -- a probe's output IS its result */
// SUPERSEDED for OUTPUT parity by object-output-parity.mjs. This passes DataFrame's toJSON
// options to DuckFrame.ndjson(), which takes { removeNullFields } - so every "PRESERVE" line here
// is really the default, and the "@preserveNullFields drops nulls" it reports is not real.
// Its storage, schema, bigint and Parquet checks are unaffected.
// Typed objects (declared children) through DuckFrame, end to end, against DataFrame.
import { DataFrame } from '../../../dist/src/index.js';
import { DuckFrame } from '../../../dist/src/duck-frame/index.js';
import { diffSchema, describeColumns } from '../../../dist/src/duck-frame/schema-check.js';
import { FieldType as T } from '@terascope/types';

const S = process.argv[2];
const SPACES = {
    useNullForUndefined: false,
    skipNilValues: true,
    skipEmptyObjects: true,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};
const PRESERVE = {
    useNullForUndefined: true,
    skipNilValues: false,
    skipEmptyObjects: false,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};
const big = '9007199254740993';

const CASES = {
    'object: scalar children': {
        fields: {
            obj: { type: T.Object }, 'obj.name': { type: T.Keyword }, 'obj.count': { type: T.Integer }, 'obj.ratio': { type: T.Double }, 'obj.ok': { type: T.Boolean }
        },
        records: [{ obj: { name: 'a', count: 1, ratio: 0.5, ok: true } }, { obj: { name: 'b' } }, { obj: {} }, {}],
    },
    'object: Long child incl. > 2^53 and negatives': {
        fields: { obj: { type: T.Object }, 'obj.n': { type: T.Long } },
        records: [{ obj: { n: 5 } }, { obj: { n: big } }, { obj: { n: '-9223372036854775808' } }, { obj: { n: '9223372036854775807' } }],
    },
    'object: Date + IP children': {
        fields: { obj: { type: T.Object }, 'obj.at': { type: T.Date }, 'obj.ip': { type: T.IP } },
        records: [{ obj: { at: '2026-09-28T12:34:56.789Z', ip: '10.0.0.1' } }, { obj: { at: 1700000000000 } }],
    },
    'object: array children': {
        fields: { obj: { type: T.Object }, 'obj.tags': { type: T.Keyword, array: true }, 'obj.nums': { type: T.Long, array: true } },
        records: [{ obj: { tags: ['x', 'y'], nums: [1, big] } }, { obj: { tags: [] } }, { obj: { tags: ['z', null] } }],
    },
    'object: nested object (a.b.c)': {
        fields: {
            a: { type: T.Object }, 'a.b': { type: T.Object }, 'a.b.c': { type: T.Keyword }, 'a.b.d': { type: T.Integer }, 'a.e': { type: T.Keyword }
        },
        records: [{ a: { b: { c: 'deep', d: 2 }, e: 'top' } }, { a: { e: 'only-top' } }, { a: { b: {} } }],
    },
    'object: undeclared extra keys': {
        fields: { obj: { type: T.Object }, 'obj.keep': { type: T.Keyword } },
        records: [{ obj: { keep: 'k', drop: 'd', also: 1 } }],
    },
    'object array: array of typed objects': {
        fields: { items: { type: T.Object, array: true }, 'items.sku': { type: T.Keyword }, 'items.qty': { type: T.Integer } },
        records: [{ items: [{ sku: 'a', qty: 1 }, { sku: 'b' }] }, { items: [] }, {}],
    },
    'object: GeoPoint child': {
        fields: { obj: { type: T.Object }, 'obj.loc': { type: T.GeoPoint } },
        records: [{ obj: { loc: { lat: 22.5, lon: -90.5 } } }, { obj: { loc: '33.1,-112.2' } }],
    },
    'tuple: typed positions': {
        fields: { tup: { type: T.Tuple }, 'tup.0': { type: T.Double }, 'tup.1': { type: T.Keyword } },
        records: [{ tup: [1.5, 'a'] }, { tup: [2] }],
    },
};

const norm = (x) => JSON.stringify(x, (k, v) => (typeof v === 'bigint' ? `${v}n` : v));
const collect = async (it) => {
    const out = [];
    for await (const r of it) {
        out.push(r);
    }
    return out;
};

for (const [label, { fields, records }] of Object.entries(CASES)) {
    const config = { version: 1, fields };
    const lines = [];
    const note = (k, ok, detail) => lines.push(`  ${ok ? 'ok  ' : 'DIFF'} ${k}${ok ? '' : `\n        ${detail}`}`);
    let df;
    let dfErr;
    try {
        df = DataFrame.fromJSON(config, records);
    } catch (e) {
        dfErr = e.message;
    }
    let duck;
    try {
        duck = await DuckFrame.fromRecords(config, records);
    } catch (e) {
        console.log(`\n## ${label}\n  DuckFrame.fromRecords THREW: ${e.message.split('\n')[0]}${dfErr ? `\n  (DataFrame threw too: ${dfErr})` : ''}`);
        continue;
    }
    if (dfErr) lines.push(`  DataFrame.fromJSON THREW: ${dfErr}`);
    const cols = await describeColumns(duck);
    lines.push(`  columns: ${JSON.stringify(cols)}`);
    const schema = await diffSchema(duck);
    note('diffSchema', schema.length === 0, norm(schema));

    const rows = await collect(duck.rows());
    if (df) note('rows() vs DataFrame.toJSON(PRESERVE)', norm(rows) === norm(df.toJSON(PRESERVE)), `duck ${norm(rows)}\n        df   ${norm(df.toJSON(PRESERVE))}`);
    for (const [name, opts] of [['SPACES', SPACES], ['PRESERVE', PRESERVE]]) {
        const nd = (await collect(duck.ndjson(opts))).flatMap((s) => s.split('\n')).filter(Boolean);
        if (df) {
            const want = df.toJSON(opts).map((r) => JSON.stringify(r));
            note(`ndjson(${name}) byte-equal DataFrame`, norm(nd) === norm(want), `duck ${nd.join(' ')}\n        df   ${want.join(' ')}`);
        }
        // rows() and ndjson() must agree inside ONE frame (the bigint invariant)
        if (name === 'PRESERVE') note('rows() == JSON.parse(ndjson(PRESERVE))', norm(rows) === norm(nd.map((l) => JSON.parse(l))), `rows ${norm(rows)}\n        nd   ${nd.join(' ')}`);
    }

    // the wire: writeParquet -> fromParquet, and -> create + append({parquet})
    const file = `${S}/typed-${Object.keys(CASES).indexOf(label)}.parquet`;
    await duck.writeParquet(file);
    const back = await DuckFrame.fromParquet(config, file);
    note('parquet -> fromParquet rows() unchanged', norm(await collect(back.rows())) === norm(rows), norm(await collect(back.rows())));
    const acc = await DuckFrame.create(config);
    await acc.append({ parquet: file });
    await acc.append({ parquet: file });
    const accRows = await collect(acc.rows());
    note('create + append({parquet}) x2', norm(accRows) === norm([...rows, ...rows]), norm(accRows));
    note('diffSchema after parquet append', (await diffSchema(acc)).length === 0, norm(await diffSchema(acc)));
    console.log(`\n## ${label}\n${lines.join('\n')}`);
    await Promise.all([duck.destroy(), back.destroy(), acc.destroy()]);
}
process.exit(0);
