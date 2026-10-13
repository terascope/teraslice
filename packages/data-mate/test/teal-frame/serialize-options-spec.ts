import 'jest-extended';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DataFrame, SerializeOptions, TealFrame } from '../../src/index.js';

/**
 * TealFrame's JSON output follows `DataFrame`'s `SerializeOptions` - ALL seven of them, in every
 * combination - byte for byte.
 *
 * Spaces sets two combinations, from one flag (`qpl-engine/src/v3/execute/run.ts:174`):
 * `remove_null_fields` true (the default) or false (`@preserveNullFields`). Before 2026-09-29
 * TealFrame took only that flag, and approximated the default with `json_merge_patch`, which strips
 * EVERY null key: it kept an object that had become empty (`"obj":{}`, where `skipEmptyObjects`
 * omits it), kept a null key inside an array of objects, removed a non-finite number's key (which
 * `DataFrame` keeps, as `null`), and stripped nulls inside an untyped object that `DataFrame`
 * copies verbatim. The whole matrix is compared here so a rule cannot be right for one preset only.
*/
const FLAGS = [
    'useNullForUndefined',
    'skipNilValues',
    'skipEmptyArrays',
    'skipNilListValues',
    'skipNilObjectValues',
    'skipEmptyObjects',
    'skipDuplicateObjects',
] as const;

/** Every combination of the seven flags: 128 option sets. */
const COMBINATIONS: SerializeOptions[] = Array.from({ length: 2 ** FLAGS.length }, (_, bits) => (
    Object.fromEntries(FLAGS.map((flag, i) => [flag, Boolean(bits & (1 << i))]))
));

function label(options: SerializeOptions): string {
    const on = FLAGS.filter((flag) => options[flag]);
    return on.length ? on.join('+') : '(none)';
}

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        n: { type: FieldType.Long },
        d: { type: FieldType.Double },
        flag: { type: FieldType.Boolean },
        at: { type: FieldType.Date },
        tags: { type: FieldType.Keyword, array: true },
        nums: { type: FieldType.Long, array: true },
        pt: { type: FieldType.GeoPoint },
        shape: { type: FieldType.GeoJSON },
        obj: { type: FieldType.Object },
        'obj.name': { type: FieldType.Keyword },
        'obj.count': { type: FieldType.Integer },
        'obj.inner': { type: FieldType.Object },
        'obj.inner.x': { type: FieldType.Keyword },
        items: { type: FieldType.Object, array: true },
        'items.sku': { type: FieldType.Keyword },
        'items.qty': { type: FieldType.Integer },
        bag: { type: FieldType.Object },
        anything: { type: FieldType.Any },
    },
};

const FULL = {
    _key: 'a',
    n: '9007199254740993',
    d: 1.25,
    flag: true,
    at: '2026-09-29T01:02:03.456Z',
    tags: ['x', 'y'],
    nums: [1, '9007199254740995'],
    pt: { lat: 12.5, lon: -70.25 },
    shape: { type: 'Point', coordinates: [-90.512345, 22.534567] },
    obj: { name: 'n', count: 3, inner: { x: 'deep' } },
    items: [{ sku: 's1', qty: 1 }, { sku: 's2' }],
    bag: { free: 'form', nested: { v: 1 } },
    anything: { any: ['thing', 1] },
};

const RECORDS = [
    FULL,
    {
        _key: 'b',
        d: Number.NaN, // NOT nil to DataFrame: the key stays, JSON.stringify writes null
        tags: ['x', null],
        nums: [],
        obj: { name: 'only-name' },
        items: [{ sku: 'a' }, null, { sku: 'a' }, {}],
        bag: {},
        anything: null,
    },
    {
        _key: 'c',
        obj: { inner: {} },
        items: [],
        bag: { a: null, b: 1 },
        flag: false,
    },
    {}, // an entirely empty record - dropped under skipEmptyObjects
    FULL, // a duplicate record - dropped under skipDuplicateObjects
    {
        _key: 'f',
        obj: null,
        items: [null],
        tags: [],
        d: Number.POSITIVE_INFINITY,
    },
];

