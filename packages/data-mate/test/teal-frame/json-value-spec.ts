import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { TealFrame, buildJsonValue, closeDuckDatabase } from '../../src/index.js';

/**
 * `buildJsonValue` renders one value as the row output renders it, for SQL that needs a value as
 * JSON (a template's variables). DuckDB's `to_json` would write what is stored: a Date as its
 * `{ ms, tz_offset }` struct and a Tuple as an object.
*/
const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        id: { type: FieldType.Keyword },
        when: { type: FieldType.Date },
        big: { type: FieldType.Long },
        n: { type: FieldType.Integer },
        d: { type: FieldType.Double },
        ok: { type: FieldType.Boolean },
        ip: { type: FieldType.IP },
        point: { type: FieldType.GeoPoint },
        pair: { type: FieldType.Tuple },
        'pair.0': { type: FieldType.Keyword },
        'pair.1': { type: FieldType.Date },
        tags: { type: FieldType.Keyword, array: true },
        days: { type: FieldType.Date, array: true },
        obj: { type: FieldType.Object },
        'obj.when': { type: FieldType.Date },
        'obj.name': { type: FieldType.Keyword },
        any: { type: FieldType.Any },
    },
};

const RECORDS = [
    {
        id: 'a',
        when: '2003-05-14T16:11:03.646Z',
        big: '9007199254740993',
        n: 23,
        d: 1.5,
        ok: false,
        ip: '10.0.0.1',
        point: { lat: 46.9, lon: -148.2 },
        pair: ['k', '2020-01-01T00:00:00.000Z'],
        tags: ['x', 'y'],
        days: ['2020-01-01T00:00:00.000Z', null],
        obj: { when: '2021-02-03T04:05:06.007Z', name: 'o' },
        any: { nested: [1, 'two'] },
    },
    { id: 'b' },
];

const FIELDS = Object.keys(CONFIG.fields).filter((field) => field !== 'pair.0' && field !== 'pair.1');

describe('buildJsonValue', () => {
    let frame: TealFrame;
    let rows: Record<string, unknown>[];

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS);
        rows = [];
        const options = { useNullForUndefined: true, skipNilValues: false };
        for await (const line of frame.ndjson(options)) {
            rows.push(JSON.parse(String(line).trim()));
        }
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    it.each(FIELDS)('renders %s as the row output renders it', async (field) => {
        const sql = buildJsonValue(CONFIG, field, undefined, {
            useNullForUndefined: true, skipNilValues: false,
        });
        const values = await frame.rawRows(`SELECT ${sql} FROM ${frame.from}`);
        const path = field.split('.');
        const fromRow = (row: Record<string, unknown>) => path.reduce<unknown>(
            (value, part) => (value as Record<string, unknown> | null)?.[part] ?? null, row
        );

        expect(values.map(([text]) => (text == null ? null : JSON.parse(String(text)))))
            .toEqual(rows.map(fromRow));
    });

    it('writes a Date as ISO 8601, not its stored struct', async () => {
        const [[text]] = await frame.rawRows(`SELECT ${buildJsonValue(CONFIG, 'when')} FROM ${frame.from} LIMIT 1`);
        expect(text).toEqual('"2003-05-14T16:11:03.646Z"');
    });

    it('refuses a field inside a list, or one the config does not have', () => {
        expect(() => buildJsonValue({ version: 1, fields: { x: { type: FieldType.Object, array: true }, 'x.a': { type: FieldType.Keyword } } }, 'x.a'))
            .toThrow(/inside a list/);
        expect(() => buildJsonValue(CONFIG, 'nope')).toThrow(/not in this frame's config/);
    });
});
