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
});
