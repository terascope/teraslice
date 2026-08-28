import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';

/**
 * Arrays and objects are in here on purpose: these configs routinely carry them, and a dedup
 * that could not compare a LIST or a STRUCT would be useless for real data.
*/
const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        name: { type: FieldType.Keyword },
        bytes: { type: FieldType.Integer },
        tags: { type: FieldType.Keyword, array: true },
        meta: { type: FieldType.Object },
        'meta.k': { type: FieldType.Keyword },
    },
};

const RECORDS = [
    { name: 'a', bytes: 10, tags: ['x', 'y'], meta: { k: 'v' } },
    { name: 'a', bytes: 10, tags: ['x', 'y'], meta: { k: 'v' } },
    { name: 'b', bytes: 10, tags: ['x', 'y'], meta: { k: 'v' } },
    { name: 'a', bytes: 20, tags: ['x', 'y'], meta: { k: 'v' } },
    { name: 'a', bytes: 10, tags: ['z'], meta: { k: 'v' } },
    { name: 'a', bytes: 10, tags: ['x', 'y'], meta: { k: 'w' } },
];

const NULLABLE = [
    { name: 'n', bytes: null, tags: null, meta: null },
    { name: 'n', bytes: null, tags: null, meta: null },
];

async function collect(frame: DuckFrame): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    for await (const row of frame.rows()) out.push(row);
    return out;
}

describe('DuckFrame->distinct', () => {
    let frame: DuckFrame;

    beforeAll(async () => {
        frame = await DuckFrame.fromRecords(CONFIG, RECORDS, { name: 'dedup' });
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    it('should collapse rows identical across every column', async () => {
        // Of the six records only the first two are identical, so five survive.
        expect(await frame.distinct().size()).toBe(5);
    });

    it('should keep rows that differ in any single column', async () => {
        const rows = await collect(frame.distinct());
        const keys = rows
            .map((row) => `${row.name}|${row.bytes}|${JSON.stringify(row.tags)}|${JSON.stringify(row.meta)}`)
            .sort();

        expect(new Set(keys).size).toBe(5);
        expect(keys).toEqual([
            'a|10|["x","y"]|{"k":"v"}',
            'a|10|["x","y"]|{"k":"w"}',
            'a|10|["z"]|{"k":"v"}',
            'a|20|["x","y"]|{"k":"v"}',
            'b|10|["x","y"]|{"k":"v"}',
        ]);
    });

    it('should compare LIST and STRUCT columns rather than choking on them', async () => {
        // 'a' differs from its duplicate ONLY by the array, and only by the object, in the
        // last two records - so both complex types must take part in the comparison.
        const rows = await collect(frame.distinct());
        const tagShapes = new Set(rows.map((row) => JSON.stringify(row.tags)));
        const metaShapes = new Set(rows.map((row) => JSON.stringify(row.meta)));

        expect(tagShapes).toEqual(new Set(['["x","y"]', '["z"]']));
        expect(metaShapes).toEqual(new Set(['{"k":"v"}', '{"k":"w"}']));
    });

    it('should treat nulls as equal, collapsing rows null in the same columns', async () => {
        const nullable = await DuckFrame.fromRecords(CONFIG, NULLABLE, { name: 'dedup_null' });

        expect(await nullable.size()).toBe(2);
        expect(await nullable.distinct().size()).toBe(1);

        await nullable.destroy();
    });

    it('should compose with filter, deduping only the matching rows', async () => {
        expect(await frame.filter('"bytes" = 10').distinct()
            .size()).toBe(4);
    });

    it('should be sortable afterwards, which is the supported order', async () => {
        const sorted = frame.distinct().orderBy([
            'name', { expression: 'bytes', direction: 'desc' },
        ]);

        expect((await collect(sorted)).map((row) => `${row.name}${row.bytes}`))
            .toEqual(['a20', 'a10', 'a10', 'a10', 'b10']);
    });

    it('should not report itself as ordered', () => {
        expect(frame.distinct().isOrdered).toBeFalse();
    });

    it('should refuse to dedup an ordered frame, since DISTINCT reorders', () => {
        expect(() => frame.orderBy(['name']).distinct())
            .toThrow('distinct reorders rows');
    });
});
