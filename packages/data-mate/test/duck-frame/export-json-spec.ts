import 'jest-extended';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';
import { DataFrame } from '../../src/data-frame/index.js';

/**
 * **The export must match `DataFrame` byte for byte.** The output format is a public contract,
 * and DuckDB's native `to_json` does NOT match it - so `DataFrame` itself is the oracle here,
 * not a hand-written expectation that could drift from it.
 *
 * The options are the ones spaces really uses, from `qpl-engine/src/v3/execute/run.ts:174`.
 * `remove_null_fields` defaults to TRUE (`create-execution-plan.ts:94`), so the default output
 * OMITS null fields; `@preserveNullFields` is what turns that off.
*/
const SPACES_DEFAULT = {
    useNullForUndefined: false,
    skipNilValues: true,
    skipEmptyObjects: true,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};

const PRESERVE_NULLS = {
    useNullForUndefined: true,
    skipNilValues: false,
    skipEmptyObjects: false,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};

/** Every type that could render differently, plus the sparse cases. */
const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        description: { type: FieldType.Text },
        flags: { type: FieldType.Byte },
        age: { type: FieldType.Short },
        count: { type: FieldType.Integer },
        total: { type: FieldType.Long },
        score: { type: FieldType.Float },
        ratio: { type: FieldType.Double },
        active: { type: FieldType.Boolean },
        created: { type: FieldType.Date },
        ip: { type: FieldType.IP },
        location: { type: FieldType.GeoPoint },
        tags: { type: FieldType.Keyword, array: true },
        scores: { type: FieldType.Integer, array: true },
        timestamps: { type: FieldType.Date, array: true },
        alwaysNull: { type: FieldType.Keyword },
        metadata: { type: FieldType.Object },
        'metadata.source': { type: FieldType.Keyword },
        'metadata.seen': { type: FieldType.Date },
        'metadata.depth': { type: FieldType.Integer },
    },
};

const RECORDS = [
    {
        _key: 'a',
        description: 'some prose',
        flags: 12,
        age: 44,
        count: 1000,
        total: 9007199254740993n,
        score: 1.5,
        ratio: 0.25,
        active: true,
        created: '2026-08-14T01:02:03.456Z',
        ip: '10.0.0.1',
        location: { lat: 12.5, lon: -70.25 },
        tags: ['x', 'y'],
        scores: [1, 2, 3],
        timestamps: ['2026-01-01T00:00:00.000Z', '2026-06-30T23:59:59.999Z'],
        alwaysNull: null,
        metadata: { source: 'api', seen: '2026-02-02T12:00:00.000Z', depth: 3 },
    },
    {
        _key: 'b',
        description: null,
        flags: null,
        age: 7,
        count: 42,
        total: 5,
        score: null,
        ratio: null,
        active: false,
        created: null,
        ip: null,
        location: null,
        tags: null,
        scores: [],
        timestamps: null,
        alwaysNull: null,
        metadata: null,
    },
];

/** What `DataFrame` produces - the reference every assertion is made against. */
function reference(options: Record<string, boolean>): string[] {
    return DataFrame.fromJSON(CONFIG, RECORDS)
        .toJSON(options)
        .map((row) => JSON.stringify(JSON.parse(JSON.stringify(row))));
}

/** Re-stringify so key ORDER differences do not masquerade as value differences. */
function normalize(lines: string[]): string[] {
    return lines.map((line) => JSON.stringify(JSON.parse(line)));
}