/**
 * **`skipEmptyArrays` is excluded for Tuples, and deliberately.** `TupleVector` counts a position
 * as non-nil only when its vector HAS a `toJSONCompatibleValue` - which `Float`, `String`, `Int`,
 * `Boolean` and `IP` do not - so under `skipEmptyArrays` `DataFrame` drops `[1.5, "a"]` as
 * "empty". That is a DataFrame defect, not a rule; TealFrame drops a tuple only when every
 * position is nil. Pinned below.
*/
const TUPLE_CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        t: { type: FieldType.Tuple },
        't.0': { type: FieldType.Double },
        't.1': { type: FieldType.Keyword },
        ts: { type: FieldType.Tuple, array: true },
        'ts.0': { type: FieldType.Long },
        'ts.1': { type: FieldType.Date },
    },
};

const TUPLE_RECORDS = [
    { _key: 'a', t: [1.5, 'a'], ts: [['9007199254740993', '2026-09-29T01:02:03.456Z'], [2]] },
    { _key: 'b', t: [2], ts: [] },
    { _key: 'c', t: null, ts: [null] },
];

async function collect<T>(iterator: AsyncIterable<T>): Promise<T[]> {
    const out: T[] = [];
    for await (const item of iterator) out.push(item);
    return out;
}

function expected(config: DataTypeConfig, records: unknown[], options: SerializeOptions): string[] {
    return DataFrame.fromJSON(config, records as Record<string, unknown>[])
        .toJSON(options)
        .map((row) => JSON.stringify(row));
}

describe('TealFrame JSON output follows DataFrame SerializeOptions', () => {
    let frame: TealFrame;
    let tuples: TealFrame;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS);
        tuples = await TealFrame.fromRecords(TUPLE_CONFIG, TUPLE_RECORDS);
    });

    afterAll(async () => {
        await Promise.all([frame.destroy(), tuples.destroy()]);
    });

    describe.each(COMBINATIONS.map((options) => [label(options), options]))(
        'with %s',
        (_label, options) => {
            it('should write ndjson() byte-equal to DataFrame', async () => {
                expect(await collect(frame.ndjson(options)))
                    .toEqual(expected(CONFIG, RECORDS, options));
            });

            it('should yield rows() equal to DataFrame', async () => {
                const rows = await collect(frame.rows(options));
                expect(rows.map((row) => JSON.stringify(row)))
                    .toEqual(expected(CONFIG, RECORDS, options));
            });

            if (!options.skipEmptyArrays) {
                it('should write Tuples byte-equal to DataFrame', async () => {
                    expect(await collect(tuples.ndjson(options)))
                        .toEqual(expected(TUPLE_CONFIG, TUPLE_RECORDS, options));
                });
            }
        }
    );

    it('should keep the spaces flag as a shorthand for its two presets', async () => {
        const preset = (removeNullFields: boolean): SerializeOptions => ({
            useNullForUndefined: !removeNullFields,
            skipNilValues: removeNullFields,
            skipEmptyObjects: removeNullFields,
            skipNilObjectValues: true,
            skipDuplicateObjects: false,
        });
        for (const removeNullFields of [true, false]) {
            expect(await collect(frame.ndjson({ removeNullFields })))
                .toEqual(await collect(frame.ndjson(preset(removeNullFields))));
        }
        // no options at all is spaces' default: remove_null_fields true
        expect(await collect(frame.ndjson())).toEqual(await collect(frame.ndjson(preset(true))));
    });

    it('should write the same bytes from writeNDJSON as ndjson() yields', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'serialize-options-'));
        try {
            for (const options of COMBINATIONS) {
                const file = join(dir, 'out.ndjson');
                await frame.writeNDJSON(file, options);
                const written = readFileSync(file, 'utf8').split('\n')
                    .filter(Boolean);
                expect(written).toEqual(await collect(frame.ndjson(options)));
            }
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('should drop a tuple under skipEmptyArrays only when every position is nil', async () => {
        const subject = await TealFrame.fromRecords(TUPLE_CONFIG, [
            { _key: 'a', t: [1.5, 'a'] },
            { _key: 'b', t: [null, null] },
        ]);
        const lines = await collect(subject.ndjson({ skipEmptyArrays: true }));
        await subject.destroy();

        expect(lines).toEqual(['{"_key":"a","t":[1.5,"a"]}', '{"_key":"b"}']);
        // DataFrame drops the populated one too - the defect above
        expect(expected(TUPLE_CONFIG, [{ _key: 'a', t: [1.5, 'a'] }], { skipEmptyArrays: true }))
            .toEqual(['{"_key":"a"}']);
    });
});
