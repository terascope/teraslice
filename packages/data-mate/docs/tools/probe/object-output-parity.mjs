/* eslint-disable no-console -- a probe's output IS its result */
// Object and Tuple output, DuckFrame vs DataFrame, with the RIGHT options on each side.
// (typed-objects.mjs passed DataFrame's toJSON options to DuckFrame.ndjson(), which takes
// { removeNullFields } - so its "PRESERVE" runs were really the default. This replaces them.)
import { DataFrame } from '../../../dist/src/index.js';
import { DuckFrame } from '../../../dist/src/duck-frame/index.js';
import { FieldType as T } from '@terascope/types';

const MODES = {
    default: {
        duck: {},
        df: {
            useNullForUndefined: false,
            skipNilValues: true,
            skipEmptyObjects: true,
            skipNilObjectValues: true,
            skipDuplicateObjects: false,
        },
    },
    preserveNullFields: {
        duck: { removeNullFields: false },
        df: {
            useNullForUndefined: true,
            skipNilValues: false,
            skipEmptyObjects: false,
            skipNilObjectValues: true,
            skipDuplicateObjects: false,
        },
    },
};

const CASES = {
    'object, partly filled': {
        fields: {
            k: { type: T.Keyword },
            obj: { type: T.Object },
            'obj.name': { type: T.Keyword },
            'obj.count': { type: T.Integer },
        },
        records: [
            { k: 'a', obj: { name: 'a', count: 1 } },
            { k: 'b', obj: { name: 'b' } },
            { k: 'c', obj: {} },
            { k: 'd' },
        ],
    },
    'nested object': {
        fields: {
            k: { type: T.Keyword },
            a: { type: T.Object },
            'a.b': { type: T.Object },
            'a.b.c': { type: T.Keyword },
            'a.e': { type: T.Keyword },
        },
        records: [
            { k: 'a', a: { b: { c: 'deep' }, e: 'top' } },
            { k: 'b', a: { e: 'only-top' } },
            { k: 'c', a: { b: {} } },
        ],
    },
    'array of objects': {
        fields: {
            k: { type: T.Keyword },
            items: { type: T.Object, array: true },
            'items.sku': { type: T.Keyword },
            'items.qty': { type: T.Integer },
        },
        records: [
            { k: 'a', items: [{ sku: 'a', qty: 1 }, { sku: 'b' }] },
            { k: 'b', items: [] },
            { k: 'c' },
        ],
    },
    tuple: {
        fields: {
            k: { type: T.Keyword },
            tup: { type: T.Tuple },
            'tup.0': { type: T.Double },
            'tup.1': { type: T.Keyword },
        },
        records: [
            { k: 'a', tup: [1.5, 'a'] },
            { k: 'b', tup: [2] },
            { k: 'c' },
        ],
    },
    'array of tuples': {
        fields: {
            k: { type: T.Keyword },
            tups: { type: T.Tuple, array: true },
            'tups.0': { type: T.Double },
            'tups.1': { type: T.Keyword },
        },
        records: [{ k: 'a', tups: [[1.5, 'a'], [2]] }],
    },
};

const collect = async (it) => {
    const out = [];
    for await (const item of it) out.push(item);
    return out;
};

for (const [label, { fields, records }] of Object.entries(CASES)) {
    console.log(`\n## ${label}`);
    const config = { version: 1, fields };
    const duck = await DuckFrame.fromRecords(config, records);
    const df = DataFrame.fromJSON(config, records);

    const rows = JSON.stringify(await collect(duck.rows()));
    const dfRows = JSON.stringify(df.toJSON(MODES.preserveNullFields.df));
    console.log(`  ${rows === dfRows ? 'ok  ' : 'DIFF'} rows()`);
    if (rows !== dfRows) console.log(`       duck ${rows}\n       df   ${dfRows}`);

    for (const [mode, { duck: duckOpts, df: dfOpts }] of Object.entries(MODES)) {
        const lines = (await collect(duck.ndjson(duckOpts))).join(' ');
        const want = df.toJSON(dfOpts).map((r) => JSON.stringify(r))
            .join(' ');
        console.log(`  ${lines === want ? 'ok  ' : 'DIFF'} ndjson ${mode}`);
        if (lines !== want) console.log(`       duck ${lines}\n       df   ${want}`);
    }
    await duck.destroy();
}
process.exit(0);