describe('DuckFrame JSON export', () => {
    let frame: DuckFrame;
    const files: string[] = [];

    beforeAll(async () => {
        frame = await DuckFrame.fromRecords(CONFIG, RECORDS, { name: 'export' });
    });

    afterAll(async () => {
        for (const file of files) if (existsSync(file)) unlinkSync(file);
        await frame.destroy();
        await closeDuckDatabase();
    });

    async function collectNdjson(options = {}): Promise<string[]> {
        const lines: string[] = [];
        for await (const line of frame.ndjson(options)) lines.push(line);
        return lines;
    }

    describe('parity with DataFrame', () => {
        it('should match DataFrame exactly, with nulls omitted (the spaces default)', async () => {
            expect(normalize(await collectNdjson())).toEqual(
                normalize(reference(SPACES_DEFAULT))
            );
        });

        it('should match DataFrame with @preserveNullFields', async () => {
            const lines = await collectNdjson({ removeNullFields: false });

            expect(normalize(lines)).toEqual(normalize(reference(PRESERVE_NULLS)));
        });

        it('should omit null keys by default rather than emitting null', async () => {
            const [first] = await collectNdjson();

            expect(Object.hasOwn(JSON.parse(first), 'alwaysNull')).toBeFalse();
        });

        it('should keep null keys when asked to preserve them', async () => {
            const [first] = await collectNdjson({ removeNullFields: false });

            expect(JSON.parse(first).alwaysNull).toBeNull();
        });
    });

    describe('the three divergences from native to_json', () => {
        it('should render a Date as ISO8601, not as DuckDB SQL text', async () => {
            const [first] = await collectNdjson();
            const native = await frame.query(`SELECT to_json(t)::VARCHAR FROM ${frame.from} AS t`);

            expect(JSON.parse(first).created).toBe('2026-08-14T01:02:03.456Z');
            // what it would have been without the correction
            expect(JSON.parse(String(native[0][0])).created).toBe('2026-08-14 01:02:03.456');
        });

        it('should render Dates inside an array and inside an object', async () => {
            const [first] = await collectNdjson();
            const row = JSON.parse(first);

            expect(row.timestamps).toEqual([
                '2026-01-01T00:00:00.000Z', '2026-06-30T23:59:59.999Z',
            ]);
            expect(row.metadata.seen).toBe('2026-02-02T12:00:00.000Z');
        });

        it('should render a Long past MAX_SAFE_INTEGER as a STRING', async () => {
            const [first] = await collectNdjson();

            // A STRING is the point: as a bare number, JSON.parse would round it. That both
            // engines report ...992 for an input of ...993 is the KNOWN `Long` round-trip
            // defect on the shelved list - and reproducing it is correct, because the contract
            // is to match `DataFrame`, not to fix one side and diverge. The parity tests above
            // are what pin that.
            expect(first).toInclude('"9007199254740992"');
            expect(JSON.parse(first).total).toBe('9007199254740992');
            expect(typeof JSON.parse(first).total).toBe('string');
        });

        it('should keep a small Long as a number', async () => {
            const rows = await collectNdjson();

            expect(JSON.parse(rows[1]).count).toBe(42);
        });
    });

    describe('writeNDJSON', () => {
        it('should write the same bytes the stream yields', async () => {
            const path = join(tmpdir(), `export-${process.pid}.ndjson`);
            files.push(path);

            await frame.writeNDJSON(path);
            const written = readFileSync(path, 'utf8').trim()
                .split('\n');

            expect(normalize(written)).toEqual(normalize(await collectNdjson()));
        });

        it('should write one line per row', async () => {
            const path = join(tmpdir(), `export-lines-${process.pid}.ndjson`);
            files.push(path);

            await frame.writeNDJSON(path);

            expect(readFileSync(path, 'utf8').trim()
                .split('\n')).toHaveLength(RECORDS.length);
        });
    });

    describe('composition', () => {
        it('should export the result of a query, not just a whole table', async () => {
            const filtered = frame.filter('"active" = true');
            const lines: string[] = [];
            for await (const line of filtered.ndjson()) lines.push(line);

            expect(lines).toHaveLength(1);
            expect(JSON.parse(lines[0])._key).toBe('a');
        });
    });

    /**
     * **`writeNDJSON` writes with the CSV writer, not `FORMAT JSON`.**
     *
     * It has to. The lines are already JSON strings, so `COPY ... (FORMAT JSON)` would encode
     * them a SECOND time - `{"json":"{\\"a\\":1}"}` - and DuckDB's own row JSON is not
     * `DataFrame`'s anyway. So it writes `FORMAT CSV` with `QUOTE ''`, `ESCAPE ''` and a BEL
     * delimiter, using the CSV writer purely as a line writer.
     *
     * That is only safe while no rendered line can CONTAIN a byte the CSV writer treats as
     * structural - the BEL delimiter, a newline, or a carriage return. JSON escaping is what
     * guarantees it, and this is the test that says so: without it, one control character in one
     * string field would split a row across two lines in an S3 export, silently.
    */
    describe('values that could break the line writer', () => {
        const HOSTILE: Record<string, string> = {
            bel: `a\u0007b`,
            newline: 'a\nb',
            carriageReturn: 'a\r\nb',
            doubleQuote: 'a"b',
            backslash: 'a\\b',
            tab: 'a\tb',
            comma: 'a,b',
            lowControl: `a\u0001b`,
            lineSeparator: `a\u2028b`,
        };

        const HOSTILE_CONFIG: DataTypeConfig = {
            version: 1,
            fields: { label: { type: FieldType.Keyword }, value: { type: FieldType.Keyword } },
        };

        const HOSTILE_RECORDS = Object.entries(HOSTILE)
            .map(([label, value]) => ({ label, value }));

        let hostile: DuckFrame;

        beforeAll(async () => {
            hostile = await DuckFrame.fromRecords(HOSTILE_CONFIG, HOSTILE_RECORDS, {
                name: 'hostile',
            });
        });

        afterAll(async () => {
            await hostile.destroy();
        });

        it('should write exactly one line per row, whatever the strings contain', async () => {
            const path = join(tmpdir(), `export-hostile-${process.pid}.ndjson`);
            files.push(path);

            await hostile.writeNDJSON(path);
            const written = readFileSync(path, 'utf8');

            expect(written.split('\n').filter((line) => line.length > 0))
                .toHaveLength(HOSTILE_RECORDS.length);
        });

        it('should round-trip every hostile value through the file', async () => {
            const path = join(tmpdir(), `export-hostile-rt-${process.pid}.ndjson`);
            files.push(path);

            await hostile.writeNDJSON(path);
            const parsed = readFileSync(path, 'utf8').trim()
                .split('\n')
                .map((line) => JSON.parse(line));

            expect(parsed).toEqual(HOSTILE_RECORDS);
        });

        it('should leave no raw delimiter byte in the file', async () => {
            const path = join(tmpdir(), `export-hostile-bytes-${process.pid}.ndjson`);
            files.push(path);

            await hostile.writeNDJSON(path);
            const bytes = readFileSync(path);

            // the BEL delimiter survives only as the escape sequence \u0007
            expect(bytes.includes(0x07)).toBeFalse();
            expect(readFileSync(path, 'utf8')).toInclude('\\u0007');
        });

        it('should match DataFrame on hostile strings too', async () => {
            const lines: string[] = [];
            for await (const line of hostile.ndjson()) lines.push(line);

            const expected = DataFrame.fromJSON(HOSTILE_CONFIG, HOSTILE_RECORDS)
                .toJSON(SPACES_DEFAULT)
                .map((row) => JSON.stringify(row));

            expect(normalize(lines)).toEqual(normalize(expected));
        });
    });

    /**
     * **Number rendering follows `JSON.stringify`, not DuckDB's.**
     *
     * `to_json` writes an integral double as `5.0`, keeps the sign on `-0`, and writes a bare
     * `Infinity`/`NaN` token that `JSON.parse` REJECTS outright. `DataFrame` goes through
     * `JSON.stringify`, which writes `5`, `0` and `null`.
     *
     * The fixture at the top of this file could not catch any of it, because every float in it
     * (`0.25`, `1.5`) is fractional. It surfaced only when the 30-field BENCHMARK corpus was
     * exported, where `GeoPoint` lat/lon land on whole degrees - 57 of 500 lines differed. So
     * every case here is a **byte** comparison against `DataFrame` itself rather than against a
     * literal, which is the only kind of assertion that would have failed.
    */
    describe('number rendering', () => {
        /** Byte-compares the whole export against `DataFrame`, and hands back the lines. */
        async function expectBytesToMatch(
            config: DataTypeConfig,
            records: Record<string, unknown>[]
        ): Promise<string[]> {
            const subject = await DuckFrame.fromRecords(config, records, {});

            try {
                const lines: string[] = [];
                for await (const value of subject.ndjson()) lines.push(value);

                expect(lines).toEqual(
                    DataFrame.fromJSON(config, records)
                        .toJSON(SPACES_DEFAULT)
                        .map((row) => JSON.stringify(row))
                );

                return lines;
            } finally {
                await subject.destroy();
            }
        }

        const NUMERIC: DataTypeConfig = {
            version: 1,
            fields: {
                aFloat: { type: FieldType.Float },
                aDouble: { type: FieldType.Double },
                aNumber: { type: FieldType.Number },
                aGeo: { type: FieldType.GeoPoint },
                doubles: { type: FieldType.Double, array: true },
                nested: { type: FieldType.Object },
                'nested.ratio': { type: FieldType.Double },
            },
        };

        it('should write an integral float without a decimal point', async () => {
            const [line] = await expectBytesToMatch(NUMERIC, [{
                aFloat: 2,
                aDouble: 5,
                aNumber: 7,
                aGeo: { lat: -90, lon: 180 },
                doubles: [1, 2],
                nested: { ratio: 3 },
            }]);

            // the shape that used to be `5.0`, everywhere it can appear
            expect(line).toInclude('"aDouble":5');
            expect(line).toInclude('"aFloat":2');
            expect(line).toInclude('"aNumber":7');
            expect(line).toInclude('"aGeo":{"lat":-90,"lon":180}');
            expect(line).toInclude('"doubles":[1,2]');
            expect(line).toInclude('"ratio":3');
            expect(line).not.toInclude('.0');
        });

        it('should leave a fractional float exactly as it was', async () => {
            const [line] = await expectBytesToMatch(NUMERIC, [{
                aFloat: 2.5,
                aDouble: 5.25,
                aNumber: 7.125,
                aGeo: { lat: -90.5, lon: 180.25 },
                doubles: [1.5, 2.5],
                nested: { ratio: 3.75 },
            }]);

            expect(line).toInclude('"aDouble":5.25');
            expect(line).toInclude('"doubles":[1.5,2.5]');
        });

        it('should drop the sign from negative zero', async () => {
            const [line] = await expectBytesToMatch(
                { version: 1, fields: { v: { type: FieldType.Double } } },
                [{ v: -0 }]
            );

            expect(line).toBe('{"v":0}');
        });

        it('should render a GeoPoint array and a Boundary the same way', async () => {
            const points = [{ lat: -90, lon: 180 }, { lat: 1.5, lon: 2.5 }];
            const expected = '{"v":[{"lat":-90,"lon":180},{"lat":1.5,"lon":2.5}]}';

            const [asArray] = await expectBytesToMatch(
                { version: 1, fields: { v: { type: FieldType.GeoPoint, array: true } } },
                [{ v: points }]
            );

            // a Boundary is `STRUCT(lat, lon)[]` in its OWN right - the type is the array, so it
            // needs the list treatment even though `array` is not set on the field
            const [asBoundary] = await expectBytesToMatch(
                { version: 1, fields: { v: { type: FieldType.Boundary } } },
                [{ v: points }]
            );

            expect(asArray).toBe(expected);
            expect(asBoundary).toBe(expected);
        });

        it('should stringify a big Long INSIDE an array, as it does a scalar one', async () => {
            const [line] = await expectBytesToMatch(
                { version: 1, fields: { v: { type: FieldType.Long, array: true } } },
                [{ v: [9007199254740993n, 5n] }]
            );

            // ...992 for an input of ...993 is the shelved `Long` round-trip defect, reproduced
            // deliberately: the contract is to match `DataFrame`, not to fix one side
            expect(line).toBe('{"v":["9007199254740992",5]}');
        });

        it('should never write a bare Infinity or NaN, which is not valid JSON', async () => {
            const config: DataTypeConfig = {
                version: 1,
                fields: { v: { type: FieldType.Double } },
            };
            const subject = await DuckFrame.fromRecords(
                config,
                [{ v: Infinity }, { v: -Infinity }, { v: Number.NaN }],
                {}
            );

            try {
                const lines: string[] = [];
                for await (const value of subject.ndjson()) lines.push(value);

                // the point: every line PARSES. Before the correction these were
                // `{"v":Infinity}`, `{"v":-Infinity}` and `{"v":NaN}`, and `JSON.parse` threw on
                // all three - a single infinite value made an exported line unreadable.
                for (const value of lines) expect(() => JSON.parse(value)).not.toThrow();

                // KNOWN DIVERGENCE, and the only one left in the default mode: a non-finite
                // number becomes SQL NULL, and null-stripping then removes the key, where
                // `DataFrame` keeps it as `"v":null`. It cannot be helped while null stripping is
                // `json_merge_patch` - RFC 7396 uses null as the delete sentinel, so there is no
                // way to emit a null that survives it. Both outputs are valid JSON and mean the
                // same thing; only `@preserveNullFields` mode matches byte for byte.
                expect(lines).toEqual(['{}', '{}', '{}']);
            } finally {
                await subject.destroy();
            }
        });

        it('should match DataFrame on a non-finite value when nulls are preserved', async () => {
            const config: DataTypeConfig = {
                version: 1,
                fields: { v: { type: FieldType.Double } },
            };
            const subject = await DuckFrame.fromRecords(config, [{ v: Infinity }], {});

            try {
                const lines: string[] = [];
                for await (const value of subject.ndjson({ removeNullFields: false })) {
                    lines.push(value);
                }

                expect(lines).toEqual(
                    DataFrame.fromJSON(config, [{ v: Infinity }])
                        .toJSON(PRESERVE_NULLS)
                        .map((row) => JSON.stringify(row))
                );
                expect(lines[0]).toBe('{"v":null}');
            } finally {
                await subject.destroy();
            }
        });

        /**
         * **KNOWN DIVERGENCE, pinned: the exponential form loses its `+`.**
         *
         * At `abs(x) >= 1e21` both engines switch to exponential notation, but `JSON.stringify`
         * writes `1e+21` and DuckDB writes `1e21`. It cannot be corrected through the JSON type,
         * which re-normalises every number handed to it - `CAST('1e+21' AS JSON)` renders back as
         * `1e21` - and correcting it would mean assembling the object as raw text and giving up
         * `json_merge_patch` for null stripping. Negative exponents already agree, because they
         * carry their sign: `1e-7` is identical on both sides.
        */
        it('should still diverge on the exponent sign past 1e21', async () => {
            const config: DataTypeConfig = {
                version: 1,
                fields: { v: { type: FieldType.Double } },
            };
            const subject = await DuckFrame.fromRecords(config, [{ v: 1e21 }], {});

            try {
                const lines: string[] = [];
                for await (const value of subject.ndjson()) lines.push(value);

                expect(lines[0]).toBe('{"v":1e21}');
                expect(JSON.stringify({ v: 1e21 })).toBe('{"v":1e+21}');
                // the VALUES still agree, which is why this is tolerable
                expect(JSON.parse(lines[0]).v).toBe(1e21);
            } finally {
                await subject.destroy();
            }
        });

        it('should agree with DataFrame on a negative exponent', async () => {
            const [line] = await expectBytesToMatch(
                { version: 1, fields: { v: { type: FieldType.Double } } },
                [{ v: 1e-7 }]
            );

            expect(line).toBe('{"v":1e-7}');
        });
    });
});
