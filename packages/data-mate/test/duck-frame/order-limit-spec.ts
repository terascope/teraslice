import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        name: { type: FieldType.Keyword },
        bytes: { type: FieldType.Integer },
        group: { type: FieldType.Keyword },
    },
};

/** Deliberately not in `bytes` order, so a sort has something to do. */
const RECORDS = [
    { name: 'c', bytes: 30, group: 'x' },
    { name: 'a', bytes: 10, group: 'x' },
    { name: 'e', bytes: 50, group: 'y' },
    { name: 'b', bytes: 20, group: 'y' },
    { name: 'n', bytes: null, group: 'x' },
    { name: 'd', bytes: 40, group: 'y' },
];

async function collect(frame: DuckFrame): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    for await (const row of frame.rows()) out.push(row);
    return out;
}

async function names(frame: DuckFrame): Promise<string[]> {
    return (await collect(frame)).map((row) => String(row.name));
}

describe('DuckFrame ordering and paging', () => {
    let frame: DuckFrame;

    beforeAll(async () => {
        frame = await DuckFrame.fromRecords(CONFIG, RECORDS, { name: 'ordering' });
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    describe('->orderBy', () => {
        it('should sort ascending given a bare column name', async () => {
            expect(await names(frame.orderBy(['bytes']))).toEqual(
                ['n', 'a', 'b', 'c', 'd', 'e']
            );
        });

        it('should place nulls as DataFrame does by default, not as DuckDB does', async () => {
            // DataFrame's Vector.compare sorts a nil as the SMALLEST value: first ascending,
            // last descending. DuckDB's own default is NULLS_LAST for BOTH directions, so an
            // ascending sort would otherwise move every null to the other end of the page.
            const asc = await names(frame.orderBy(['bytes']));
            const desc = await names(frame.orderBy([
                { expression: 'bytes', direction: 'desc' },
            ]));

            expect(asc[0]).toBe('n');
            expect(desc.at(-1)).toBe('n');
        });

        it('should reject a direction written into a bare string, loudly', async () => {
            // A bare string is the EXPRESSION only - we always emit direction and nulls, so
            // 'bytes DESC' becomes 'bytes DESC ASC NULLS FIRST' and DuckDB rejects it. Loud
            // beats a sort that quietly disagrees with the object form.
            await expect(collect(frame.orderBy(['bytes DESC']))).rejects.toThrow();
        });

        it('should sort descending', async () => {
            expect(await names(frame.orderBy([{ expression: 'bytes', direction: 'desc' }])))
                .toEqual(['e', 'd', 'c', 'b', 'a', 'n']);
        });

        it('should place nulls where asked', async () => {
            const first = frame.orderBy([{ expression: 'bytes', nulls: 'first' }]);
            const last = frame.orderBy([{ expression: 'bytes', nulls: 'last' }]);

            expect(await names(first)).toEqual(['n', 'a', 'b', 'c', 'd', 'e']);
            expect(await names(last)).toEqual(['a', 'b', 'c', 'd', 'e', 'n']);
        });

        it('should sort by several terms in order', async () => {
            const sorted = frame.orderBy([
                '"group"',
                { expression: 'bytes', direction: 'desc' },
            ]);

            expect(await names(sorted)).toEqual(['c', 'a', 'n', 'e', 'd', 'b']);
        });

        it('should accept a raw SQL expression as the sort key', async () => {
            const sorted = frame.orderBy([{ expression: 'bytes % 30', direction: 'desc' }]);

            // 50%30=20, 20%30=20, 40%30=10, 10%30=10, 30%30=0, null stays null
            expect((await names(sorted)).slice(0, 2).sort()).toEqual(['b', 'e']);
        });

        it('should reject an empty sort list', () => {
            expect(() => frame.orderBy([])).toThrow('orderBy requires at least one sort term');
        });

        it('should reject a term with no expression', () => {
            expect(() => frame.orderBy([{ expression: '' }]))
                .toThrow('orderBy requires an expression for every sort term');
        });

        it('should reject a direction that is not asc or desc', () => {
            const bad = [{ expression: 'bytes', direction: 'sideways' }] as never;

            expect(() => frame.orderBy(bad))
                .toThrow('orderBy direction must be \'asc\' or \'desc\', received sideways');
        });

        it('should reject a nulls order that is not first or last', () => {
            const bad = [{ expression: 'bytes', nulls: 'middle' }] as never;

            expect(() => frame.orderBy(bad))
                .toThrow('orderBy nulls must be \'first\' or \'last\', received middle');
        });
    });

    describe('->limit', () => {
        it('should take the first count rows', async () => {
            expect(await names(frame.orderBy(['bytes']).limit(2))).toEqual(['n', 'a']);
        });

        it('should skip offset rows, with no count', async () => {
            expect(await names(frame.orderBy(['bytes']).limit(undefined, 4)))
                .toEqual(['d', 'e']);
        });

        it('should page with both bounds', async () => {
            expect(await names(frame.orderBy(['bytes']).limit(2, 2))).toEqual(['b', 'c']);
        });

        it('should return no rows for a count of zero', async () => {
            expect(await names(frame.limit(0))).toEqual([]);
        });

        it('should return the same frame when neither bound is given', () => {
            expect(frame.limit()).toBe(frame);
        });

        it.each([
            ['a negative count', -1, undefined, 'limit\'s count'],
            ['a fractional count', 1.5, undefined, 'limit\'s count'],
            ['a negative offset', 1, -2, 'limit\'s offset'],
            ['a fractional offset', 1, 2.5, 'limit\'s offset'],
            ['an unsafe count', Number.MAX_SAFE_INTEGER + 2, undefined, 'limit\'s count'],
            ['a NaN count', Number.NaN, undefined, 'limit\'s count'],
        ])('should reject %s', (_label, count, offset, message) => {
            expect(() => frame.limit(count as number, offset as number | undefined))
                .toThrow(message as string);
        });
    });

    describe('composition', () => {
        it('should give the top rows for orderBy then limit', async () => {
            expect(await names(frame.orderBy([{ expression: 'bytes', direction: 'desc' }])
                .limit(2))).toEqual(['e', 'd']);
        });

        it('should sort only the page for limit then orderBy', async () => {
            // Which rows land in the page is the scan's business, so assert the shape:
            // three rows, sorted - not which three.
            const rows = await collect(frame.limit(3).orderBy(['name']));
            const sorted = rows.map((row) => String(row.name));

            expect(sorted).toHaveLength(3);
            expect(sorted).toEqual([...sorted].sort());
        });

        it('should limit the matching rows for orderBy then filter then limit', async () => {
            const top = frame.orderBy(['bytes']).filter('"group" = \'y\'')
                .limit(2);

            expect(await names(top)).toEqual(['b', 'd']);
        });

        it('should filter the page for orderBy then limit then filter', async () => {
            const page = frame.orderBy(['bytes']).limit(3)
                .filter('"group" = \'y\'');

            // The page is n, a, b; only 'b' matches, so fewer than the limit come back.
            expect(await names(page)).toEqual(['b']);
        });

        it('should sort the result of an aggregation', async () => {
            const totals = frame.select(
                { group: '"group"', total: 'sum(bytes)' },
                {
                    version: 1,
                    fields: {
                        group: { type: FieldType.Keyword },
                        total: { type: FieldType.Integer },
                    },
                },
                ['"group"']
            ).orderBy([{ expression: 'total', direction: 'desc' }]);

            expect(await collect(totals)).toEqual([
                { group: 'y', total: 110 },
                { group: 'x', total: 40 },
            ]);
        });
    });

    describe('the ordering marker', () => {
        it('should not be set on a table or an unsorted relation', () => {
            expect(frame.isOrdered).toBeFalse();
            expect(frame.filter('bytes > 0').isOrdered).toBeFalse();
            expect(frame.limit(2).isOrdered).toBeFalse();
        });

        it('should be carried through the operators that preserve order', () => {
            const sorted = frame.orderBy(['bytes']);

            expect(sorted.isOrdered).toBeTrue();
            expect(sorted.filter('bytes > 0').isOrdered).toBeTrue();
            expect(sorted.limit(2, 1).isOrdered).toBeTrue();
            expect(sorted.select({ name: 'name' }).isOrdered).toBeTrue();
        });

        it('should not be carried by materialize, since a table has no ordering', async () => {
            const materialized = await frame.orderBy(['bytes']).materialize();

            expect(materialized.isOrdered).toBeFalse();
            await materialized.destroy();
        });
    });

    describe('the order-safety guard', () => {
        const JOINED: DataTypeConfig = {
            version: 1,
            fields: { name: { type: FieldType.Keyword } },
        };

        const joinOptions = {
            on: 'a.name = b.name',
            select: { name: 'a.name' },
            config: JOINED,
        };

        it('should refuse to join an ordered frame', () => {
            expect(() => frame.orderBy(['bytes']).join(frame, joinOptions))
                .toThrow('join reorders rows');
        });

        it('should refuse to join when the OTHER side is ordered', () => {
            expect(() => frame.join(frame.orderBy(['bytes']), joinOptions))
                .toThrow('join reorders rows');
        });

        it('should refuse to group an ordered frame', () => {
            expect(() => frame.orderBy(['bytes']).select(
                { group: '"group"', total: 'sum(bytes)' },
                CONFIG,
                ['"group"']
            )).toThrow('select with groupBy reorders rows');
        });

        it('should allow a plain projection on an ordered frame', async () => {
            const projected = frame.orderBy(['bytes']).select({ name: 'name' }, {
                version: 1,
                fields: { name: { type: FieldType.Keyword } },
            });

            expect(await names(projected)).toEqual(['n', 'a', 'b', 'c', 'd', 'e']);
        });
    });

    describe('->size on a paged frame', () => {
        it('should count the page, leaving the total to the pre-limit frame', async () => {
            const sorted = frame.orderBy(['bytes']);
            const page = sorted.limit(2);

            expect(await page.size()).toBe(2);
            expect(await sorted.size()).toBe(6);
        });
    });
});
